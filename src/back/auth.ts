import jwt from 'jsonwebtoken'
import { FRONTEND_URL, SECRET_KEY } from './config.js'
import Database, { client, db } from './database.js'
import http from 'http'
import { ObjectId } from 'mongodb'
import { TIncomingMessage, TUser, TValidateReturn } from '../front/javascript/types.js'
import { Utils } from './utils.js'
import Mailer from './mailer.js'
import argon2 from 'argon2'

export default class Auth {
    private static tokenBlacklist: Set<string> = new Set()

    static async createUser(email: string, firstName: string, lastName: string, password: string, passwordBis: string): Promise<TValidateReturn> {
        if (!firstName || !lastName || !email || !password || !passwordBis) {
            return { success: false, message: 'Tous les champs sont recquis' }
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return { success: false, message: 'Format d\'email invalide' }
        }

        if (password !== passwordBis) {
            return { success: false, message: 'Les mots de passe ne sont pas identiques' }
        }

        if (password.length < 6) {
            return { success: false, message: 'Le mot de passe doit avoir au moins 6 caractères' }
        }

        await Database.connect()

        try {
            const existingUser = await db.collection('users').findOne({ email })
            if (existingUser) {
                return { success: false, message: 'L\'utilisateur existe déjà' }
            }
            const _id = new ObjectId()
            const userDbName = `shopncook_${_id}`

            const roles = [
                {
                    db: 'shopncook',
                    permissions: ['author'],
                },
                {
                    db: userDbName,
                    permissions: ['admin', 'author'],
                },
            ]
            await db.collection('users').insertOne({ _id, firstName, lastName, email, password: await this.hashPassword(password), roles, userDbName })
            const userDb = client.db(userDbName)
            await userDb.createCollection('dishes')
            await userDb.createCollection('recipes')
            await userDb.createCollection('categories')
            await userDb.createCollection('ingredients')
            await userDb.createCollection('lists')

            return { success: true, message: 'L\'utilisateur a été créé avec succès' }
        } catch (err) {
            console.error(err)
            return { success: false, message: 'Erreur serveur' }
        }
    }

    static async authenticateUser(email: string, password: string): Promise<TValidateReturn> {
        await Database.connect()
        try {
            const user = await db.collection<TUser>('users').findOne({ email })
            if (!user) {
                return { success: false, message: 'Utilisateur non trouvé' }
            }

            if (!(await this.verifyPassword(user.password, password))) {
                return { success: false, message: 'Identifiants invalides' }
            }

            const token = jwt.sign(user, SECRET_KEY, { expiresIn: '1h' })

            await Database.initUserDbAndCollections(user._id)

            if (!this.authorizeRole(user, 'author')) {
                return { success: false, message: 'Utilisateur non autorisé' }
            }

            return { success: true, token }
        } catch (err) {
            console.error(err)
            return { success: false, message: `Erreur serveur : ${err}` }
        }
    }

    static async requestPasswordReset(email: string): Promise<TValidateReturn> {
        await Database.connect()
        try {
            const user = await db.collection<TUser>('users').findOne({ email })
            if (!user) {
                return { success: false, message: 'Utilisateur non trouvé' }
            }
            const resetToken = jwt.sign(user, SECRET_KEY, { expiresIn: '1h' })
            const resetLink = `${FRONTEND_URL}/resetPassword?token=${resetToken}`
            await Mailer.sendMail(
                email,
                'Demande de réinitialisation du mot de passe',
                `Vous avez demandé une réinitialisation du mot de passe. Veuillez cliquer sur le lien suivant pour réinitialiser votre mot de passe : ${resetLink}`,
                `<p>Vous avez demandé une réinitialisation du mot de passe. Veuillez cliquer sur le lien suivant pour réinitialiser votre mot de passe :</p>
				 <a href="${resetLink}">Réinitialiser le mot de passe</a>`
            )
            return { success: true, message: 'Email de réinitialisation du mot de passe envoyé' }
        } catch (err) {
            console.error(err)
            return { success: false, message: `Erreur serveur : ${err}` }
        }
    }

    static async resetPassword(token: string, password: string): Promise<TValidateReturn> {
        try {
            const decoded = jwt.verify(token, SECRET_KEY) as { email: string }
            await Database.connect()
            const user = await db.collection<TUser>('users').findOne({ email: decoded.email })
            if (!user) {
                return { success: false, message: 'Invalid token or user not found' }
            }
            await db.collection('users').updateOne({ email: user.email }, { $set: { password: await this.hashPassword(password) } })
            return { success: true, message: 'Réinitialisation du mot de passe réussie' }
        } catch (err) {
            console.error(err)
            return { success: false, message: `Erreur serveur : ${err}` }
        }
    }

    static async authenticateToken(req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage>): Promise<TIncomingMessage | boolean> {
        const token = await this.getToken(req, res)
        if (!token) {
            return false
        }
        const jwtToken = token.split('=')[1]
        if (this.isTokenBlacklisted(jwtToken)) {
            await this.loginResponse(req, res, 403, 'Le token a été invalidé')
            return false
        }

        let isTokenValid: TIncomingMessage | boolean = false
        jwt.verify(jwtToken, SECRET_KEY, async (err, user): Promise<void> => {
            req.user = user
            isTokenValid = err || !this.authorizeRole(req.user as TUser, 'author') ? false : req
        })
        if (!isTokenValid) await this.loginResponse(req, res, 403, 'Le token est invalide')
        await Database.initUserDbAndCollections((req.user as TUser)._id)
        // Retourne false ou req si valide
        return isTokenValid
    }

    static authorizeRole(user: TUser, role: string): boolean {
        return !(!user || !user.roles.find((pRole): boolean => pRole.permissions.includes(role) && pRole.db === user?.userDbName))
    }

    static addToBlacklist(token: string): void {
        this.tokenBlacklist.add(token)
    }

    static async getToken(req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage>): Promise<string | false> {
        const cookies = req.headers.cookie
        if (!cookies) {
            await this.loginResponse(req, res, 401, 'Aucun cookie fourni', false)
            return false
        }

        const token = cookies.split(';').find((c): boolean => c.trim().startsWith('fsTk='))
        if (!token) {
            await this.loginResponse(req, res, 401, 'Aucun token dans les cookies', false)
            return false
        }
        return token
    }

    static async hashPassword(password: string): Promise<string> {
        try {
            return await argon2.hash(password, {
                type: argon2.argon2id,
                memoryCost: 2 ** 16,
                timeCost: 3,
                parallelism: 1,
            })
        } catch (err) {
            throw new Error(`Erreur lors du hachage du mot de passe : ${err}`)
        }
    }

    static async verifyPassword(hash: string, password: string): Promise<boolean> {
        try {
            return await argon2.verify(hash, password)
        } catch (err) {
            console.error(err)
            return false
        }
    }

    private static isTokenBlacklisted(token: string): boolean {
        return this.tokenBlacklist.has(token)
    }

    private static async loginResponse(req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage>, code: number, message: string, isMessageInHtml: boolean = true): Promise<void> {
        if (req.headers['sec-fetch-mode'] === 'cors') {
            res.writeHead(code, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: true, message }))
        } else {
            res.writeHead(code, { 'Content-Type': 'text/html; charset=utf-8' })
            res.end(await Utils.page({ file: 'login.html', className: 'login', title: 'Connexion', errorMessage: isMessageInHtml ? message : '' }))
        }
    }
}

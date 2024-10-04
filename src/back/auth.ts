import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { SECRET_KEY } from './config.js'
import Database, { client, db, userDb } from './database.js'
import http from 'http'
import { ObjectId } from 'mongodb'
import { TIncomingMessage, TUser, TValidateReturn } from '../front/javascript/types.js'
import { Utils } from './utils.js'

export default class Auth {
    private static tokenBlacklist: Set<string> = new Set()

    // TODO compte et possibilité de logout
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

            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, salt)
            const _id = new ObjectId()
            const userDbName = `foodshop_${_id}`

            const roles = [
                {
                    db: 'foodshop',
                    permissions: ['author'],
                },
                {
                    db: userDbName,
                    permissions: ['admin', 'author'],
                },
            ]
            await db.collection('users').insertOne({ _id, firstName, lastName, email, password: hashedPassword, roles })

            const userDb = client.db(userDbName)
            await userDb.createCollection('dishes')
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

            const isMatch = await bcrypt.compare(password, user.password)
            if (!isMatch) {
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

    static async authenticateToken(req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage>): Promise<TIncomingMessage | boolean> {
        const token = await this.getToken(req, res)
        if (!token) {
            return false
        }
        const jwtToken = token.split('=')[1]
        if (this.isTokenBlacklisted(jwtToken)) {
            res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' })
            res.end(await Utils.page({ file: 'login.html', className: 'login', title: 'Connexion', errorMessage: 'Le token a été invalidé' }))
            return false
        }

        let isTokenValid: TIncomingMessage | boolean = false
        jwt.verify(jwtToken, SECRET_KEY, async (err, user): Promise<void> => {
            req.user = user
            isTokenValid = err || !this.authorizeRole(req.user as TUser, 'author') ? false : req
        })
        if (!isTokenValid) {
            res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' })
            res.end(await Utils.page({ file: 'login.html', className: 'login', title: 'Connexion', errorMessage: 'Le token est invalide' }))
        }
        // Retourne false ou req si valide
        return isTokenValid
    }

    static authorizeRole(user: TUser, role: string): boolean {
        return !(!user || !user.roles.find((pRole): boolean => pRole.permissions.includes(role) && pRole.db === userDb?.databaseName))
    }

    static addToBlacklist(token: string): void {
        this.tokenBlacklist.add(token)
    }

    static async getToken(req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage>): Promise<string | false> {
        const cookies = req.headers.cookie
        if (!cookies) {
            res.writeHead(401, { 'Content-Type': 'text/html; charset=utf-8' })
            res.end(await Utils.page({ file: 'login.html', className: 'login', title: 'Connexion' }))
            return false
        }

        const token = cookies.split(';').find((c): boolean => c.trim().startsWith('token='))
        if (!token) {
            res.writeHead(401, { 'Content-Type': 'text/html; charset=utf-8' })
            res.end(await Utils.page({ file: 'login.html', className: 'login', title: 'Connexion' }))
            return false
        }
        return token
    }

    private static isTokenBlacklisted(token: string): boolean {
        return this.tokenBlacklist.has(token)
    }
}

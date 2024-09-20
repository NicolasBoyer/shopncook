import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { SECRET_KEY } from './config.js'
import Database, { client } from './database.js'
import http from 'http'
import { ObjectId } from 'mongodb'
import { TIncomingMessage, TValidateReturn } from '../front/javascript/types.js'
import { Utils } from './utils.js'

type TUser = {
    username: string
    email: string
    password: string
    role: string
    userDbName: string
}

export default class Auth {
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

        const db = await Database.connectDB()

        try {
            const existingUser = await db.collection('users').findOne({ email })
            if (existingUser) {
                return { success: false, message: 'L\'utilisateur existe déjà' }
            }

            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, salt)
            const _id = new ObjectId()
            const userDbName = `foodshop_${_id}`

            const role = [
                {
                    db: 'foodshop',
                    permissions: ['author'],
                },
                {
                    db: userDbName,
                    permissions: ['admin'],
                },
            ]
            await db.collection('users').insertOne({ _id, firstName, lastName, email, password: hashedPassword, role })

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
        const db = await Database.connectDB()

        try {
            const user = await db.collection<TUser>('users').findOne({ email })
            if (!user) {
                return { success: false, message: 'Utilisateur non trouvé' }
            }

            const isMatch = await bcrypt.compare(password, user.password)
            if (!isMatch) {
                return { success: false, message: 'Identifiants invalides' }
            }

            const token = jwt.sign({ userId: user._id, email: user.email }, SECRET_KEY, { expiresIn: '1h' })

            return { success: true, token }
        } catch (err) {
            console.error(err)
            return { success: false, message: 'Erreur serveur' }
        }
    }

    static authorizeRole(req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage>, requiredRole: string): boolean {
        // TODO - A finir
        const user = req.user

        if (typeof user === 'string' || !user) {
            res.writeHead(403, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ message: 'Access denied' }))
            return false
        }

        // Vérification du rôle utilisateur
        if (user.role !== requiredRole) {
            res.writeHead(403, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ message: 'Insufficient permissions' }))
            return false
        }

        return true
    }

    static async authenticateToken(req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage>): Promise<TIncomingMessage | boolean> {
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

        const jwtToken = token.split('=')[1]
        let isTokenValid: TIncomingMessage | boolean = false
        jwt.verify(jwtToken, SECRET_KEY, async (err, user): Promise<void> => {
            if (err) {
                res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' })
                res.end(await Utils.page({ file: 'login.html', className: 'login', title: 'Connexion' }))
            }
            req.user = user
            isTokenValid = err ? false : req
        })
        // Retourne false ou req si valide
        return isTokenValid
    }
}

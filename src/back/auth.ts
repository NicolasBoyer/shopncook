import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { SECRET_KEY } from './config.js'
import Database, { client } from './database.js'
import http from 'http'
import { ObjectId } from 'mongodb'
import { TIncomingMessage } from '../front/javascript/types.js'

type TUser = {
    username: string
    email: string
    password: string
    role: string
    userDbName: string
}

type TValidateReturn = {
    success: boolean
    message?: string
    token?: string
}

export default class Auth {
    static async createUserWithRole(username: string, email: string, password: string, role: string): Promise<TValidateReturn> {
        if (!username || !email || !password) {
            return { success: false, message: 'Tous les champs sont recquis' }
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return { success: false, message: 'Format d\'email invalide' }
        }

        if (password.length < 6) {
            return { success: false, message: 'Le password doit avoir au moins 6 caractères' }
        }

        const db = await Database.connectDB()

        try {
            const existingUser = await db.collection('users').findOne({ email })
            if (existingUser) {
                return { success: false, message: 'L\'utilisateur existe déjà' }
            }

            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, salt)
            const userDbName = `foodshop_${new ObjectId()}`

            await db.collection('users').insertOne({ username, email, password: hashedPassword, role, userDbName })

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
                return { success: false, message: 'Credentials invalides' }
            }

            const token = jwt.sign({ userId: user._id, email: user.email }, SECRET_KEY, { expiresIn: '1h' })

            return { success: true, token }
        } catch (err) {
            return { success: false, message: 'Erreur serveur' }
        }
    }

    static async authenticateToken(req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage>): Promise<boolean> {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]

        if (!token) {
            // res.writeHead(401, { 'Content-Type': 'application/json' })
            // res.end(JSON.stringify({ message: 'Aucun token créé' }))
            res.writeHead(302, { Location: '/login' })
            res.end()
            return false
        }

        jwt.verify(token, SECRET_KEY, async (err, user): Promise<boolean> => {
            if (err) {
                // res.writeHead(403, { 'Content-Type': 'application/json' })
                // res.end(JSON.stringify({ message: 'Token invalide' }))
                res.writeHead(302, { Location: '/login' })
                res.end()
                return false
            }
            req.user = user
            return true
        })
        return false
    }
}

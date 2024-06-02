import dotenv from 'dotenv'

dotenv.config()

export const PORT = process.env.PORT as string
export const SECRET_KEY = process.env.SECRET_KEY as string
export const DB_URL = process.env.DB_URL as string
export const DB_NAME = process.env.DB_NAME as string

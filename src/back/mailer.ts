import { EMAIL_PASS, EMAIL_USER } from './config.js'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.eu',
    port: 465,
    secure: true,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
})

export default class Mailer {
    static async sendMail(to: string, subject: string, text: string, html: string): Promise<void> {
        await transporter.sendMail({
            from: EMAIL_USER,
            to,
            subject,
            text,
            html,
        })
    }
}

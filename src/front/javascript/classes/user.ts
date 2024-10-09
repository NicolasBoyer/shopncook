import { TUser } from '../types.js'
import { Utils } from './utils.js'
import { Caches } from './caches.js'
import { html } from 'lit'

export class User {
    static currentUser: TUser | null = null

    static async getCurrentUser(): Promise<void> {
        const user = (await Utils.request('/db', 'POST', { body: '{ "getCurrentUser": "" }' })) as TUser & { error: string }
        this.currentUser = user.error ? null : user
        document.body.dispatchEvent(new CustomEvent('currentUserAvailable'))
    }

    static async logout(): Promise<void> {
        await Caches.clear()
        await Utils.request('/logout', 'POST')
        location.reload()
    }

    static getAccount(): void {
        Utils.confirm(
            html` <form>
                <label>
                    <span>Identifiant</span>
                    <input name="email" type="email" value="${User.currentUser?.email}" />
                </label>
                <label>
                    <span>Prénom</span>
                    <input name="firstName" type="text" value="${User.currentUser?.firstName}" />
                </label>
                <label>
                    <span>Nom</span>
                    <input name="lastName" type="text" value="${User.currentUser?.lastName}" />
                </label>
                <label>
                    <span>Ancien mot de passe</span>
                    <input name="oldPassword" type="password" />
                </label>
                <label>
                    <span>Nouveau mot de passe</span>
                    <input name="password" type="password" />
                </label>
            </form>`,
            async (): Promise<void> => {
                const accountEntries = Object.fromEntries(new FormData(document.querySelector('form') as HTMLFormElement).entries())
                for (const key of Object.keys(this.currentUser!)) {
                    if (key !== '_id' && this.currentUser![key as keyof typeof this.currentUser] !== accountEntries[key]) {
                        this.currentUser = (await Utils.request('/db', 'POST', { body: `{ "setUser": { "_id": "${this.currentUser!._id}", "${key}": "${accountEntries[key]}" } }` })) as TUser
                    }
                }
                console.log(this.currentUser)
            },
            (): void => {}
        )
    }
}

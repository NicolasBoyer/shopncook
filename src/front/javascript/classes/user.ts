import { TUser } from '../types.js'
import { Utils } from './utils.js'
import { Caches } from './caches.js'
import { html } from 'lit'

export class User {
    static currentUser: TUser | null = null

    static async getCurrentUser(): Promise<void> {
        const user = (await Utils.request('/currentUser')) as TUser & { error: string }
        this.currentUser = user.error ? null : user
        if (this.currentUser) document.body.dispatchEvent(new CustomEvent('currentUserAvailable'))
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
                    <span>Mot de passe</span>
                    <input name="password" type="password" />
                </label>
            </form>`,
            async (): Promise<void> => {
                const accountEntries = Object.fromEntries(new FormData(document.querySelector('fs-confirm form') as HTMLFormElement).entries())
                const userRequest: { setUser: Record<string, string> } = { setUser: {} }
                if (accountEntries['password']) {
                    userRequest.setUser['password'] = accountEntries['password'] as string
                }
                for (const key of Object.keys(this.currentUser!)) {
                    if (key !== '_id' && this.currentUser![key as keyof typeof this.currentUser] !== accountEntries[key]) {
                        userRequest.setUser[key] = accountEntries[key] as string
                    }
                }
                if (Object.keys(userRequest.setUser).length > 0) {
                    userRequest.setUser['_id'] = this.currentUser!._id
                    this.currentUser = (await Utils.request('/db', 'POST', { body: JSON.stringify(userRequest) })) as TUser
                    document.body.dispatchEvent(new CustomEvent('currentUserUpdated'))
                }
            },
            (): void => {}
        )
    }
}

import { TUser } from '../types.js'
import { Utils } from './utils.js'
import { Caches } from './caches.js'
import { html } from 'lit'

export class User {
    static currentUser: TUser | null = null

    static async getCurrentUser(): Promise<void> {
        const user = (await Utils.request('/currentUser')) as TUser & { error: string }
        this.currentUser = user.error ? null : user
    }

    static async logout(): Promise<void> {
        await Caches.clear()
        await Utils.request('/logout', 'POST')
        location.reload()
    }

    static getAccount(): void {
        Utils.confirm(
            html`<form>
                <label>
                    <span>Identifiant</span>
                    <input name="email" required type="email" value="${User.currentUser?.email}" />
                </label>
                <label>
                    <span>Prénom</span>
                    <input name="firstName" required type="text" value="${User.currentUser?.firstName}" />
                </label>
                <label>
                    <span>Nom</span>
                    <input name="lastName" required type="text" value="${User.currentUser?.lastName}" />
                </label>
                <label>
                    <span>Ancien mot de passe</span>
                    <input name="oldPassword" required type="password" />
                </label>
                <label>
                    <span>Nouveau mot de passe</span>
                    <input name="password" required type="password" />
                </label>
            </form>`,
            (): void => {}
        )
    }
}

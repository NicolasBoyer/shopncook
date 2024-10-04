import { TUser } from '../types.js'
import { Utils } from './utils.js'
import { Caches } from './caches.js'

export class User {
    static currentUser: TUser | null = null

    static async getCurrentUser(): Promise<void> {
        this.currentUser = (await Utils.request('/currentUser')) as TUser
    }

    static async logout(): Promise<void> {
        await Caches.clear()
        await Utils.request('/logout', 'POST')
        location.reload()
    }
}

import { TUser } from '../types.js'
import { Utils } from './utils.js'

export class User {
    static async getCurrentUser(): Promise<TUser> {
        return (await Utils.request('/currentUser')) as TUser
    }
}

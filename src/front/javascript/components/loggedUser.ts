import { html, render } from 'lit'
import { User } from '../classes/user.js'

export default class LoggedUser extends HTMLElement {
    async connectedCallback(): Promise<void> {
        await User.getCurrentUser()
        if (!User.currentUser) return
        this.render()
    }

    private render(): void {
        render(
            html` <details class="dropdown">
                <summary>${User.currentUser?.firstName} ${User.currentUser?.lastName}</summary>
                <ul>
                    <li><a href="#">Compte</a></li>
                    <li><a @click="${(): Promise<void> => User.logout()}" href="#">Se déconnecter</a></li>
                </ul>
            </details>`,
            this
        )
    }
}

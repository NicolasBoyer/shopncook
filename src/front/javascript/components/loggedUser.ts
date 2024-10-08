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
                    <li>
                        <button role="link" href="#">Compte</button>
                    </li>
                    <li>
                        <button @click="${(): Promise<void> => User.logout()}" role="link">Se déconnecter</button>
                    </li>
                </ul>
            </details>`,
            this
        )
    }
}

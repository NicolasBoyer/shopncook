import { html, render } from 'lit'
import { User } from '../classes/user.js'

export default class LoggedUser extends HTMLElement {
    async connectedCallback(): Promise<void> {
		// TODO menu doit etre présent si pas de logged user
        await User.getCurrentUser()
        if (!User.currentUser) return
        this.render()
        document.body.addEventListener('currentUserUpdated', (): void => this.render())
    }

    private render(): void {
        render(
            html` <details class="dropdown">
                <summary>${User.currentUser?.firstName} ${User.currentUser?.lastName}</summary>
                <ul>
                    <li>
                        <button @click="${(): void => User.getAccount()}" role="link" href="#">Compte</button>
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

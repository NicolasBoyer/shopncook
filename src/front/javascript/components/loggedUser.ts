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
            html` <button><span>${User.currentUser?.firstName} ${User.currentUser?.lastName}</span></button>
                <div class="menu">
                    <button @click="${(): Promise<void> => User.logout()}" role="link">
                        <span>Se déconnecter</span>
                    </button>
                </div>`,
            this
        )
    }
}

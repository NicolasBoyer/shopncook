import { html, render } from 'lit'
import { Utils } from '../classes/utils.js'

export default class Signup extends HTMLElement {
    connectedCallback(): void {
        this.render()
        this.setFormListener()
    }

    private setFormListener(): void {
        const form = this.querySelector('form')
        form?.addEventListener('submit', async (pEvent): Promise<void> => {
            pEvent.preventDefault()
            await Utils.request('/signup', 'POST', { body: JSON.stringify(Object.fromEntries(new FormData(form).entries())) })
            //location.href = '/auth'
        })
    }

    private render(): void {
        render(
            html`
                <form>
                    <label>
                        <span>Prénom</span>
                        <input name="firstName" required type="text" />
                    </label>
                    <label>
                        <span>Nom</span>
                        <input name="lastName" required type="text" />
                    </label>
                    <label>
                        <span>Email</span>
                        <input name="mail" required type="email" />
                    </label>
                    <label>
                        <span>Mot de passe</span>
                        <input name="password" required type="password" />
                    </label>
                    <label>
                        <span>Répétez le mot de passe</span>
                        <input name="passwordBis" required type="password" />
                    </label>
                    <button type="submit">
                        <span>S'inscrire</span>
                    </button>
                </form>
            `,
            this
        )
    }
}

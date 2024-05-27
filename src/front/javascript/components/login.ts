import { html, render } from 'lit'
import { Utils } from '../classes/utils.js'

export default class Login extends HTMLElement {
    connectedCallback(): void {
        this.render()
        this.setFormListener()
    }

    private setFormListener(): void {
        const form = this.querySelector('form')
        form?.addEventListener('submit', async (pEvent): Promise<void> => {
            pEvent.preventDefault()
            await Utils.request('/auth', 'POST', { body: JSON.stringify(Object.fromEntries(new FormData(form).entries())) })
            location.href = '/'
        })
    }

    private render(): void {
        render(
            html`
                <form>
                    <label>
                        <span>Identifiant</span>
                        <input name="id" required type="text" />
                    </label>
                    <label>
                        <span>Mot de passe</span>
                        <input name="password" required type="password" />
                    </label>
                    <button type="submit">
                        <span>Envoyer</span>
                    </button>
                </form>
            `,
            this
        )
    }
}

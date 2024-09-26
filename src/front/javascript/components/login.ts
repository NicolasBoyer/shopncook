import { html, render } from 'lit'
import { Utils } from '../classes/utils.js'
import { TValidateReturn } from '../types.js'
import { Caches } from '../classes/caches.js'

export default class Login extends HTMLElement {
    async connectedCallback(): Promise<void> {
        await Caches.clear()
        this.render()
        this.setFormListener()
    }

    private setFormListener(): void {
        const form = this.querySelector('form')
        form?.addEventListener('submit', async (pEvent): Promise<void> => {
            pEvent.preventDefault()
            const result = (await Utils.request('/login', 'POST', { body: JSON.stringify(Object.fromEntries(new FormData(form).entries())) })) as TValidateReturn
            if (result.success) location.reload()
            else Utils.toast('error', result.message as string)
        })
    }

    private render(): void {
        render(
            html`
                <form>
                    <label>
                        <span>Identifiant</span>
                        <input name="email" required type="email" />
                    </label>
                    <label>
                        <span>Mot de passe</span>
                        <input name="password" required type="password" />
                    </label>
                    <button type="submit">
                        <span>Envoyer</span>
                    </button>
                    <a href="/register" role="button">
                        <span>Inscrivez-vous</span>
                    </a>
                </form>
            `,
            this
        )
    }
}

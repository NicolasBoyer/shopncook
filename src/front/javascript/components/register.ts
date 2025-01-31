import { html, render } from 'lit'
import { Utils } from '../classes/utils.js'
import { TValidateReturn } from '../types.js'

export default class Register extends HTMLElement {
    connectedCallback(): void {
        document.body.addEventListener('currentUserAvailable', async (): Promise<void> => {
            location.href = 'app'
        })
        this.render()
        this.setFormListener()
    }

    private setFormListener(): void {
        const form = this.querySelector('form')
        form?.addEventListener('submit', async (pEvent): Promise<void> => {
            pEvent.preventDefault()
            const result = (await Utils.request('/register', 'POST', { body: JSON.stringify(Object.fromEntries(new FormData(form).entries())) })) as TValidateReturn
            if (result.success) location.href = '/'
            else Utils.toast('error', result.message as string)
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

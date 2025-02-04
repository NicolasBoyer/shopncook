import { html, render } from 'lit'
import { Utils } from '../classes/utils.js'
import { TValidateReturn } from '../types.js'

export default class ResetPassword extends HTMLElement {
    async connectedCallback(): Promise<void> {
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
            const entries = Object.fromEntries(new FormData(form).entries())
            entries['token'] = location.search.split('=')[1]
            const result = (await Utils.request('/resetPassword', 'POST', { body: JSON.stringify(entries) })) as TValidateReturn
            if (result.success) {
                // TODO Toast à améliorer ? Pour permettre une réponse après sans setTimeout ?
                Utils.toast('success', result.message as string)
                setTimeout((): void => {
                    location.href = '/'
                }, 4225)
            } else Utils.toast('error', result.message as string)
        })
    }

    private render(): void {
        render(
            html`
                <form>
                    <label>
                        <span>Nouveau mot de passe</span>
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

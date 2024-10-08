import { html, render } from 'lit'
import { User } from '../classes/user.js'

export default class Account extends HTMLElement {
    connectedCallback(): void {
        this.render()
        // this.setFormListener()
    }

    // private setFormListener(): void {
    //     const form = this.querySelector('form')
    //     form?.addEventListener('submit', async (pEvent): Promise<void> => {
    //         pEvent.preventDefault()
    //         const result = (await Utils.request('/register', 'POST', { body: JSON.stringify(Object.fromEntries(new FormData(form).entries())) })) as TValidateReturn
    //         if (result.success) location.href = 'app'
    //         else Utils.toast('error', result.message as string)
    //     })
    // }

    private render(): void {
        render(
            html`
                <form>
                    <label>
                        <span>Identifiant</span>
                        <input name="email" required type="email" value="${User.currentUser?.email}" />
                    </label>
                    <label>
                        <span>Prénom</span>
                        <input name="firstName" required type="text" value="${User.currentUser?.firstName}" />
                    </label>
                    <label>
                        <span>Nom</span>
                        <input name="lastName" required type="text" value="${User.currentUser?.lastName}" />
                    </label>
                    <label>
                        <span>Ancien mot de passe</span>
                        <input name="oldPassword" required type="password" />
                    </label>
                    <label>
                        <span>Nouveau mot de passe</span>
                        <input name="password" required type="password" />
                    </label>
                </form>
            `,
            this
        )
    }
}

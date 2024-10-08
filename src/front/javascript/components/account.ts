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

    private setFormListener(): void {
        // const form = this.querySelector('form')
        // let detail: { choices: string[]; title?: string } = { choices }
        // if (this.choiceMode === 'radio') {
        // 	detail = { ...detail, title: pRecipe.title }
        // }
        console.log(new FormData(this.querySelector('form')))
        const detail = Object.fromEntries(new FormData(this.querySelector('form')!).entries())
        document.body.dispatchEvent(new CustomEvent('modalConfirm', detail))
    }

    private render(): void {
        render(
            html`
                <form>
                    <label>
                        <span>Identifiant</span>
                        <input name="email" type="email" value="${User.currentUser?.email}" @keyup="${(): void => this.setFormListener()}" />
                    </label>
                    <label>
                        <span>Prénom</span>
                        <input name="firstName" type="text" value="${User.currentUser?.firstName}" />
                    </label>
                    <label>
                        <span>Nom</span>
                        <input name="lastName" type="text" value="${User.currentUser?.lastName}" />
                    </label>
                    <label>
                        <span>Ancien mot de passe</span>
                        <input name="oldPassword" type="password" />
                    </label>
                    <label>
                        <span>Nouveau mot de passe</span>
                        <input name="password" type="password" />
                    </label>
                </form>
            `,
            this
        )
    }
}

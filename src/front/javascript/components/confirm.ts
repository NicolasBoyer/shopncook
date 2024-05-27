import { html, render } from 'lit'

export default class Confirm extends HTMLElement {
    private message = ''

    static get observedAttributes(): [string] {
        return ['open']
    }

    get open(): boolean {
        return this.hasAttribute('open')
    }

    set open(pValue) {
        if (pValue) this.setAttribute('open', '')
        else this.removeAttribute('open')
    }

    connectedCallback(): void {
        this.render()
        this.style.display = 'none'
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        if (name === 'open' && oldValue !== newValue) {
            this.style.display = ''
            setTimeout((): void => this.render(), 50)
        }
    }

    private closeDialog(): void {
        this.open = false
        setTimeout((): void => {
            this.style.display = 'none'
            this.message = ''
            this.render()
        }, 225)
    }

    private render(): void {
        render(
            html`
                <dialog ?open="${this.open}">
                    <article>
                        ${this.message}
                        <footer>
                            <a
                                href="#"
                                role="button"
                                class="secondary"
                                @click="${(pEvent: PointerEvent): void => {
                                    pEvent.preventDefault()
                                    this.dispatchEvent(new CustomEvent('modalCancel'))
                                    this.closeDialog()
                                }}"
                                >Cancel</a
                            >
                            <a
                                href="#"
                                role="button"
                                @click="${(pEvent: PointerEvent): void => {
                                    pEvent.preventDefault()
                                    this.dispatchEvent(new CustomEvent('modalConfirm'))
                                    this.closeDialog()
                                }}"
                                >Confirm</a
                            >
                        </footer>
                    </article>
                </dialog>
            `,
            this
        )
    }
}

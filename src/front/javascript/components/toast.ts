import { html, render } from 'lit'

export default class Toast extends HTMLElement {
    private messageProperty: string | null = null

    static get observedAttributes(): [string] {
        return ['visible']
    }

    get type(): string | null {
        return this.getAttribute('type')
    }

    get message(): string | null {
        return this.getAttribute('message')
    }

    get visible(): string | null {
        return this.getAttribute('visible')
    }

    set visible(pValue: string | null) {
        this.setAttribute('visible', <string>pValue)
    }

    connectedCallback(): void {
        this.render()
        setTimeout((): void => {
            this.messageProperty = this.message
            this.removeAttribute('message')
            this.visible = 'visible'
        }, 50)
        setTimeout((): void => {
            this.visible = ''
            setTimeout((): void => this.remove(), 225)
        }, 4000)
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        if (name === 'visible' && oldValue !== newValue) this.render()
    }

    private render(): void {
        render(html` <div class="toast ${this.type} ${this.visible}" role="alert">${this.messageProperty}</div> `, this)
    }
}

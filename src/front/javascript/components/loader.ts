import { html, render } from 'lit'

export default class Loader extends HTMLElement {
    static get observedAttributes(): [string] {
        return ['visible']
    }

    get visible(): boolean {
        return this.hasAttribute('visible')
    }

    set visible(pValue) {
        if (pValue) this.setAttribute('visible', '')
        else this.removeAttribute('visible')
    }

    connectedCallback(): void {
        this.render()
        this.style.display = 'none'
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        if (name === 'visible' && oldValue !== newValue) {
            if (newValue === '') {
                this.style.display = ''
                setTimeout((): void => this.render(), 20)
            }
            if (newValue === null) {
                this.style.display = 'none'
                setTimeout((): void => this.render(), 20)
            }
        }
    }

    private render(): void {
        render(html`<div class="spinner"></div>`, this)
    }
}

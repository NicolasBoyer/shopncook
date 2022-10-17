import { html, render } from '../thirdParty/litHtml.js'

export default class Loader extends HTMLElement {
	static get observedAttributes () { return ['visible'] }

	get visible () {
		return this.hasAttribute('visible')
	}

	set visible (pValue) {
		if (pValue) this.setAttribute('visible', '')
		else this.removeAttribute('visible')
	}

	connectedCallback () {
		this.#render()
		this.style.display = 'none'
	}

	attributeChangedCallback (name, oldValue, newValue) {
		if (name === 'visible' && oldValue !== newValue) {
			if (newValue === '') {
				this.style.display = ''
				setTimeout(() => this.#render(), 20)
			}
			if (newValue === null) {
				this.style.display = 'none'
				setTimeout(() => this.#render(), 20)
			}
		}
	}

	#render () {
		render(html`
			<div class="spinner"></div>`, this)
	}
}

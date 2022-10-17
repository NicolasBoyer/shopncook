import { html, render } from '../thirdParty/litHtml.js'

export default class Toast extends HTMLElement {
	#messageProperty

	static get observedAttributes () { return ['visible'] }

	get type () {
		return this.getAttribute('type')
	}

	get message () {
		return this.getAttribute('message')
	}

	get visible () {
		return this.getAttribute('visible')
	}

	set visible (pValue) {
		this.setAttribute('visible', pValue)
	}

	connectedCallback () {
		this.#render()
		setTimeout(() => {
			this.#messageProperty = this.message
			this.removeAttribute('message')
			this.visible = 'visible'
		}, 50)
		setTimeout(() => {
			this.visible = ''
			setTimeout(() => this.remove(), 225)
		}, 4000)
	}

	attributeChangedCallback (name, oldValue, newValue) {
		if ((name === 'visible') && oldValue !== newValue) this.#render()
	}

	#render () {
		render(html`
			<div class='toast ${this.type} ${this.visible}' role='alert'>
				${this.#messageProperty}
			</div>
		`, this)
	}
}

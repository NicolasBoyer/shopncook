import { html, render } from '../thirdParty/litHtml.js'

export default class Confirm extends HTMLElement {
	static get observedAttributes () { return ['open'] }

	get open () {
		return this.hasAttribute('open')
	}

	set open (pValue) {
		if (pValue) this.setAttribute('open', '')
		else this.removeAttribute('open')
	}

	connectedCallback () {
		this.#render()
		this.style.display = 'none'
	}

	attributeChangedCallback (name, oldValue, newValue) {
		if ((name === 'open') && oldValue !== newValue) {
			this.style.display = ''
			setTimeout(() => this.#render(), 50)
		}
	}

	#closeDialog () {
		this.open = false
		setTimeout(() => {
			this.style.display = 'none'
			this.message = ''
			this.#render()
		}, 225)
	}

	#render () {
		render(html`
			<dialog ?open="${this.open}">
				<article>
					${this.message}
					<footer>
						<a role="button" class="secondary" @click="${(pEvent) => {
							pEvent.preventDefault()
							this.#closeDialog()
						}}">Cancel</a>
						<a role="button" @click="${(pEvent) => {
							pEvent.preventDefault()
							this.dispatchEvent(new CustomEvent('modalConfirm'))
							this.#closeDialog()
						}}">Confirm</a>
					</footer>
				</article>
			</dialog>
		`, this)
	}
}

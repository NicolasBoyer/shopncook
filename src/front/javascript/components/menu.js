import { html, render } from '../thirdParty/litHtml.js'
import { Utils } from '../classes/utils.js'
import { Caches } from '../classes/caches.js'

export default class Menu extends HTMLElement {
	#links
	#isBurger
	#isHidden

	constructor () {
		super()
		this.style.display = 'none'
	}

	async connectedCallback () {
		this.#links = Caches.get('routes') || await Utils.request('/app/routes.json')
		Caches.set('routes', this.#links)
		this.removeAttribute('style')
		this.#displayMenu()
		window.addEventListener('resize', (pEvent) => this.#displayMenu())
		window.addEventListener('popstate', () => this.#render())
	}

	#displayMenu () {
		this.#isBurger = window.innerWidth <= 1100
		this.#isHidden = window.innerWidth <= 1100
		if (this.#isBurger) this.setAttribute('data-burger', '')
		else this.removeAttribute('data-burger')
		this.#render()
	}

	#render () {
		render(html`
			${this.#isBurger ? html`
				<button class="burger" @click="${() => {
					this.#isHidden = false
					this.#render()
				}}">
					<svg class="burger">
						<use href="#burger"></use>
					</svg>
					<span>Burger Menu</span>
				</button>
			` : ''}
			<div data-hidden="${this.#isHidden}">
				${this.#isBurger ? html`
					<button class="back" @click="${() => {
						this.#isHidden = true
						this.#render()
					}}">
						<svg class="back">
							<use href="#back"></use>
							<span>Retour</span>
						</svg>
					</button>
				` : ''}
				<ul>
					${this.#links.map((pLink) => html`
						<li data-selected="${pLink.path === location.pathname}" @click="${() => this.#displayMenu()}">
							<fs-link href="${pLink.path}" role="button">
								<span>${pLink.label}</span>
							</fs-link>
						</li>
					`)}
				</ul>
			</div>
		`, this)
	}
}

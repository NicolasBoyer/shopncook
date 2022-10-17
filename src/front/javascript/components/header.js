import { html, render } from '../thirdParty/litHtml.js'

export default class Header extends HTMLElement {
	get src () {
		return this.getAttribute('src')
	}

	get alt () {
		return this.getAttribute('alt')
	}

	constructor () {
		super()
		this.#render()
	}

	connectedCallback () {
		const image = this.querySelector('img')
		image.style.transform = `translate3d(0, ${window.scrollY}px, 0)`
		window.addEventListener('scroll', () => {
			image.style.transform = `translate3d(0, ${window.scrollY * 0.5}px, 0)`
			if (window.scrollY >= this.getBoundingClientRect().height) this.firstElementChild.classList.add('titles')
			else this.firstElementChild.classList.remove('titles')
		})
	}

	#render () {
		render(html`
			<div class="image">
				<img alt="${this.alt}" src="${this.src}"/>
			</div>
		`, this)
	}
}

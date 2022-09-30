import { html, render } from '../thirdParty/litHtml.js'
import { Utils } from '../utils.js'

export default class Link extends HTMLElement {
	get href () {
		return this.getAttribute('href')
	}

	set href (pValue) {
		this.setAttribute('open', pValue)
	}

	async connectedCallback () {
		const children = Array.from(this.children)
		this.render()
		this.querySelector('slot').replaceWith(...children)
		const fragment = await GETFRAGMENTHTML(this.href)
		this.addEventListener('click', () => {
			history.pushState({}, '', this.href)
			REPLACEZONE(fragment)
		})
	}

	render () {
		render(html`
			<slot></slot>
		`, this)
	}
}

const REPLACEZONE = (pFragment) => {
	document.querySelector('[data-replaced-zone]').replaceChildren(document.createRange().createContextualFragment(pFragment.text))
	document.body.className = pFragment.class
	document.querySelector('[data-replaced-title]').innerHTML = pFragment.title
}
const GETFRAGMENTHTML = async (pUrl) => {
	const fragment = JSON.parse(sessionStorage.getItem(pUrl)) || await Utils.request(pUrl, 'POST')
	sessionStorage.setItem(pUrl, JSON.stringify(fragment))
	return fragment
}

window.onpopstate = async () => REPLACEZONE(await GETFRAGMENTHTML(location.pathname))

GETFRAGMENTHTML(location.pathname)

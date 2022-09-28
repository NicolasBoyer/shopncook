import { html, render } from '../thirdParty/litHtml.js'
import { Utils } from '../utils.js'

export default class LoadingBlock extends HTMLElement {
	get loadingTimer () {
		return Number(this.getAttribute('loadingTimer'))
	}

	constructor () {
		super()
		this.style.visibility = 'hidden'
	}

	connectedCallback () {
		Utils.loader(true)
		setTimeout(() => {
			Utils.loader(false)
			this.style.visibility = 'visible'
		}, this.loadingTimer)
	}

	render () {
		render(html`
			<slot></slot>
		`, this)
	}
}

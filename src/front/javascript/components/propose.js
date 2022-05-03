import { html, render } from 'https://cdn.jsdelivr.net/npm/lit-html'

export default class Propose extends HTMLElement {
	static get observedAttributes () { return ['list'] }

	get list () {
		return this.getAttribute('list').split(',').filter((pEntry) => pEntry)
	}

	set list (pValue) {
		this.setAttribute('list', pValue)
	}

	connectedCallback () {
		this.input = this.closest('div').querySelector('input')
		this.render()
	}

	attributeChangedCallback (name, oldValue, newValue) {
		if ((name === 'list') && oldValue !== newValue) this.render()
	}

	resetList (pText) {
		if (pText) this.input.value = pText
		this.input.focus()
		this.dispatchEvent(new CustomEvent('listReset'))
	}

	render () {
		render(this.list.length ? html`
			<div class='propose'>
				${this.list.map(
						(pText) => html`
							<a
									href="#"
									@pointerdown="${(pEvent) => {
										pEvent.preventDefault()
										this.resetList(pText)
									}}"
									@keyup="${(pEvent) => {
										if (pEvent.key === 'ArrowDown' && pEvent.target.nextElementSibling) pEvent.target.nextElementSibling.focus()
										if (pEvent.key === 'ArrowUp' && pEvent.target.previousElementSibling) pEvent.target.previousElementSibling.focus()
										if (pEvent.key === 'Enter') this.resetList(pText)
									}}"
							>${pText}</a>
						`)
				}
			</div>
		` : html``, this)
	}
}

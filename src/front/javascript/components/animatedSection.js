import { html, render } from '../thirdParty/litHtml.js'

export default class AnimatedSection extends HTMLElement {
	#animations

	get height () {
		return this.getAttribute('height')
	}

	connectedCallback () {
		this.style.cssText = `height: ${this.height || 8000}px; position: relative;display: block;`
		this.#animations = Array.from(this.querySelectorAll('*')).reduce((pGroup, pChild) => {
			const name = `${pChild.tagName}.${pChild.className}`
			Array.from(pChild.attributes).forEach((pAttribute) => {
				if (pAttribute.name.includes('data')) {
					if (!pGroup[name]) pGroup[name] = []
					const values = pAttribute.name.split('-')
					pGroup[name].push({ element: pChild, lowValue: Number(values[1]), highValue: Number(values[2]), animations: pAttribute.value })
				}
			})
			return pGroup
		}, {})
		const children = Array.from(this.children)
		this.#render()
		this.querySelector('slot').replaceWith(...children)
		document.body.addEventListener('scroll', () => this.#scrollListener())
		this.#scrollListener()
	}

	#scrollListener () {
		const containerRect = document.body.getBoundingClientRect()
		const selfRect = this.getBoundingClientRect()
		if (containerRect.height < selfRect.height) {
			const offTop = containerRect.y - selfRect.y
			const viewHeight = selfRect.height - containerRect.height
			const proportion = offTop / viewHeight
			this.#setAnimations(proportion)
		}
	}

	#setAnimations (proportion) {
		Object.values(this.#animations).forEach((pAnimations) => {
			for (const animation of pAnimations) {
				if (proportion >= animation.lowValue && proportion < animation.highValue || animation.lowValue === 0 && proportion < animation.lowValue) {
					animation.element.style = animation.animations.replaceAll('§§proportion§§', `${proportion}`)
				}
			}
		})
	}

	#render () {
		render(html`
			<div style="height: ${window.innerHeight}px; position: sticky; top: 0;">
				<slot></slot>
			</div>
		`, this)
	}
}

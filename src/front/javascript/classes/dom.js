export class Dom {
	static newDom (element) {
		return this.setCurrent(element)
	}

	static setCurrent (element) {
		this.currentElement = element
		return this
	}

	static elt (name, classes) {
		const element = document.createElement(name)
		if (classes) element.className = classes
		this.currentElement.appendChild(element)
		this.currentElement = element
		return this
	}

	static svg (name) {
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
		svg.classList.add(name)
		const use = document.createElementNS('http://www.w3.org/2000/svg', 'use')
		svg.appendChild(use)
		use.setAttribute('href', `#${name}`)
		this.currentElement.appendChild(svg)
		this.currentElement = svg
		return this
	}

	static att (name, value) {
		if (value !== null) this.currentElement.setAttribute(name, value)
		return this
	}

	static text (text) {
		if (text !== null) this.currentElement.appendChild(document.createTextNode(text))
		return this
	}

	static listen (eventName, listener) {
		this.currentElement.addEventListener(eventName, listener, false)
		return this
	}

	static up () {
		this.currentElement = this.currentElement.parentNode
		if (!this.currentElement) this.currentElement = document.body
		return this
	}

	static clear () {
		this.currentElement.innerHTML = ''
		return this
	}

	static current () {
		return this.currentElement
	}

	static remove () {
		this.currentElement.remove()
	}
}

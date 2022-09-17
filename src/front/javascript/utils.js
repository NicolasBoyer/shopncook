import { html, render } from 'https://cdn.jsdelivr.net/npm/lit-html'

export class Utils {
	static helpers ({ confirmMessage = '', cbConfirm = null, isConfirmInit = true, loaderVisible = false } = {}) {
		render(html`
			<fs-loader ?visible="${loaderVisible}"></fs-loader>
			<fs-confirm .message="${confirmMessage}" ?open="${isConfirmInit ? !isConfirmInit : Math.random()}" @modalConfirm="${() => cbConfirm()}"></fs-confirm>
		`, document.body)
	}

	static loader (visible) {
		this.helpers({ loaderVisible: visible })
	}

	static confirm (message, cbConfirm, isInit) {
		this.helpers({ confirmMessage: message, cbConfirm, isConfirmInit: false })
	}

	static toast (type, message) {
		const bd = Dom.newDom(document.body)
		bd.elt('fs-toast').att('type', type).att('message', message)
	}

	static async request (pUrl, pMethod = 'GET', pOptions, pReturnType) {
		const response = await fetch(pUrl, { ...{ method: pMethod }, ...pOptions })
		if (pReturnType === 'status' && pMethod === 'HEAD') return response.status
		if (response.status !== 200 && response.status !== 204) {
			// eslint-disable-next-line no-console
			console.error('Request failed : ' + response.status)
			// eslint-disable-next-line no-console
			console.log(response)
		} else {
			switch (pReturnType) {
				case 'blob':
					return response.blob()
				case 'text':
					return response.text()
				case 'response':
					return response
				default:
					return response.json()
			}
		}
	}

	static initWsConnection (onClientsMessage, onOpenMessage = () => {}) {
		this.wsConnection = new WebSocket(`${location.protocol === 'http:' ? 'ws:' : 'wss:'}//${location.host}`)
		this.wsConnection.onopen = onOpenMessage
		this.wsConnection.onerror = (error) => {
			console.error('WebSocket Error ' + error)
		}
		this.wsConnection.onmessage = onClientsMessage
	}
}

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

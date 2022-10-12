import { html, render } from '../thirdParty/litHtml.js'
import { Dom } from './dom.js'
import { Caches } from './caches.js'

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

	static initWsConnection () {
		this.wsConnection = new WebSocket(`${location.protocol === 'http:' ? 'ws:' : 'wss:'}//${location.host}`)
	}

	static listenWs (onClientsMessage, onOpenMessage = () => {}) {
		this.wsConnection.onopen = onOpenMessage
		this.wsConnection.onerror = (error) => {
			console.error('WebSocket Error ' + error)
			this.wsConnection.close()
		}
		this.wsConnection.onclose = (e) => {
			console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason)
			setTimeout(() => this.initWsConnection(), 1000)
		}
		this.wsConnection.onmessage = onClientsMessage
		if (Utils.wsConnection.readyState === 1) onOpenMessage()
	}

	static async getFragmentHtml (pUrl) {
		const fragment = Caches.get(pUrl) || await Utils.request(pUrl, 'POST')
		Caches.set(pUrl, fragment)
		return fragment
	}
}

export class WSocket {
	static init (onClientsMessage, onOpenMessage = () => {}) {
		this.connection = new WebSocket(`${location.protocol === 'http:' ? 'ws:' : 'wss:'}//${location.host}`)
		this.connection.onopen = onOpenMessage
		this.connection.onerror = (error) => {
			console.error('WebSocket Error ' + error)
			this.connection.close()
		}
		this.connection.onclose = (e) => {
			console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason)
			setTimeout(() => this.init(onClientsMessage, onOpenMessage), 1000)
		}
		this.connection.onmessage = onClientsMessage
	}

	static send (datas) {
		this.connection.send(datas)
	}
}

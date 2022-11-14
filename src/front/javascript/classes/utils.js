import { html, render } from '../thirdParty/litHtml.js'
import { Dom } from './dom.js'
import { Caches } from './caches.js'

export class Utils {
	static helpers ({ confirmMessage = '', cbConfirm = null, cbCancel = null, isConfirmInit = true, loaderVisible = false } = {}) {
		render(html`
			<fs-loader ?visible="${loaderVisible}"></fs-loader>
			<fs-confirm .message="${confirmMessage}" ?open="${isConfirmInit ? !isConfirmInit : Math.random()}" @modalConfirm="${() => cbConfirm()}" @modalCancel="${() => cbCancel()}"></fs-confirm>
		`, document.body)
	}

	static loader (visible) {
		this.helpers({ loaderVisible: visible })
	}

	static confirm (message, cbConfirm, cbCancel) {
		this.helpers({ confirmMessage: message, cbConfirm, isConfirmInit: false, cbCancel })
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

	static async getFragmentHtml (pUrl) {
		const fragment = Caches.get(pUrl) || await Utils.request(pUrl, 'POST')
		Caches.set(pUrl, fragment)
		return fragment
	}
}

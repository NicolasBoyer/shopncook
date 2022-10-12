export class Websocket {
	static init () {
		this.connection = new WebSocket(`${location.protocol === 'http:' ? 'ws:' : 'wss:'}//${location.host}`)
	}

	static listen (onClientsMessage, onOpenMessage = () => {}) {
		if (this.connection.readyState === 1) onOpenMessage()
		this.connection.onopen = onOpenMessage
		this.connection.onerror = (error) => {
			console.error('WebSocket Error ' + error)
			this.connection.close()
		}
		this.connection.onclose = (e) => {
			console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason)
			setTimeout(() => this.init(), 1000)
		}
		this.connection.onmessage = onClientsMessage
	}

	static send (datas) {
		this.connection.send(JSON.stringify(datas))
	}
}

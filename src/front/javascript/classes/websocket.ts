export class Websocket {
    static connection: WebSocket

    static init(): void {
        this.connection = new WebSocket(`${location.protocol === 'http:' ? 'ws:' : 'wss:'}//${location.host}`)
    }

    static listen(onClientsMessage: (event: MessageEvent) => Promise<void>, onOpenMessage = (): void => {}): void {
        if (this.connection.readyState === 1) onOpenMessage()
        this.connection.onopen = onOpenMessage
        this.connection.onerror = (error): void => {
            console.error('WebSocket Error ' + error)
            this.connection.close()
        }
        this.connection.onclose = (e): void => {
            console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason)
            setTimeout((): void => this.init(), 1000)
        }
        this.connection.onmessage = onClientsMessage
    }

    static send(datas: Record<string, unknown>[]): void {
        this.connection.send(JSON.stringify(datas))
    }
}

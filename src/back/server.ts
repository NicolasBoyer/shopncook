import http from 'http'
import fs from 'fs'
import { Utils } from './utils.js'
import WebSocket, { WebSocketServer } from 'ws'
import { TIncomingMessage } from '../front/javascript/types.js'
import jwt from 'jsonwebtoken'
import { SECRET_KEY } from './config.js'

type TMethod = {
    path: string
    callback: (_req?: http.IncomingMessage, res?: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }) => void
}

const GET: TMethod[] = []
const POST: TMethod[] = []

const includeFiles = [
    {
        regexp: '.css$',
        mimetype: { 'Content-Type': 'text/css' },
    },
    {
        regexp: '.png$',
        mimetype: { 'Content-Type': 'image/png' },
    },
    {
        regexp: '.jpg$',
        mimetype: { 'Content-Type': 'image/jpg' },
    },
    {
        regexp: '.avifs$',
        mimetype: { 'Content-Type': 'image/avifs' },
    },
    {
        regexp: '.otf$',
        mimetype: { 'Content-Type': 'font/otf' },
    },
    // {
    //	regexp: '.svg$',
    //	mimetype: { 'Content-Type': 'image/svg+xml' }
    // },
    {
        regexp: '.js$',
        mimetype: { 'Content-Type': 'text/javascript' },
    },
    // {
    //	regexp: '.ico$',
    //	mimetype: { 'Content-Type': 'image/x-icon' }
    // }
]

export const mimetype = Object.freeze({
    HTML: Symbol('html'),
    JSON: Symbol('json'),
})

export class Server {
    constructor(pPort = 8000) {
        const server = http.createServer(async (req, res): Promise<void> => {
            const response = async (pMethod: TMethod[]): Promise<boolean> => {
                for (const pRoute of pMethod) {
                    const pathArr = pRoute.path.split('/')
                    const urlArr = req.url?.split('/')
                    let id = ''
                    if (pathArr.length === urlArr?.length) {
                        const indexId = pathArr.findIndex((pPath: string): boolean => pPath.includes(':'))
                        if (urlArr[indexId]?.includes(pathArr[indexId]?.split(':')[0])) {
                            id = urlArr[indexId]
                            // Gestion du token de requestPassword -> token
                            const search = id?.split('?')[1]
                            if (search) {
                                const splitSearch = search.split('=')
                                id = splitSearch[0] === 'token' ? splitSearch[1] : ''
                            }
                        }
                    }
                    if (req.url === pRoute.path || id) {
                        if (id) {
                            ;(req as TIncomingMessage).params = {}
                            ;(req as TIncomingMessage).params.id = id
                        }
                        // switch (pRoute.type) {
                        //     case mimetype.HTML:
                        //         res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
                        //         break
                        //     case mimetype.JSON:
                        //         res.writeHead(200, { 'Content-Type': 'application/json' })
                        //         break
                        // }
                        pRoute.callback(req, res)
                        return true
                    }
                }
                return false
            }
            if (req.method === 'GET') {
                const url = Utils.fromFront(<string>req.url)
                for (const pIncludeFile of includeFiles) {
                    if (req.url?.match(pIncludeFile.regexp)) {
                        res.writeHead(200, pIncludeFile.mimetype)
                        fs.createReadStream(url).pipe(res)
                        return
                    }
                }
                if (!(await response(GET))) {
                    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
                    res.end(await Utils.page({ className: 'notFound', templateHtml: '404.html' }))
                }
            }
            if (req.method === 'POST') {
                if (!(await response(POST))) {
                    res.writeHead(404, { 'Content-Type': 'application/json' })
                    res.end(JSON.stringify({ url: '404' }))
                }
            }
        })
        const webSocketServer = new WebSocketServer({ server })
        const userConnections: { [userId: string]: WebSocket[] } = {}
        webSocketServer.on('connection', async (ws: WebSocket, req): Promise<void> => {
            const token = req.headers.cookie?.split(';').find((c): boolean => c.trim().startsWith('fsTk='))
            if (!token) {
                ws.close(1008, 'Authentication token required')
                return
            }

            try {
                const decoded = jwt.verify(token.split('=')[1], SECRET_KEY)
                const userId = (decoded as { email: string }).email
                if (!userConnections[userId]) {
                    userConnections[userId] = []
                }
                userConnections[userId].push(ws)
                console.log(`User ${userId} connected`)
                console.log(`Current connections for user ${userId}:`, userConnections[userId]?.length || 0)

                ws.on('message', (message): void => {
                    console.log(`Received message from user ${userId}: ${message}`)
                    userConnections[userId].forEach((client): void => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(message)
                        }
                    })
                })

                ws.on('close', (): void => {
                    console.log(`User ${userId} disconnected`)
                    userConnections[userId] = userConnections[userId].filter((client): boolean => client !== ws)
                    console.log(`Current connections for user ${userId}:`, userConnections[userId]?.length || 0)
                })
            } catch (error) {
                console.error('Invalid authentication token:', error)
                ws.close(1008, 'Invalid authentication token')
            }
        })
        server.listen(pPort)
    }

    get(pPath: string, pCallback: () => void): void {
        GET.push({ path: pPath, callback: pCallback })
    }

    post(pPath: string, pCallback: () => void): void {
        POST.push({ path: pPath, callback: pCallback })
    }
}

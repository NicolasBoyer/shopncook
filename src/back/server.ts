import http from 'http'
import fs from 'fs'
import { Utils } from './utils.js'
import { WebSocketServer } from 'ws'
import Database from './database.js'

type TMethod = {
    path: string
    callback: (_req?: http.IncomingMessage, res?: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }) => void
    type: symbol
}

type TIncomingMessage = http.IncomingMessage & {
    params: Record<string, string>
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
            const response = async (pMethod: TMethod[]): Promise<void> => {
                for (const pRoute of pMethod) {
                    const pathArr = pRoute.path.split('/')
                    const urlArr = req.url?.split('/')
                    let id = ''
                    if (pathArr.length === urlArr?.length) {
                        const indexId = pathArr.findIndex((pPath: string): boolean => pPath.includes(':'))
                        if (
                            indexId &&
                            pathArr.filter((_pPath: string, pIndex: number): boolean => pIndex !== indexId).every((pPath: string, pIndex: number): boolean => pPath === urlArr.filter((_pPath, pIndex): boolean => pIndex !== indexId)[pIndex])
                        )
                            id = urlArr[indexId]
                    }
                    if (req.url === pRoute.path || id) {
                        if (id) {
                            ;(req as TIncomingMessage).params = {}
                            ;(req as TIncomingMessage).params.id = id
                        }
                        switch (pRoute.type) {
                            case mimetype.HTML:
                                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
                                break
                            case mimetype.JSON:
                                res.writeHead(200, { 'Content-Type': 'application/json' })
                                break
                        }
                        // webSocketServer.emit('connection', 'blop')
                        pRoute.callback(req, res)
                        return
                    }
                }
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
                res.end(await Utils.page('404.html', 'notFound', '404 : Page non trouvée'))
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
                if (req.url?.split('/')[1]) {
                    const credentials = req.headers?.cookie?.split('; ').filter((cookie): boolean => cookie.includes('_ma'))[0]
                    if (!credentials || !(await Database.auth(<string>Utils.decrypt(credentials?.split('=')[1])))) {
                        res.writeHead(401, { 'Content-Type': 'text/html; charset=utf-8' })
                        res.end(await Utils.page('login.html', 'login', 'Connexion à la BDD'))
                        return
                    }
                    Database.init()
                }

                response(GET)
            }
            if (req.method === 'POST') response(POST)
        })
        const webSocketServer = new WebSocketServer({ server })
        webSocketServer.on('connection', (ws): void => {
            ws.on('message', (data): void => {
                webSocketServer.clients.forEach((client): void => {
                    // Si le client n'est pas le sender, on envoie les datas
                    if (client !== ws) client.send(data)
                })
            })
        })
        server.listen(pPort)
    }

    get(pPath: string, pCallback: () => void, pType = mimetype.HTML): void {
        GET.push({ path: pPath, callback: pCallback, type: pType })
    }

    post(pPath: string, pCallback: () => void, pType = mimetype.JSON): void {
        POST.push({ path: pPath, callback: pCallback, type: pType })
    }
}

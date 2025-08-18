import { Utils } from './utils.js'
import { Server } from './server.js'
import Database from './database.js'
import http from 'http'
import Auth from './auth.js'
import { TIncomingMessage, TUser } from '../front/javascript/types.js'

export default class Routes {
    routes: Record<string, string>[] = []

    constructor(pServer: Server) {
        // PUBLIC
        // pServer.get('/', async (_req?: TIncomingMessage, res?: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
        //     res?.end(await Utils.page({ file: 'presentation.html', className: 'presentation', templateHtml: 'home.html' }))
        // })

        pServer.get('/register', async (_req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            try {
                res.end(await Utils.page({ file: 'register.html', className: 'register', title: 'Inscription' }))
            } catch (e) {
                this.handleError(res, e)
            }
        })

        pServer.get('/login', async (_req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            try {
                res.end(await Utils.page({ file: 'login.html', className: 'login', title: 'Connexion' }))
            } catch (e) {
                this.handleError(res, e)
            }
        })

        pServer.get('/resetPassword?token=:id', async (_req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            try {
                res.end(await Utils.page({ file: 'resetPassword.html', className: 'resetPassword', title: 'Réinitialisation du mot de passe' }))
            } catch (e) {
                this.handleError(res, e)
            }
        })

        pServer.post('/resetPassword', async (_req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            try {
                let body = ''
                _req.on('data', (pChunk): void => {
                    body += pChunk
                })
                _req.on('end', async (): Promise<http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }> => {
                    try {
                        const { token, password } = JSON.parse(body)
                        const result = await Auth.resetPassword(token, password)
                        res.writeHead(result.success ? 201 : 400, { 'Content-Type': 'application/json' })
                        return res.end(JSON.stringify({ message: result.message, success: result.success }))
                    } catch (e) {
                        this.handleError(res, e)
                    }
                })
            } catch (e) {
                this.handleError(res, e)
            }
        })

        pServer.post('/requestPasswordReset', async (_req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            try {
                let body = ''
                _req.on('data', (pChunk): void => {
                    body += pChunk
                })
                _req.on('end', async (): Promise<http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }> => {
                    try {
                        const { email } = JSON.parse(body)
                        const result = await Auth.requestPasswordReset(email)
                        res.writeHead(result.success ? 201 : 400, { 'Content-Type': 'application/json' })
                        return res.end(JSON.stringify({ message: result.message, success: result.success }))
                    } catch (e) {
                        this.handleError(res, e)
                    }
                })
            } catch (e) {
                this.handleError(res, e)
            }
        })

        // PRIVATE
        this.request(pServer, '/', 'lists.html', 'home', '', true, 'Gérer votre liste')

        this.request(pServer, '/recipe/add', 'recipe.html', 'recipe', 'Les recettes', true, 'Ajouter une recette')

        this.request(pServer, '/recipe/edit/:id', 'recipe.html', 'recipe', 'Les recettes', true)

        this.request(pServer, '/recipes', 'recipes.html', 'recipes', 'Les recettes', true, 'Recettes')

        this.request(pServer, '/ingredients', 'ingredients.html', 'ingredients', 'Les ingrédients', true, 'Ingrédients')

        this.request(pServer, '/categories', 'categories.html', 'categories', 'Les catégories', true, 'Catégories')

        this.request(pServer, '/dishes', 'dishes.html', 'dishes', 'Les plats de la semaine', true, 'Plats de la semaine')

        pServer.get('/routes.json', async (_req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            try {
                if (await Auth.authenticateToken(_req, res)) res.end(JSON.stringify(this.routes))
            } catch (e) {
                this.handleError(res, e)
            }
        })

        pServer.get('/ingredients.json', async (_req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            try {
                if (await Auth.authenticateToken(_req, res)) res.end(JSON.stringify(await Database.request({ getIngredients: '{}' })))
            } catch (e) {
                this.handleError(res, e)
            }
        })

        pServer.get('/lists.json', async (_req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            try {
                if (await Auth.authenticateToken(_req, res)) res.end(JSON.stringify(await Database.request({ getListIngredients: '{}' })))
            } catch (e) {
                this.handleError(res, e)
            }
        })

        pServer.get('/recipes.json', async (_req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            try {
                if (await Auth.authenticateToken(_req, res)) res.end(JSON.stringify(await Database.request({ getRecipes: '{}' })))
            } catch (e) {
                this.handleError(res, e)
            }
        })

        pServer.get('/categories.json', async (_req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            try {
                if (await Auth.authenticateToken(_req, res)) res.end(JSON.stringify(await Database.request({ getCategories: '{}' })))
            } catch (e) {
                this.handleError(res, e)
            }
        })

        pServer.get('/dishes.json', async (_req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            try {
                if (await Auth.authenticateToken(_req, res)) res.end(JSON.stringify(await Database.request({ getDishes: '{}' })))
            } catch (e) {
                this.handleError(res, e)
            }
        })

        pServer.get('/currentUser', async (_req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            try {
                if (await Auth.authenticateToken(_req, res)) {
                    res.writeHead(200, { 'Content-Type': 'application/json' })
                    const currentUser = (await Database.request({ getUser: (_req.user as TUser)._id })) as unknown as TUser
                    res.end(JSON.stringify({ _id: currentUser._id, firstName: currentUser.firstName, lastName: currentUser.lastName, email: currentUser.email }))
                }
            } catch (e) {
                this.handleError(res, e)
            }
        })

        pServer.post('/db', async (_req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            try {
                let body = ''
                _req.on('data', (pChunk): void => {
                    body += pChunk
                })
                _req.on('end', async (): Promise<(http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }) | undefined> => {
                    try {
                        if (await Auth.authenticateToken(_req, res)) {
                            res.writeHead(200, { 'Content-Type': 'application/json' })
                            return res.end(JSON.stringify(await Database.request(JSON.parse(body))))
                        }
                    } catch (err) {
                        this.handleError(res, err)
                    }
                })
            } catch (e) {
                this.handleError(res, e)
            }
        })

        pServer.post('/login', async (_req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            try {
                let body = ''
                _req.on('data', (pChunk): void => {
                    body += pChunk
                })
                _req.on('end', async (): Promise<http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }> => {
                    try {
                        const { email, password } = JSON.parse(body)
                        const result = await Auth.authenticateUser(email, password)
                        // TODO secure ne fonctionne pas si pas en https. A enlever lors de la mise en place en http
                        res.setHeader('Set-Cookie', `fsTk=${result.token}; HttpOnly; Path=/; Secure; SameSite=Strict`)
                        // res!.setHeader('Set-Cookie', `fsTk=${result.token}; HttpOnly; Path=/; SameSite=Strict`)
                        res.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' })
                        return res.end(JSON.stringify({ message: result.success ? 'Connexion réussie' : result.message, success: result.success }))
                    } catch (e) {
                        this.handleError(res, e)
                    }
                })
            } catch (e) {
                this.handleError(res, e)
            }
        })

        pServer.post('/register', async (_req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            try {
                let body = ''
                _req.on('data', (pChunk): void => {
                    body += pChunk
                })
                _req.on('end', async (): Promise<http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }> => {
                    try {
                        const { firstName, lastName, mail, password, passwordBis } = JSON.parse(body)
                        const result = await Auth.createUser(mail, firstName, lastName, password, passwordBis)
                        res.writeHead(result.success ? 201 : 400, { 'Content-Type': 'application/json' })
                        return res.end(JSON.stringify({ message: result.message, success: result.success }))
                    } catch (err) {
                        this.handleError(res, err, 400, 'Invalid request format')
                    }
                })
            } catch (e) {
                this.handleError(res, e)
            }
        })

        pServer.post('/logout', async (_req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            try {
                _req.on('data', (): void => {})
                _req.on('end', async (): Promise<void> => {
                    try {
                        const tokenCookie = await Auth.getToken(_req, res)
                        if (!tokenCookie) {
                            return
                        }
                        Auth.addToBlacklist(tokenCookie.split('=')[1])
                        res.setHeader('Set-Cookie', 'fsTk=; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT')
                        res.writeHead(200, { 'Content-Type': 'application/json' })
                        res.end(JSON.stringify({ result: 'Déconnecté avec succès' }))
                    } catch (e) {
                        this.handleError(res, e)
                    }
                })
            } catch (e) {
                this.handleError(res, e)
            }
        })
    }

    private handleError(res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }, err: any, status = 500, message = 'Server error') {
        console.error(err)
        res.writeHead(status, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: true, message }))
    }

    /**
     * Permet de faire un GET et un POST en même temps sur un fichier
     * GET : retourne une page html
     * POST : retourne un JSON contenant un fragment html, une classe et un titre
     */
    private request(pServer: Server, path: string, file: string, className: string, title: string, addSlashOnUrl: boolean, label = ''): void {
        if (label) {
            this.routes.push({
                path,
                className,
                title,
                label,
            })
        }

        if (addSlashOnUrl) {
            pServer.get(`${path}/`, async (_req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
                try {
                    if (await Auth.authenticateToken(_req, res)) res.end(await Utils.page({ file, className, title }))
                } catch (e) {
                    this.handleError(res, e)
                }
            })
        }

        pServer.get(path, async (_req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            try {
                if (await Auth.authenticateToken(_req, res)) res.end(await Utils.page({ file, className, title }))
            } catch (e) {
                this.handleError(res, e)
            }
        })

        pServer.post(path, async (_req: TIncomingMessage, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            try {
                if (await Auth.authenticateToken(_req, res)) res.end(JSON.stringify({ text: await Utils.fragment(file), class: className, title }))
            } catch (e) {
                this.handleError(res, e)
            }
        })
    }
}

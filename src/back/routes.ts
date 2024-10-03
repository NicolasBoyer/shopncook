import { Utils } from './utils.js'
import { Server } from './server.js'
import Database from './database.js'
import http from 'http'
import Auth from './auth.js'
import { TIncomingMessage } from '../front/javascript/types.js'

export default class Routes {
    routes: Record<string, string>[] = []

    constructor(pServer: Server) {
        // PUBLIC
        pServer.get('/', async (_req?: TIncomingMessage, res?: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            res?.end(await Utils.page({ file: 'presentation.html', className: 'presentation', templateHtml: 'home.html' }))
        })

        pServer.get('/register', async (_req?: TIncomingMessage, res?: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            res?.end(await Utils.page({ file: 'register.html', className: 'register', title: 'Inscription' }))
        })

        pServer.get('/login', async (_req?: TIncomingMessage, res?: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            res?.end(await Utils.page({ file: 'login.html', className: 'login', title: 'Connexion' }))
        })

        // PRIVATE
        this.request(pServer, '/app', 'lists.html', 'home', '', true, 'Gérer votre liste')

        this.request(pServer, '/app/recipe/add', 'recipe.html', 'recipe', 'Les recettes', true, 'Ajouter une recette')

        this.request(pServer, '/app/recipe/edit/:id', 'recipe.html', 'recipe', 'Les recettes', true)

        this.request(pServer, '/app/recipes', 'recipes.html', 'recipes', 'Les recettes', true, 'Recettes')

        this.request(pServer, '/app/ingredients', 'ingredients.html', 'ingredients', 'Les ingrédients', true, 'Ingrédients')

        this.request(pServer, '/app/categories', 'categories.html', 'categories', 'Les catégories', true, 'Catégories')

        this.request(pServer, '/app/dishes', 'dishes.html', 'dishes', 'Les plats de la semaine', true, 'Plats de la semaine')

        pServer.get('/app/routes.json', async (_req?: TIncomingMessage, res?: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            if (await Auth.authenticateToken(_req!, res!)) res?.end(JSON.stringify(this.routes))
        })

        pServer.get('/app/ingredients.json', async (_req?: TIncomingMessage, res?: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            if (await Auth.authenticateToken(_req!, res!)) res?.end(JSON.stringify(await Database.request({ getIngredients: '{}' })))
        })

        pServer.get('/app/lists.json', async (_req?: TIncomingMessage, res?: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            if (await Auth.authenticateToken(_req!, res!)) res?.end(JSON.stringify(await Database.request({ getListIngredients: '{}' })))
        })

        pServer.get('/app/recipes.json', async (_req?: TIncomingMessage, res?: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            if (await Auth.authenticateToken(_req!, res!)) res?.end(JSON.stringify(await Database.request({ getRecipes: '{}' })))
        })

        pServer.get('/app/categories.json', async (_req?: TIncomingMessage, res?: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            if (await Auth.authenticateToken(_req!, res!)) res?.end(JSON.stringify(await Database.request({ getCategories: '{}' })))
        })

        pServer.get('/app/dishes.json', async (_req?: TIncomingMessage, res?: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            if (await Auth.authenticateToken(_req!, res!)) res?.end(JSON.stringify(await Database.request({ getDishes: '{}' })))
        })

        pServer.get('/currentUser', async (_req?: TIncomingMessage, res?: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            if (await Auth.authenticateToken(_req!, res!)) res?.end(JSON.stringify(_req?.user))
        })

        pServer.post('/db', async (_req?: TIncomingMessage, res?: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            let body = ''
            _req?.on('data', (pChunk): void => {
                body += pChunk
            })
            _req?.on('end', async (): Promise<http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }> => {
                try {
                    await Auth.authenticateToken(_req, res!)
                    res!.writeHead(200, { 'Content-Type': 'application/json' })
                    return res!.end(JSON.stringify(await Database.request(JSON.parse(body))))
                } catch (err) {
                    console.error(err)
                    res!.writeHead(500, { 'Content-Type': 'application/json' })
                    return res!.end(JSON.stringify({ message: 'Server error' }))
                }
            })
        })

        pServer.post('/login', async (_req?: TIncomingMessage, res?: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            let body = ''
            _req?.on('data', (pChunk): void => {
                body += pChunk
            })
            _req?.on('end', async (): Promise<http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }> => {
                const { email, password } = JSON.parse(body)
                const result = await Auth.authenticateUser(email, password)
                res!.setHeader('Set-Cookie', `token=${result.token}; HttpOnly; Path=/; Secure; SameSite=Strict`)
                res!.writeHead(result.success ? 200 : 400, { 'Content-Type': 'application/json' })
                return res!.end(JSON.stringify({ message: result.success ? 'Connexion réussie' : result.message, success: result.success }))
            })
        })

        pServer.post('/register', async (_req?: TIncomingMessage, res?: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            let body = ''
            _req?.on('data', (pChunk): void => {
                body += pChunk
            })
            _req?.on('end', async (): Promise<http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }> => {
                try {
                    const { firstName, lastName, mail, password, passwordBis } = JSON.parse(body)
                    const result = await Auth.createUser(mail, firstName, lastName, password, passwordBis)
                    res!.writeHead(result.success ? 201 : 400, { 'Content-Type': 'application/json' })
                    return res!.end(JSON.stringify({ message: result.message, success: result.success }))
                } catch (err) {
                    console.error(err)
                    res!.writeHead(400, { 'Content-Type': 'application/json' })
                    return res!.end(JSON.stringify({ message: 'Invalid request format' }))
                }
            })
        })
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
            pServer.get(`${path}/`, async (_req?: TIncomingMessage, res?: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
                if (await Auth.authenticateToken(_req!, res!)) res?.end(await Utils.page({ file, className, title }))
            })
        }

        pServer.get(path, async (_req?: TIncomingMessage, res?: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            if (await Auth.authenticateToken(_req!, res!)) res?.end(await Utils.page({ file, className, title }))
        })

        pServer.post(path, async (_req?: TIncomingMessage, res?: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }): Promise<void> => {
            if (await Auth.authenticateToken(_req!, res!)) res?.end(JSON.stringify({ text: await Utils.fragment(file), class: className, title }))
        })
    }
}

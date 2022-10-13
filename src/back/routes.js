import { Utils } from './utils.js'
import { mimetype } from './server.js'
import Database from './database.js'

export default class Routes {
	constructor (pServer) {
		this.routes = []

		pServer.get('/', async (req, res) => {
			res.end(await Utils.page('presentation.html', 'presentation', '', 'home.html'))
		})

		this.request(pServer, '/app', 'lists.html', 'home', '', true, 'Gérer votre liste')

		this.request(pServer, '/app/recipe/add', 'recipe.html', 'recipe', 'Les recettes', true, 'Ajouter une recette')

		this.request(pServer, '/app/recipe/edit/:id', 'recipe.html', 'recipe', 'Les recettes', true)

		this.request(pServer, '/app/recipes', 'recipes.html', 'recipes', 'Les recettes', true, 'Recettes')

		this.request(pServer, '/app/ingredients', 'ingredients.html', 'ingredients', 'Les ingrédients', true, 'Ingrédients')

		this.request(pServer, '/app/categories', 'categories.html', 'categories', 'Les catégories', true, 'Catégories')

		this.request(pServer, '/app/dishes', 'dishes.html', 'dishes', 'Les plats de la semaine', true, 'Plats de la semaine')

		pServer.get('/app/routes.json', async (req, res) => {
			res.end(JSON.stringify(this.routes))
		}, mimetype.JSON)

		pServer.get('/app/ingredients.json', async (req, res) => {
			res.end(JSON.stringify(await Database.request({ getIngredients: {} })))
		}, mimetype.JSON)

		pServer.get('/app/lists.json', async (req, res) => {
			res.end(JSON.stringify(await Database.request({ getListIngredients: {} })))
		}, mimetype.JSON)

		pServer.get('/app/recipes.json', async (req, res) => {
			res.end(JSON.stringify(await Database.request({ getRecipes: {} })))
		}, mimetype.JSON)

		pServer.get('/app/categories.json', async (req, res) => {
			res.end(JSON.stringify(await Database.request({ getCategories: {} })))
		}, mimetype.JSON)

		pServer.get('/app/dishes.json', async (req, res) => {
			res.end(JSON.stringify(await Database.request({ getDishes: {} })))
		}, mimetype.JSON)

		pServer.post('/db', async (req, res) => {
			let body = ''
			req.on('data', (pChunk) => {
				body += pChunk
			})
			req.on('end', async () => res.end(JSON.stringify(await Database.request(JSON.parse(body)))))
		})

		pServer.post('/auth', async (req, res) => {
			let body = ''
			req.on('data', (pChunk) => {
				body += pChunk
			})
			req.on('end', async () => {
				const json = JSON.parse(body)
				const credentials = `${json.id}:${json.password}`
				if (await Database.auth(credentials)) res.writeHead(200, { 'Set-Cookie': `_ma=${Utils.crypt(credentials)}; expires=Tue, 19 Jan 2038 03:14:07 GMT` })
				res.end(JSON.stringify('{}'))
			})
		})
	}

	/**
	 * Permet de faire un GET et un POST en même temps sur un fichier
	 * GET : retourne une page html
	 * POST : retourne un JSON contenant un fragment html, une classe et un titre
	 */
	request (pServer, pPath, pFile, pClassName, pTitle, pAddSlashOnUrl, pLabel) {
		if (pLabel) {
			this.routes.push({
				path: pPath,
				className: pClassName,
				title: pTitle,
				label: pLabel
			})
		}

		if (pAddSlashOnUrl) {
			pServer.get(`${pPath}/`, async (req, res) => {
				res.end(await Utils.page(pFile, pClassName, pTitle))
			})
		}

		pServer.get(pPath, async (req, res) => {
			res.end(await Utils.page(pFile, pClassName, pTitle))
		})

		pServer.post(pPath, async (req, res) => {
			res.end(JSON.stringify({ text: await Utils.fragment(pFile), class: pClassName, title: pTitle }))
		})
	}
}

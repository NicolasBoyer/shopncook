import { Utils } from './utils.js'
import Database from './database.js'

export default class Routes {
	constructor (pServer) {
		pServer.get('/', async (req, res) => {
			res.end(await Utils.fragments('home.html', 'home'))
		})

		pServer.get('/recipe/add', async (req, res) => {
			res.end(await Utils.fragments('recipe.html', 'recipe', 'Les recettes'))
		})

		pServer.get('/recipe/edit/:id', async (req, res) => {
			res.end(await Utils.fragments('recipe.html', 'recipe', 'Les recettes'))
		})

		pServer.get('/recipes', async (req, res) => {
			res.end(await Utils.fragments('recipes.html', 'recipes', 'Les recettes'))
		})

		pServer.get('/ingredients', async (req, res) => {
			res.end(await Utils.fragments('ingredients.html', 'ingredients', 'Les ingrédients'))
		})

		pServer.post('/db', async (req, res) => {
			let body = ''
			req.on('data', (pChunk) => {
				body += pChunk
			})
			req.on('end', async () => res.end(JSON.stringify((await Database.init()).request(JSON.parse(body)))))
		})
	}
}

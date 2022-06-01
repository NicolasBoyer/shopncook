import { MongoClient, ObjectId } from 'mongodb'
import { Utils } from './utils.js'

/**
 * Permet la déclaration de la db (ici un fichier json) et de résoudre les requêtes passées dans la fonction request
 */
export default class Database {
	static async auth (credentials) {
		try {
			const splitCredentials = credentials.split(':')
			this.client = await MongoClient.connect(`mongodb+srv://${splitCredentials[0]}:${encodeURIComponent(splitCredentials[1])}@cluster0.camsv.mongodb.net/foodshop?retryWrites=true&w=majority`)
			return true
		} catch (e) {
			return false
		}
	}

	static init () {
		const db = this.client.db('foodshop')
		this.ingredients = db.collection('ingredients')
		this.recipes = db.collection('recipes')
		this.lists = db.collection('lists')
		this.categories = db.collection('categories')
	}

	/**
	 * Retourne ou enregistre des informations dans la db (des fichiers json) en fonction des requêtes reçues dans le resolver
	 * Exemple : { "getRecipes": {"map": "title"} } reçu dans request et traité par la fonction get et résolu par la constante resolvers.
	 * Retourne ce qui est traité dans la fonction getRecipes : les titres des recettes dans un array
	 * À chaque requête doit correspondre une fonction. La key étant la fonction, la value les arguments
	 * Autres exemples :
	 * { "getRecipes": {"slug": "Tartiflette"} } retourne la recette tartiflette avec ses ingrédients via un objet
	 * { "setRecipe": {"slug": "Tagliatelle à la carbonara"} } enregistre {"slug": "Tagliatelle à la carbonara"} dans la db recipes.json
	 * @param datas requête à traiter par la fonction
	 * @returns {*|[]|*[]} retourne un array si request est un array sinon un objet
	 */
	static async request (datas) {
		const resolvers = {
			async getRecipes (args) {
				let recipes = []
				if (args && args.slug) recipes.push(await Database.recipes.findOne({ slug: args.slug }))
				else recipes = await Database.recipes.find().toArray()
				if (args && args.map) recipes = recipes.map((ingredient) => ingredient[args.map])
				else {
					for (const recipe of recipes) {
						recipe.ingredients = (await Database.ingredients.find({ recipes: { $in: [recipe._id.toString()] } }).toArray()).map((ingredient) => ingredient.title)
					}
				}
				return recipes.length === 1 ? recipes[0] : recipes
			},

			async setRecipe (args) {
				const title = args.title
				const updateResult = await Database.recipes.updateOne({ _id: new ObjectId(args.id) }, { $set: { title, slug: Utils.slugify(title) } }, { upsert: true })
				args.recipeId = args.id || updateResult.upsertedId.toString()
				const ingredients = await resolvers.setIngredients(args)
				return [await resolvers.getRecipes(), ingredients]
			},

			async removeRecipe (id) {
				await Database.recipes.deleteOne({ _id: new ObjectId(id) })
				await Database.ingredients.updateMany({}, { $pull: { recipes: { $in: [id] } } })
				return await resolvers.getRecipes()
			},

			async getIngredients (args) {
				let ingredients = await Database.ingredients.find().toArray()
				if (args && args.map) ingredients = ingredients.map((ingredient) => ingredient[args.map])
				return ingredients
			},

			async setIngredients (args) {
				const newIngredients = []
				for (const ingredient of args.ingredients) {
					let currentIngredient
					const objectId = new ObjectId(ingredient.id)
					ingredient.filter = ingredient.id ? { _id: objectId } : { title: ingredient.title }
					currentIngredient = ingredient.id ? await Database.ingredients.findOne({ _id: objectId }) : await Database.ingredients.findOne({ title: ingredient.title })
					if (currentIngredient && !args.ingredients.some((pIngredient) => pIngredient._id === currentIngredient._id) && currentIngredient.recipes && args.recipeId && currentIngredient.recipes.includes(args.recipeId)) currentIngredient.recipes.splice(currentIngredient.recipes.indexOf(args.recipeId), 1)
					if (!currentIngredient) currentIngredient = {}
					currentIngredient.title = ingredient.title
					currentIngredient.category = ingredient.category || currentIngredient.category || ''
					if (!currentIngredient.recipes) currentIngredient.recipes = []
					if (args.ingredients.some((pIngredient) => pIngredient._id === ingredient.id) && args.recipeId && !currentIngredient.recipes.includes(args.recipeId)) currentIngredient.recipes.push(args.recipeId)
					newIngredients.push(currentIngredient)
				}
				await Database.ingredients.bulkWrite(newIngredients.map((ingredient, index) =>
					({
						updateOne: {
							filter: args.ingredients[index].filter,
							update: { $set: ingredient },
							upsert: true
						}
					})
				))
				return await resolvers.getIngredients()
			},

			async removeIngredient (id) {
				await Database.ingredients.deleteOne({ _id: new ObjectId(id) })
				return await resolvers.getIngredients()
			},

			async getListIngredients () {
				return await Database.lists.find().toArray()
			},

			async setListIngredients (args) {
				const newIngredients = []
				let isEdit = false
				let isNewCategory = false
				for (const ingredient of args.ingredients) {
					const { id, ...currentIngredient } = ingredient
					if (ingredient.title) currentIngredient.title = ingredient.title
					ingredient.filter = ingredient.id ? { _id: new ObjectId(ingredient.id) } : { title: ingredient.title }
					if (!ingredient.id) {
						const listIngredient = await Database.lists.findOne(ingredient.filter)
						currentIngredient.size = listIngredient?.size || ingredient.size
						currentIngredient.category = listIngredient?.category || ingredient.category || ''
					}
					isNewCategory = !!ingredient.category
					isEdit = !!ingredient.id
					newIngredients.push(currentIngredient)
				}
				await Database.lists.bulkWrite(newIngredients.map((ingredient, index) =>
					({
						updateOne: {
							filter: args.ingredients[index].filter,
							update: { $set: ingredient },
							upsert: true
						}
					})
				))
				if (!isEdit) await resolvers.setIngredients(args)
				if (isNewCategory && args.ingredients.length === 1) {
					delete args.ingredients[0].id
					await resolvers.setIngredients(args)
				}
				return resolvers.getListIngredients()
			},

			async removeListIngredient (id) {
				await Database.lists.deleteOne({ _id: new ObjectId(id) })
				return await resolvers.getListIngredients()
			},

			async clearListIngredients () {
				await Database.lists.deleteMany({})
				return resolvers.getListIngredients()
			},

			async getCategories () {
				return await Database.categories.find().toArray()
			},

			async setCategory (args) {
				await Database.categories.updateOne({ _id: new ObjectId(args.id) }, { $set: { title: args.title } }, { upsert: true })
				return await resolvers.getCategories()
			},

			async removeCategory (id) {
				await Database.categories.deleteOne({ _id: new ObjectId(id) })
				await Database.ingredients.updateMany({}, { $unset: { category: id } })
				await Database.lists.updateMany({}, { $unset: { category: id } })
				return await resolvers.getCategories()
			}
		}
		const reqArr = []
		let resolver
		if (Array.isArray(datas)) {
			for (const data of datas) {
				const func = Object.keys(data)
				resolver = resolvers[func]
				if (!resolver) return { error: `no resolver function for ${func}` }
				reqArr.push(await resolver(Object.values(data)[0]))
			}
			return reqArr
		}
		const func = Object.keys(datas)
		resolver = resolvers[func]
		if (!resolver) return { error: `no resolver function for ${func}` }
		return await resolver(Object.values(datas)[0])
	}
}

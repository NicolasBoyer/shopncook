import { Utils } from './utils.js'
import fs from 'fs'

/**
 * Permet la déclaration de la db (ici un fichier json) et de résoudre les requêtes passées dans la fonction request
 */
export default class Database {
	static async init () {
		// todo créer les fichiers s'ils n'existent pas A am&liorer + pb de chargement image ...
		const recipesJsonPath = '/datas/recipes.json'
		const ingredientsJsonPath = '/datas/recipes.json'
		const listsJsonPath = '/datas/recipes.json'
		if (!fs.existsSync(recipesJsonPath)) fs.writeFileSync(recipesJsonPath, '')
		if (!fs.existsSync(ingredientsJsonPath)) fs.writeFileSync(ingredientsJsonPath, '')
		if (!fs.existsSync(listsJsonPath)) fs.writeFileSync(listsJsonPath, '')
		this.recipesDB = JSON.parse(await Utils.readFileFromBack(recipesJsonPath))
		this.ingredientsDB = JSON.parse(await Utils.readFileFromBack(ingredientsJsonPath))
		this.listsDB = JSON.parse(await Utils.readFileFromBack(listsJsonPath))
		return this
	}

	/**
	 * Retourne ou enregistre des informations dans la db (des fichiers json) en fonction des requêtes reçues dans le resolver
	 * Exemple : { "getRecipes": {"map": "title"} } reçu dans request et traité par la fonction get et résolu par la constante resolvers.
	 * Retourne ce qui est traité dans la fonction getRecipes : les titres des recettes dans un array
	 * À chaque requête doit correspondre une fonction. La key étant la fonction, la value les arguments
	 * Autres exemples :
	 * { "getRecipes": {"title": "Tartiflette"} } retourne la recette tartiflette avec ses ingrédients via un objet
	 * { "setRecipe": {"title": "Tagliatelle à la carbonara"} } enregistre {"title": "Tagliatelle à la carbonara"} dans la db recipes.json
	 * @param datas requête à traiter par la fonction
	 * @returns {*|[]|*[]} retourne un array si request est un array sinon un objet
	 */
	static request (datas) {
		const resolvers = {
			getRecipes (args) {
				let recipes = Database.recipesDB.reduce((arr, recipe) => {
					const entry = { title: recipe, slug: Utils.slugify(recipe) }
					entry.ingredients = Database.ingredientsDB.filter((ingredient) => {
						if (ingredient.recipes) return ingredient.recipes.includes(recipe)
					}).map((ingredient) => ingredient.title)
					arr.push(entry)
					return arr
				}, [])
				if (args.title) recipes = recipes.filter((recipe) => recipe.title === args.title)
				if (args.slug) recipes = recipes.filter((recipe) => recipe.slug === args.slug)
				if (args.map) recipes = recipes.map((recipe) => recipe[args.map])
				return recipes.length === 1 ? recipes[0] : recipes
			},

			getIngredients (args) {
				let ingredients = Database.ingredientsDB
				if (args.recipeTitle) ingredients = ingredients.filter((ingredient) => ingredient.recipes && ingredient.recipes.includes(args.recipeTitle))
				if (args.map) ingredients = ingredients.map((ingredient) => ingredient[args.map])
				return ingredients
			},

			setRecipe (recipe) {
				if (Database.recipesDB.includes(recipe)) {
					return { error: `La recette ${recipe} a déjà été enregistrée` }
				}
				Database.recipesDB.push(recipe)
				Utils.saveDB(Database.recipesDB, 'recipes.json')
				return { success: 'Recette enregistrée' }
			},

			editRecipe (args) {
				Database.recipesDB[Database.recipesDB.indexOf(args.oldRecipe)] = args.recipe
				Utils.saveDB(Database.recipesDB, 'recipes.json')
				return { success: 'Recette enregistrée' }
			},

			removeRecipe (recipe) {
				Database.recipesDB.splice(Database.recipesDB.indexOf(recipe), 1)
				Database.ingredientsDB.filter((ingredient) => ingredient.recipes && ingredient.recipes.includes(recipe)).map((ingredient) => {
					ingredient.recipes.splice(ingredient.recipes.indexOf(recipe), 1)
					return ingredient
				})
				Utils.saveDB(Database.recipesDB, 'recipes.json')
				Utils.saveDB(Database.ingredientsDB, 'ingredients.json')
				return resolvers.getRecipes({})
			},

			editIngredient (args) {
				Database.ingredientsDB.filter((ingredient) => ingredient.title === args.oldIngredient).map((ingredient) => {
					ingredient.title = args.newIngredient
					return ingredient
				})
				Utils.saveDB(Database.ingredientsDB, 'ingredients.json')
				return Database.ingredientsDB
			},

			setIngredients (args) {
				args.ingredients.forEach((ingredient) => {
					let currentIngredient
					currentIngredient = Database.ingredientsDB.filter((pIngredient) => pIngredient.title === ingredient)[0]
					if (!currentIngredient) {
						currentIngredient = { title: ingredient }
						Database.ingredientsDB.push(currentIngredient)
					}
					if (!currentIngredient.recipes) currentIngredient.recipes = []
					if (!currentIngredient.recipes.includes(args.recipe)) currentIngredient.recipes.push(args.recipe)
				})
				if (args.oldRecipe) {
					Database.ingredientsDB.filter((ingredient) => ingredient.recipes && ingredient.recipes.includes(args.oldRecipe)).map((ingredient) => {
						ingredient.recipes[ingredient.recipes.indexOf(args.oldRecipe)] = args.recipe
						return ingredient
					})
				}
				Database.ingredientsDB.forEach((ingredient) => {
					if (!args.ingredients.includes(ingredient.title) && ingredient.recipes && ingredient.recipes.includes(args.recipe)) ingredient.recipes.splice(ingredient.recipes.indexOf(args.recipe), 1)
				})
				Utils.saveDB(Database.ingredientsDB, 'ingredients.json')
				return Database.ingredientsDB
			},

			removeIngredient (ingredient) {
				Database.ingredientsDB = Database.ingredientsDB.map((pIngredient) => {
					if (pIngredient.title !== ingredient) return pIngredient
				}).filter((pIngredient) => pIngredient)
				Utils.saveDB(Database.ingredientsDB, 'ingredients.json')
				return Database.ingredientsDB
			},

			getListIngredients () {
				return Database.listsDB[Database.listsDB.length - 1]
			},

			editListIngredient (args) {
				const currentList = resolvers.getListIngredients()
				currentList.filter((ingredient) => ingredient.title === args.oldIngredient).map((ingredient) => {
					ingredient.title = args.newIngredient
					ingredient.ordered = args.ordered
					return ingredient
				})
				Utils.saveDB(Database.listsDB, 'lists.json')
				return currentList
			},

			setListIngredient (ingredient) {
				if (!resolvers.getListIngredients().some((pIngredient) => pIngredient.title === ingredient)) {
					Database.listsDB[Database.listsDB.length - 1].push({ title: ingredient })
					Utils.saveDB(Database.listsDB, 'lists.json')
					this.setIngredients({ ingredients: [ingredient] })
				}
				return resolvers.getListIngredients()
			},

			setListIngredients (ingredients) {
				Database.listsDB[Database.listsDB.length - 1] = [...new Set(resolvers.getListIngredients().concat(ingredients.split(',').map((pIngredient) => {
					return { title: pIngredient }
				})).map(a => JSON.stringify(a)))].map(a => JSON.parse(a))
				Utils.saveDB(Database.listsDB, 'lists.json')
				return resolvers.getListIngredients()
			},

			removeListIngredient (ingredient) {
				Database.listsDB[Database.listsDB.length - 1] = resolvers.getListIngredients().map((pIngredient) => {
					if (pIngredient.title !== ingredient) return pIngredient
				}).filter((pIngredient) => pIngredient)
				Utils.saveDB(Database.listsDB, 'lists.json')
				return Database.listsDB[Database.listsDB.length - 1]
			},

			clearListIngredients () {
				Database.listsDB[Database.listsDB.length - 1] = []
				Utils.saveDB(Database.listsDB, 'lists.json')
				return resolvers.getListIngredients()
			}
		}
		const reqArr = []
		let resolver
		if (Array.isArray(datas)) {
			for (const data of datas) {
				const func = Object.keys(data)
				resolver = resolvers[func]
				if (!resolver) return { error: `no resolver function for ${func}` }
				reqArr.push(resolver(Object.values(data)[0]))
			}
			return reqArr
		}
		const func = Object.keys(datas)
		resolver = resolvers[func]
		if (!resolver) return { error: `no resolver function for ${func}` }
		return resolvers[Object.keys(datas)](Object.values(datas)[0])
	}
}

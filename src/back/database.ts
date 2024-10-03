import { Collection, Db, MongoClient, ObjectId } from 'mongodb'
import { Utils } from './utils.js'
import { TCategory, TDatabaseIngredient, TDish, TIngredient, TListIngredient, TRecipe, TRecipeInIngredient } from '../front/javascript/types.js'
import { DB_NAME, DB_URL } from './config.js'

export const client = new MongoClient(DB_URL)
export let userDb: Db
export let db: Db

/**
 * Permet la déclaration de la db et de résoudre les requêtes passées dans la fonction request
 */
export default class Database {
    private static ingredients: Collection
    private static recipes: Collection
    private static lists: Collection
    private static categories: Collection
    private static dishes: Collection

    static async connect(): Promise<void> {
        try {
            await client.connect()
            db = client.db(DB_NAME)
            console.log('Connected to database : ', DB_NAME)
        } catch (err) {
            console.error('Failed to connect to the database', err)
            throw err
        }
    }

    static async initUserDbAndCollections(id: string): Promise<void> {
        try {
            userDb = client.db(`${DB_NAME}_${id}`)
            console.log('Connected to user database : ', userDb.databaseName)
            this.ingredients = userDb.collection('ingredients')
            this.lists = userDb.collection('lists')
            this.categories = userDb.collection('categories')
            this.dishes = userDb.collection('dishes')
            this.recipes = db.collection('recipes')
        } catch (err) {
            console.error('Failed to connect to the database', err)
            throw err
        }
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
    static async request(datas: Record<string, string>[] | Record<string, string>): Promise<
        | TIngredient
        | TIngredient[]
        | TRecipe
        | TRecipe[]
        | TListIngredient
        | TListIngredient[]
        | TDish[]
        | {
              error: string
          }
    > {
        const resolvers = {
            async getRecipes(args?: Record<string, string>): Promise<TRecipe | TRecipe[]> {
                let recipes: TRecipe[] = []
                if (args?.slug) recipes.push((await Database.recipes.findOne({ slug: args.slug })) as TRecipe)
                else recipes = (await Database.recipes.find().toArray()) as TRecipe[]
                if (args?.map) {
                    if (args?.map) {
                        recipes = recipes.reduce((acc: TRecipe[], recipe): TRecipe[] => {
                            if (args.map in recipe) acc.push(recipe)
                            return acc
                        }, [])
                    }
                } else {
                    for (const recipe of recipes) {
                        recipe!.ingredients = (await Database.ingredients.find({ recipes: { $elemMatch: { recipeId: recipe!._id.toString() } } }).toArray()).map((ingredient): TListIngredient => {
                            const currentRecipe = ingredient.recipes.find((pRecipe: TRecipeInIngredient): boolean => pRecipe.recipeId === recipe!._id.toString()) as TRecipeInIngredient
                            return currentRecipe
                                ? {
                                      title: ingredient.title,
                                      size: currentRecipe.size,
                                      unit: currentRecipe.unit,
                                  }
                                : ingredient.title
                        })
                    }
                }
                return recipes.length === 1 ? recipes[0] : recipes
            },

            async setRecipe(args: Record<string, string>): Promise<[TRecipe | TRecipe[], TIngredient | TIngredient[]]> {
                const title = args.title
                const updateResult = await Database.recipes.updateOne(
                    { _id: new ObjectId(args.id) },
                    {
                        $set: {
                            title,
                            slug: Utils.slugify(title),
                        },
                    },
                    { upsert: true }
                )
                args.recipeId = args.id || (updateResult.upsertedId?.toString() as string)
                const ingredients = await resolvers.setIngredients(args as TDatabaseIngredient)
                return [await resolvers.getRecipes(), ingredients]
            },

            async removeRecipe(id: string): Promise<TRecipe | TRecipe[]> {
                await Database.recipes.deleteOne({ _id: new ObjectId(id) })
                // @ts-expect-error : erreur provoquée via la mise à jour de Mongo DB en 6.4.0. Donc probablement une erreur de type par Mongo DB (TODO : revérifier lors de futures mises à jour)
                await Database.ingredients.updateMany({}, { $pull: { recipes: { recipeId: id } } })
                return await resolvers.getRecipes()
            },

            async getIngredients(args: Record<string, string> | null = null): Promise<TIngredient[]> {
                let ingredients = (await Database.ingredients.find().toArray()) as unknown as TIngredient[]
                if (args?.map) {
                    ingredients = ingredients.reduce((acc: TIngredient[], ingredient): TIngredient[] => {
                        if (args.map in ingredient) acc.push(ingredient)
                        return acc
                    }, [])
                }
                return ingredients
            },

            async setIngredients(args: TDatabaseIngredient): Promise<TIngredient[]> {
                const newIngredients: TIngredient[] = []
                for (const ingredient of args!.ingredients) {
                    let currentIngredient: Partial<TIngredient>
                    const objectId = new ObjectId(ingredient.id)
                    ingredient.filter = ingredient.id ? { _id: objectId } : { title: ingredient.title }
                    currentIngredient = (ingredient.id ? await Database.ingredients.findOne({ _id: objectId }) : await Database.ingredients.findOne({ title: ingredient.title })) as TIngredient
                    if (!currentIngredient) currentIngredient = {}
                    currentIngredient.title = ingredient.title
                    currentIngredient.category = ingredient.category || currentIngredient.category || ''
                    if (!currentIngredient.recipes) currentIngredient.recipes = []
                    if (args.ingredients.some((pIngredient): boolean => pIngredient._id?.toString() === ingredient.id) && args.recipeId) {
                        if (!currentIngredient.recipes?.some((pRecipe): boolean => pRecipe.recipeId === args.recipeId)) {
                            // Ajout de recette dans ingredient
                            currentIngredient.recipes?.push({
                                recipeId: args.recipeId,
                                size: ingredient.size,
                                unit: ingredient.unit,
                            })
                        } else {
                            // Edit recette dans ingredient
                            const recipe = currentIngredient.recipes.find((pRecipe): boolean => pRecipe.recipeId === args.recipeId)
                            recipe!.size = ingredient.size
                            recipe!.unit = ingredient.unit
                        }
                    }
                    newIngredients.push(currentIngredient as TIngredient)
                }
                let ingredients: TDatabaseIngredient[] = []
                if (args.recipeId) {
                    ingredients = (await Database.ingredients.find({ recipes: { $elemMatch: { recipeId: args.recipeId.toString() } } }).toArray())
                        .filter((pIngredient): boolean => !args.ingredients.some((pArgIngredient): boolean => pArgIngredient.title === pIngredient.title))
                        .map((pIngredient): TDatabaseIngredient => pIngredient.recipes.splice(pIngredient.recipes.indexOf(args.recipeId), 1) && pIngredient)
                }
                await Database.ingredients.bulkWrite(
                    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
                    [...newIngredients, ...ingredients].map((ingredient, index) => ({
                        updateOne: {
                            filter: args.ingredients[index]?.filter || { _id: new ObjectId(ingredient._id) },
                            update: { $set: ingredient },
                            upsert: true,
                        },
                    }))
                )
                return await resolvers.getIngredients()
            },

            async removeIngredient(id: string): Promise<TIngredient[]> {
                await Database.ingredients.deleteOne({ _id: new ObjectId(id) })
                return await resolvers.getIngredients()
            },

            async getListIngredients(): Promise<TListIngredient[]> {
                return (await Database.lists.find().toArray()) as unknown as TListIngredient[]
            },

            async setListIngredients(args: TDatabaseIngredient): Promise<TListIngredient[]> {
                const newIngredients: TListIngredient[] = []
                let isEdit = false
                let isNewCategory = false
                for (const ingredient of args.ingredients) {
                    const {
                        id,
                        ...currentIngredient
                    }: TIngredient &
                        TListIngredient & {
                            id?: string | undefined
                            filter:
                                | { _id?: ObjectId | undefined }
                                | {
                                      title?: string | undefined
                                      unit?: string | undefined
                                  }
                        } = ingredient
                    if (ingredient.title) currentIngredient.title = ingredient.title
                    ingredient.filter = ingredient.id
                        ? { _id: new ObjectId(ingredient.id) }
                        : {
                              title: ingredient.title,
                              unit: ingredient.unit,
                          }
                    if (!ingredient.id) {
                        const listIngredient = await Database.lists.findOne(ingredient.filter)
                        currentIngredient.size = (listIngredient?.unit === ingredient.unit ? Number(listIngredient?.size) + Number(ingredient.size) : ingredient.size) as string
                        currentIngredient.unit = listIngredient?.unit || ingredient.unit
                        currentIngredient.category = listIngredient?.category || ingredient.category || ''
                    }
                    isNewCategory = !!ingredient.category
                    isEdit = !!ingredient.id
                    newIngredients.push(currentIngredient)
                }
                await Database.lists.bulkWrite(
                    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
                    newIngredients.map((ingredient: TListIngredient, index: number) => ({
                        updateOne: {
                            filter: args.ingredients[index].filter,
                            update: { $set: ingredient },
                            upsert: true,
                        },
                    }))
                )
                if (!isEdit) await resolvers.setIngredients(args)
                if (isNewCategory && args.ingredients.length === 1) {
                    delete args.ingredients[0].id
                    await resolvers.setIngredients(args)
                }
                return resolvers.getListIngredients()
            },

            async removeListIngredient(id: string): Promise<(TIngredient | undefined)[]> {
                await Database.lists.deleteOne({ _id: new ObjectId(id) })
                return (await resolvers.getListIngredients()) as unknown as TIngredient[]
            },

            async clearListIngredients(): Promise<TListIngredient[]> {
                await Database.lists.deleteMany({})
                return resolvers.getListIngredients()
            },

            async getCategories(): Promise<TCategory[]> {
                return (await Database.categories.find().toArray()) as unknown as TCategory[]
            },

            async setCategory(args: Record<string, string>): Promise<TCategory[]> {
                await Database.categories.updateOne({ _id: new ObjectId(args.id) }, { $set: { title: args.title } }, { upsert: true })
                return await resolvers.getCategories()
            },

            async removeCategory(id: string): Promise<TCategory[]> {
                await Database.categories.deleteOne({ _id: new ObjectId(id) })
                await Database.ingredients.updateMany({ category: id }, { $unset: { category: '' } })
                await Database.lists.updateMany({ category: id }, { $unset: { category: '' } })
                return await resolvers.getCategories()
            },

            async getDishes(): Promise<TDish[]> {
                return (await Database.dishes.find().toArray()) as unknown as TDish[]
            },

            async setDish(args: Record<string, string>): Promise<TDish[]> {
                await Database.dishes.updateOne(
                    { _id: new ObjectId(args._id) },
                    {
                        $set: {
                            day: args.day,
                            time: args.time,
                            name: args.name,
                        },
                    },
                    { upsert: true }
                )
                return await resolvers.getDishes()
            },

            async clearDishes(id: string): Promise<TDish[]> {
                if (id) await Database.dishes.deleteOne({ _id: new ObjectId(id) })
                else await Database.dishes.deleteMany({})
                return resolvers.getDishes()
            },
        }
        const resArr: TIngredient | TIngredient[] | TRecipe | TRecipe[] | TListIngredient | TListIngredient[] | TDish[] = []
        let resolver: (args: string) => Promise<TIngredient | TIngredient[] | TRecipe | TRecipe[] | TListIngredient | TListIngredient[] | TDish[]>
        if (Array.isArray(datas)) {
            for (const data of datas) {
                const func = Object.keys(data)[0]
                resolver = resolvers[func as keyof typeof resolver]
                if (!resolver) return { error: `no resolver function for ${func}` }
                resArr.push(<TRecipe & TIngredient & TListIngredient & TDish>await resolver(Object.values(data)[0]))
            }
            return resArr
        }
        const func = Object.keys(datas)[0]
        resolver = resolvers[func as keyof typeof resolver]
        if (!resolver) return { error: `no resolver function for ${func}` }
        return await resolver(Object.values(datas)[0])
    }
}

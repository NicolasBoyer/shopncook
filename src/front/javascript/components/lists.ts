import { html, render, TemplateResult } from 'lit'
import autoAnimate from '@formkit/auto-animate'
import { Utils } from '../classes/utils.js'
import { Commons } from '../classes/commons.js'
import { Caches } from '../classes/caches.js'
import { Websocket } from '../classes/websocket.js'
import { HTMLElementEvent, TCategory, TDish, TIngredient, TListIngredient, TRecipe } from '../types.js'

export default class Lists extends HTMLElement {
    private ingredients: TListIngredient[] = []
    private categories: TCategory[] = []
    private recipeChoices: string[] = []
    private orderedIngredients: string[] = []
    private editMode: string | null = null

    connectedCallback(): void {
        Websocket.listen(
            async (event): Promise<void> => {
                this.ingredients = JSON.parse(await event.data.text())
                this.displayIngredients()
            },
            async (): Promise<void> => {
                Commons.clearPropositionsOnBackgroundClick((): void => this.render())
                const response = ((await Caches.get('listIngredients', 'categories', 'ingredients')) ||
                    (await Utils.request('/db', 'POST', { body: '[{ "getListIngredients": "" }, { "getCategories": "" }, { "getIngredients": "" }]' }))) as unknown as [TListIngredient[], TCategory[], TIngredient[]]
                await Caches.set(false, 'listIngredients', response[0], 'categories', response[1], 'ingredients', response[2])
                this.ingredients = response[0]
                this.categories = response[1]
                Commons.savedIngredients = response[2]
                this.recipeChoices = []
                this.sendMessage()
                const cacheResponse = ((await Caches.get('recipes', 'dishes')) || (await Utils.request('/db', 'POST', { body: '[{ "getRecipes": "" }, { "getDishes": "" }]' }))) as unknown as [TRecipe[], TDish[]]
                await Caches.set(false, 'recipes', cacheResponse[0], 'dishes', cacheResponse[1])
            }
        )
    }

    private sendMessage(): void {
        Websocket.send(this.ingredients)
        this.displayIngredients()
    }

    private async displayIngredients(): Promise<void> {
        await Caches.set(false, 'listIngredients', this.ingredients)
        this.orderedIngredients = (this.ingredients.length ? this.ingredients.filter((pIngredient): boolean | undefined => pIngredient.ordered).map((pIngredient): string | undefined => pIngredient._id?.toString()) : []) as string[]
        this.render()
        try {
            autoAnimate(document.querySelector('ul') as HTMLElement)
        } catch (e) {
            // console.error(e)
        }
    }

    private resetMode(): void {
        this.editMode = null
        this.sendMessage()
    }

    private async editAndSaveListIngredient(pEvent: HTMLElementEvent<HTMLInputElement>, id: string): Promise<void> {
        Commons.setPropositions()
        const input =
            pEvent.target.tagName === 'INPUT' && pEvent.target.name === 'ingredient'
                ? pEvent.target
                : pEvent.target.tagName === 'INPUT' && pEvent.target.name === 'size'
                  ? pEvent.target.previousElementSibling?.querySelector('input')
                  : pEvent.target.previousElementSibling?.previousElementSibling?.querySelector('input')
        const sizeInput = input?.closest('div')?.nextElementSibling as HTMLInputElement
        const unitSelect = input?.closest('div')?.nextElementSibling?.nextElementSibling as HTMLSelectElement
        if (input?.value) {
            const category = Commons.savedIngredients.map((pIngredient): string | false => pIngredient.title === input.value && pIngredient.category).filter((pIngredient): string | false => pIngredient)[0]
            const response = (await Utils.request('/db', 'POST', {
                body: `[{ "setListIngredients": { "ingredients": [ { "title": "${input.value}"${id ? `, "id": "${id}"` : ''}${category ? `, "category": "${category}"` : ''}, "size": "${sizeInput.value}", "unit": "${unitSelect.value}" } ] } }, { "getIngredients": "" }]`,
            })) as unknown as [TListIngredient[], TIngredient[]]
            this.ingredients = response[0]
            Commons.savedIngredients = response[1]
            await Caches.set(false, 'listIngredients', this.ingredients, 'ingredients', Commons.savedIngredients)
            input.value = ''
            sizeInput.value = ''
            this.resetMode()
        }
    }

    private async editListIngredientOrdered(id: string, ordered: boolean): Promise<void> {
        this.ingredients = (await Utils.request('/db', 'POST', { body: `{ "setListIngredients": { "ingredients": [ { "id": "${id}", "ordered": ${ordered} } ] } }` })) as TListIngredient[]
        await Caches.set(false, 'listIngredients', this.ingredients)
        this.resetMode()
    }

    private async removeListIngredient(id: string): Promise<void> {
        Utils.confirm(html`<h3>Voulez-vous vraiment supprimer ?</h3>`, async (): Promise<void> => {
            this.ingredients = (await Utils.request('/db', 'POST', { body: `{ "removeListIngredient": "${id}" }` })) as TListIngredient[]
            await Caches.set(false, 'listIngredients', this.ingredients)
            this.sendMessage()
            Utils.toast('success', 'Ingrédient supprimé')
        })
    }

    private addListIngredientByRecipe(): void {
        document.body.addEventListener('modalConfirm', (pEvent): void => {
            this.recipeChoices = (pEvent as CustomEvent).detail.choices
        })
        Utils.confirm(html` <fs-recipes choiceMode="checkbox" /> `, async (): Promise<void> => {
            if (this.recipeChoices.length) {
                const newIngredients: TListIngredient[] = []
                Commons.savedIngredients.forEach((pIngredient): void => {
                    const recipe = pIngredient.recipes.find((pRecipe): boolean => this.recipeChoices.some((pRecipeId): boolean => pRecipe.recipeId === pRecipeId))
                    if (recipe) {
                        newIngredients.push({
                            title: pIngredient.title,
                            size: recipe.size,
                            unit: recipe.unit,
                            category: pIngredient.category,
                        })
                    }
                })
                this.ingredients = (await Utils.request('/db', 'POST', { body: `{ "setListIngredients": { "ingredients": ${JSON.stringify(newIngredients)} } }` })) as TListIngredient[]
                await Caches.set(false, 'listIngredients', this.ingredients)
                this.recipeChoices = []
                this.sendMessage()
            }
        })
    }

    private setCategory(ingredientId: string, ingredientTitle: string): void {
        let categoryId: string
        document.body.addEventListener('modalConfirm', (pEvent): void => {
            categoryId = (pEvent as CustomEvent).detail.id
        })
        Utils.confirm(html` <fs-categories choiceMode /> `, async (): Promise<void> => {
            const response = (await Utils.request('/db', 'POST', {
                body: `[{ "setListIngredients": { "ingredients": [ { "title": "${ingredientTitle}", "id": "${ingredientId}", "category": "${categoryId}" } ] } }, { "getIngredients": "" }]`,
            })) as unknown as [TListIngredient[], TIngredient[]]
            this.ingredients = response[0]
            Commons.savedIngredients = response[1]
            await Caches.set(false, 'listIngredients', this.ingredients, 'ingredients', Commons.savedIngredients)
            this.sendMessage()
        })
    }

    private clear(): void {
        Utils.confirm(html`<h3>Voulez vous vider la liste ?</h3>`, async (): Promise<void> => {
            this.orderedIngredients = []
            this.ingredients = (await Utils.request('/db', 'POST', { body: '{ "clearListIngredients": "" }' })) as TListIngredient[]
            await Caches.set(false, 'listIngredients', this.ingredients)
            this.sendMessage()
        })
    }

    private openEditListIngredient(ingredient: TListIngredient | null = null): void {
        let event: HTMLElementEvent<HTMLInputElement>
        document.body.addEventListener('modalConfirm', (pEvent): void => {
            event = (pEvent as CustomEvent).detail.event
        })
        Utils.confirm(
            html``,
            async (): Promise<void> => {
                await this.editAndSaveListIngredient(event, ingredient?._id as unknown as string)
                Commons.renderAddIngredientInDialog(ingredient as TListIngredient, true)
            },
            (): void => Commons.renderAddIngredientInDialog(ingredient as TListIngredient, true)
        )
        Commons.renderAddIngredientInDialog(ingredient as TListIngredient)
    }

    private render(): void {
        const listIngredient = (pIngredient: TListIngredient): TemplateResult => {
            const ingredientId = pIngredient._id as unknown as string
            const ingredientTitle = pIngredient.title
            const ingredientSize = pIngredient.size
            const ingredientUnit = pIngredient.unit
            const isIngredientOrdered = this.orderedIngredients?.includes(ingredientId)
            return html`
                <li>
                    <div class="editListIngredient ${this.editMode === ingredientId ? 'grid' : ''}">
                        ${html`
                            <a
                                class="${isIngredientOrdered ? 'ordered' : ''}"
                                @click="${(): void => {
                                    this.editListIngredientOrdered(ingredientId, !isIngredientOrdered)
                                    if (!isIngredientOrdered) this.orderedIngredients.push(ingredientId)
                                    else this.orderedIngredients = this.orderedIngredients.filter((pOrderedIngredient): boolean => ingredientId !== pOrderedIngredient)
                                    if (this.orderedIngredients.length === this.ingredients.length) this.clear()
                                }}"
                                ><span>${ingredientTitle}${ingredientSize && html` (${ingredientSize}${ingredientUnit !== 'nb' ? ` ${ingredientUnit}` : ''})`}</span></a
                            >
                            <button class="edit" @click="${(): void => this.openEditListIngredient(pIngredient)}" .disabled="${isIngredientOrdered}">
                                <svg class="edit">
                                    <use href="#edit"></use>
                                </svg>
                                <span>Modifier</span>
                            </button>
                            <button type="button" class="remove" @click="${(): Promise<void> => this.removeListIngredient(ingredientId)}" .disabled="${isIngredientOrdered}">
                                <svg class="remove">
                                    <use href="#remove"></use>
                                </svg>
                                <span>Supprimer</span>
                            </button>
                            ${!pIngredient.category
                                ? html`
                                      <button type="button" class="setCategory" @click="${(): void => this.setCategory(ingredientId, ingredientTitle)}" .disabled="${isIngredientOrdered}">
                                          <svg class="setCategory">
                                              <use href="#setCategory"></use>
                                          </svg>
                                          <span>Associer une catégorie</span>
                                      </button>
                                  `
                                : ''}
                        `}
                    </div>
                </li>
            `
        }
        const getCategoryTitle = (pCategoryId: string): string => this.categories.map((pCategory): string | false => pCategory._id.toString() === pCategoryId && pCategory.title).filter((pCategory): string | false => pCategory)[0] as string
        const ingredientsByCategory = this.ingredients
            ?.filter((pIngredient): string | boolean | undefined => pIngredient.category || pIngredient.ordered)
            .sort((a, b): number => getCategoryTitle(a.category)?.localeCompare(getCategoryTitle(b.category)))
            .reduce((group: Record<string, TListIngredient[]>, ingredient): Record<string, TListIngredient[]> => {
                const categoryId = ingredient.category
                const category = !ingredient.ordered ? getCategoryTitle(categoryId) : Commons.strings.ordered
                group[category] = group[category] ?? []
                group[category].push(ingredient)
                return group
            }, {})
        render(
            html`
                <div class="title">
                    <h2>Votre liste</h2>
                    <button type="button" class="add" @click="${(): void => this.openEditListIngredient()}">
                        <svg class="add">
                            <use href="#add"></use>
                        </svg>
                        <span>Ajouter un ingrédient</span>
                    </button>
                    <button type="button" class="addList" @click="${(): void => this.addListIngredientByRecipe()}">
                        <svg class="addList">
                            <use href="#addList"></use>
                        </svg>
                        <span>Ajouter des ingrédients</span>
                    </button>
                    <button type="button" class="trash" @click="${(): void => this.clear()}">
                        <svg class="trash">
                            <use href="#trash"></use>
                        </svg>
                        <span>Vider</span>
                    </button>
                </div>
                <aside>
                    <nav>
                        <ul>
                            ${!this.ingredients?.length
                                ? html` <li>Aucun ingrédient ...</li>`
                                : html`
                                      ${this.ingredients?.filter((pIngredient): boolean => !pIngredient.category && !pIngredient.ordered).map((pIngredient): TemplateResult => listIngredient(pIngredient))}
                                      ${Object.entries(ingredientsByCategory)
                                          .sort(([a], [b]): number => (a === Commons.strings.ordered ? 1 : b === Commons.strings.ordered ? -1 : a.localeCompare(b)))
                                          .map(([pCategory, pValue]): TemplateResult => {
                                              return html`
                                                  <li>
                                                      <div class="category">${pCategory}</div>
                                                      <ul>
                                                          ${pValue.sort((a, b): number => a.title.localeCompare(b.title)).map((pIngredient): TemplateResult => listIngredient(pIngredient))}
                                                      </ul>
                                                  </li>
                                              `
                                          })}
                                  `}
                        </ul>
                    </nav>
                </aside>
            `,
            this
        )
    }
}

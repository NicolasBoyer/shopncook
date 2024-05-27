import { html, render, TemplateResult } from 'lit'
import { Utils } from '../classes/utils.js'
import { Commons } from '../classes/commons.js'
import { Caches } from '../classes/caches.js'
import { HTMLElementEvent, TIngredient, TListIngredient, TRecipe } from '../types.js'

export default class Recipe extends HTMLElement {
    title = 'Ajouter une recette'
    private submitButtonName: string = 'Ajouter'
    private isInEditMode: boolean = false
    private slug: string = ''
    private currentRecipe!: TRecipe
    private currentRecipeTitle: string = ''
    private currentRecipeId!: string
    private newIngredients: TListIngredient[] = []

    async connectedCallback(): Promise<void> {
        Commons.clearPropositionsOnBackgroundClick((): void => this.render())
        const splitUrl = location.pathname.split('/')
        this.isInEditMode = splitUrl.includes('edit')
        if (this.isInEditMode) {
            this.slug = splitUrl[splitUrl.length - 1]
            this.currentRecipe = ((await Caches.get(`${this.slug}`)) || (await Utils.request('/db', 'POST', { body: `{ "getRecipes": { "slug": "${this.slug}" } }` }))) as TRecipe
            await Caches.set(false, this.slug, this.currentRecipe)
            if (Array.isArray(this.currentRecipe)) location.href = location.origin + '/404.html'
            this.currentRecipeTitle = this.currentRecipe.title
            this.currentRecipeId = this.currentRecipe._id.toString()
            this.submitButtonName = 'Modifier'
            this.title = 'Modifier une recette'
            this.newIngredients = this.currentRecipe.ingredients
        } else this.newIngredients = []
        Commons.savedIngredients = ((await Caches.get('ingredients')) || (await Utils.request('/db', 'POST', { body: '{ "getIngredients": "" }' }))) as unknown as TIngredient[]
        await Caches.set(false, 'ingredients', Commons.savedIngredients)
        document.body.style.display = 'flex'
        this.render()
        this.setFormListener()
    }

    private setFormListener(): void {
        const form = this.querySelector('form')
        form?.addEventListener('keypress', async (pEvent): Promise<void> => {
            if (pEvent.key === 'Enter') pEvent.preventDefault()
        })
        form?.addEventListener('submit', async (pEvent): Promise<void> => {
            pEvent.preventDefault()
            try {
                const plainFormData = Object.fromEntries(new FormData(form).entries())
                const id = plainFormData.id
                const formKeys = Object.keys(plainFormData)
                const ingredients = formKeys.reduce((pIngredients: Partial<TListIngredient>[], pKey): Partial<TListIngredient>[] => {
                    if (pKey !== 'recipe' && pKey !== 'id') {
                        if (!pIngredients.some((pIngredient: Partial<TIngredient>): boolean => pIngredient.title === plainFormData[pKey]) && pKey.includes('ingredient')) pIngredients.push({ title: plainFormData[pKey] as string })
                        if (!pKey.includes('ingredient')) {
                            const splitKey = pKey.split('_')
                            const key = Number(splitKey[1]) === 0 ? pIngredients.length - 1 : Number(splitKey[1]) - 1
                            pIngredients[key][splitKey[0] as keyof TListIngredient] = plainFormData[pKey] as unknown as undefined
                        }
                    }
                    return pIngredients
                }, [])
                if (this.isInEditMode) {
                    this.currentRecipe.ingredients = ingredients as TListIngredient[]
                    await Caches.set(false, this.slug, this.currentRecipe)
                }
                Utils.loader(true)
                const response = (await Utils.request('/db', 'POST', { body: `{ "setRecipe": { "title": "${plainFormData.recipe}", ${id ? `"id": "${id}",` : ''} "ingredients": ${JSON.stringify(ingredients)}} }` })) as [
                    TRecipe,
                    TIngredient[],
                ]
                await Caches.set(false, 'recipes', response[0], 'ingredients', response[1])
                Utils.loader(false)
                if (this.isInEditMode) location.href = '/app/recipes'
                else {
                    this.newIngredients = []
                    document.querySelectorAll('input').forEach((input): void => {
                        input.value = ''
                    })
                    Utils.toast('success', 'Recette enregistrée')
                    Commons.savedIngredients = response[1]
                    this.render()
                }
            } catch (error) {
                console.error(error)
            }
        })
    }

    private addOrEditIngredient(pEvent: HTMLElementEvent<HTMLInputElement>, pIndex: number | undefined = undefined): void {
        const parent = pEvent.target.closest('article')
        const input = parent?.querySelector('.ingredient') as HTMLInputElement
        const sizeInput = parent?.querySelector('.size') as HTMLInputElement
        const unitSelect = parent?.querySelector('.unit') as HTMLInputElement
        if (input?.value) {
            const ingredient: Omit<TListIngredient, 'category'> = { title: input.value, size: sizeInput.value, unit: unitSelect.value }
            if (pIndex !== undefined && pIndex !== null) this.newIngredients[pIndex] = ingredient as TListIngredient
            else this.newIngredients.push(ingredient as TListIngredient)
            this.render()
        }
    }

    private removeIngredient(pIndex: number): void {
        Commons.setPropositions()
        this.newIngredients.splice(pIndex, 1)
        this.render()
    }

    private openEditListIngredient(pIngredient: TListIngredient | null = null, pIndex: number | null = null): void {
        let event: HTMLElementEvent<HTMLInputElement>
        document.body.addEventListener('modalConfirm', (pEvent): void => {
            event = (pEvent as CustomEvent).detail.event
        })
        Utils.confirm(
            html``,
            async (): Promise<void> => {
                if (pIndex !== undefined) this.addOrEditIngredient(event, pIndex as number)
                else this.addOrEditIngredient(event)
                Commons.renderAddIngredientInDialog(pIngredient as TListIngredient, true)
            },
            (): void => Commons.renderAddIngredientInDialog(pIngredient as TListIngredient, true)
        )
        Commons.renderAddIngredientInDialog(pIngredient as TListIngredient)
    }

    private render(): void {
        render(
            html`
			<h2>${this.title}</h2>
			<form>
				<label>
					<span>Nom</span>
					<input autocomplete="off" name="recipe" required type="text" value="${this.currentRecipeTitle || ''}">
					<input name="id" type="hidden" value="${this.currentRecipeId || ''}">
				</label>
				<fieldset class="ingredients">
					<div class="title">
						<legend>Ingrédients</legend>
						<button type="button" class="add" @click="${(): void => this.openEditListIngredient()}">
							<svg class="add">
								<use href="#add"></use>
							</svg>
							<span>Ajouter un ingrédient</span>
						</button>
					</div>
					${this.newIngredients?.map(
                        (pIngredient, pIndex): TemplateResult => html`
                            <div class="grid">
                                <span>${pIngredient?.title || pIngredient}${pIngredient?.size ? ` (${pIngredient?.size}${pIngredient?.unit && pIngredient?.unit !== 'nb' ? ` ${pIngredient?.unit}` : ''})` : ''}</span>
                                <input name="ingredient_${pIndex + 1}" type="hidden" value="${pIngredient?.title || pIngredient}" />
                                <input name="size_${pIndex + 1}" type="hidden" value="${pIngredient?.size || ''}" />
                                <input name="unit_${pIndex + 1}" type="hidden" value="${pIngredient?.unit || ''}" />
                                <button type="button" class="edit" @click="${(): void => this.openEditListIngredient(pIngredient, pIndex)}">
                                    <svg class="edit">
                                        <use href="#edit"></use>
                                    </svg>
                                    <span>Supprimer un ingrédient</span>
                                </button>
                                <button type="button" class="remove" @click="${(): void => this.removeIngredient(pIndex)}">
                                    <svg class="minus">
                                        <use href="#minus"></use>
                                    </svg>
                                    <span>Supprimer un ingrédient</span>
                                </button>
                            </div>
                        `
                    )}
					</div>
				</fieldset>
				<button type="submit">
					<span>${this.submitButtonName}</span>
				</button>
			</form>
		`,
            this
        )
    }
}

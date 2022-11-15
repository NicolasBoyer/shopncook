import { html, render } from '../thirdParty/litHtml.js'
import { Utils } from '../classes/utils.js'
import { Commons } from '../classes/commons.js'
import { Caches } from '../classes/caches.js'

export default class Recipe extends HTMLElement {
	#submitButtonName
	#title
	#isInEditMode
	#isEditAndAddIngredient
	#slug
	#currentRecipe
	#currentRecipeTitle
	#currentRecipeId
	#newIngredients

	async connectedCallback () {
		Commons.clearPropositionsOnBackgroundClick(() => this.#render())
		const splitUrl = location.pathname.split('/')
		this.#submitButtonName = 'Ajouter'
		this.#title = 'Ajouter une recette'
		this.#isInEditMode = splitUrl.includes('edit')
		this.#isEditAndAddIngredient = this.#isInEditMode
		if (this.#isInEditMode) {
			this.#slug = splitUrl[splitUrl.length - 1]
			this.#currentRecipe = Caches.get(`${this.#slug}`) || await Utils.request('/db', 'POST', { body: `{ "getRecipes": { "slug": "${this.#slug}" } }` })
			Caches.set(this.#slug, this.#currentRecipe)
			if (Array.isArray(this.#currentRecipe)) location.href = location.origin + '/404.html'
			this.#currentRecipeTitle = this.#currentRecipe.title
			this.#currentRecipeId = this.#currentRecipe._id
			this.#submitButtonName = 'Modifier'
			this.#title = 'Modifier une recette'
			this.#newIngredients = this.#currentRecipe.ingredients
		} else this.#newIngredients = []
		Commons.savedIngredients = Caches.get('ingredients') || await Utils.request('/db', 'POST', { body: '{ "getIngredients": "" }' })
		Caches.set('ingredients', Commons.savedIngredients)
		document.body.style.display = 'flex'
		this.#render()
		this.#setFormListener()
	}

	#setFormListener () {
		const form = this.querySelector('form')
		form.addEventListener('keypress', async (pEvent) => {
			if (pEvent.key === 'Enter') pEvent.preventDefault()
		})
		form.addEventListener('submit', async (pEvent) => {
			pEvent.preventDefault()
			try {
				const plainFormData = Object.fromEntries(new FormData(form).entries())
				const id = plainFormData.id
				const formKeys = Object.keys(plainFormData)
				const ingredients = formKeys.reduce((pIngredients, pKey) => {
					if (pKey !== 'recipe' && pKey !== 'id') {
						if (!pIngredients.some((pIngredient) => pIngredient.title === plainFormData[pKey]) && pKey.includes('ingredient')) pIngredients.push({ title: plainFormData[pKey] })
						if (!pKey.includes('ingredient')) {
							const splitKey = pKey.split('_')
							const key = Number(splitKey[1]) === 0 ? pIngredients.length - 1 : Number(splitKey[1]) - 1
							pIngredients[key][splitKey[0]] = plainFormData[pKey]
						}
					}
					return pIngredients
				}, [])
				if (this.#isInEditMode) {
					this.#currentRecipe.ingredients = ingredients
					Caches.set(this.#slug, this.#currentRecipe)
				}
				Utils.loader(true)
				const response = await Utils.request('/db', 'POST', { body: `{ "setRecipe": { "title": "${plainFormData.recipe}", ${id ? `"id": "${id}",` : ''} "ingredients": ${JSON.stringify(ingredients)}} }` })
				Caches.set('recipes', response[0])
				Utils.loader(false)
				if (this.#isInEditMode) location.href = '/app/recipes'
				else {
					this.#newIngredients = []
					document.querySelectorAll('input').forEach((input) => {
						input.value = ''
					})
					Utils.toast('success', 'Recette enregistrée')
					Commons.savedIngredients = response[1]
					Caches.set('ingredients', Commons.savedIngredients)
					this.#render()
				}
			} catch (error) {
				console.error(error)
			}
		})
	}

	#addOrEditIngredient (pEvent, pIndex) {
		const parent = pEvent.target.closest('article')
		const input = parent.querySelector('.ingredient')
		const sizeInput = parent.querySelector('.size')
		const unitSelect = parent.querySelector('.unit')
		if (input?.value) {
			const ingredient = { title: input.value, size: sizeInput.value, unit: unitSelect.value }
			if (pIndex !== undefined) this.#newIngredients[pIndex] = ingredient
			else this.#newIngredients.push(ingredient)
			this.#render()
		}
	}

	#removeIngredient (pIndex) {
		Commons.setPropositions()
		this.#newIngredients.splice(pIndex, 1)
		this.#render()
	}

	#openEditListIngredient (pIngredient, pIndex) {
		let event
		document.body.addEventListener('modalConfirm', (pEvent) => {
			event = pEvent.detail.event
		})
		Utils.confirm(html``, async () => {
			if (pIndex !== undefined) this.#addOrEditIngredient(event, pIndex)
			else this.#addOrEditIngredient(event)
			Commons.renderAddIngredientInDialog(pIngredient, true)
		}, () => Commons.renderAddIngredientInDialog(pIngredient, true))
		Commons.renderAddIngredientInDialog(pIngredient)
	}

	#render () {
		render(html`
			<h2>${this.#title}</h2>
			<form>
				<label>
					<span>Nom</span>
					<input autocomplete="off" name="recipe" required type="text" value="${this.#currentRecipeTitle || ''}">
					<input name="id" type="hidden" value="${this.#currentRecipeId || ''}">
				</label>
				<fieldset class="ingredients">
					<div class="title">
						<legend>Ingrédients</legend>
						<button type="button" class="add" @click="${() => this.#openEditListIngredient()}">
							<svg class="add">
								<use href="#add"></use>
							</svg>
							<span>Ajouter un ingrédient</span>
						</button>
					</div>
					${this.#newIngredients?.map(
							(pIngredient, pIndex) => html`
								<div class="grid">
									<span>${pIngredient?.title || pIngredient}${pIngredient?.size ? ` (${pIngredient?.size}${pIngredient?.unit && pIngredient?.unit !== 'nb' ? ` ${pIngredient?.unit}` : ''})` : ''}</span>
									<input name="ingredient_${pIndex + 1}" type="hidden" value="${pIngredient?.title || pIngredient}"/>
									<input name="size_${pIndex + 1}" type="hidden" value="${pIngredient?.size || ''}"/>
									<input name="unit_${pIndex + 1}" type="hidden" value="${pIngredient?.unit || ''}"/>
									<button type="button" class="edit" @click="${() => this.#openEditListIngredient(pIngredient, pIndex)}">
										<svg class="edit">
											<use href="#edit"></use>
										</svg>
										<span>Supprimer un ingrédient</span>
									</button>
									<button type="button" class="remove" @click="${() => this.#removeIngredient(pIndex)}">
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
					<span>${this.#submitButtonName}</span>
				</button>
			</form>
		`, this)
	}
}

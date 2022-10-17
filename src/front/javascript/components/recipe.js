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
				const ingredients = Object.keys(plainFormData).map((key) => key !== 'recipe' && key !== 'id' && { title: plainFormData[key] }).filter((ingredient) => ingredient)
				if (this.#isInEditMode) {
					this.#currentRecipe.ingredients = ingredients.map((pIngredient) => pIngredient.title)
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

	#addIngredient (pEvent) {
		Commons.setPropositions()
		const button = pEvent.target.closest('button')
		const previousSibling = button?.previousElementSibling
		const input = pEvent.target.tagName === 'INPUT' ? pEvent.target : previousSibling?.querySelector('input')
		if (input?.value) {
			this.#newIngredients.push(input.value)
			input.value = ''
			this.#render()
		}
	}

	#removeIngredient (pIndex) {
		Commons.setPropositions()
		this.#newIngredients.splice(pIndex, 1)
		this.#render()
	}

	#render () {
		render(html`
			<h2>${this.#title}</h2>
			<form>
				<label>
					<span>Nom</span>
					<input name="recipe" required type="text" value="${this.#currentRecipeTitle || ''}">
					<input name="id" type="hidden" value="${this.#currentRecipeId || ''}">
				</label>
				<fieldset class="ingredients">
					<legend>Ingrédients</legend>
					${this.#newIngredients?.map(
							(pText, pIndex) => html`
								<div class="grid ${this.#isEditAndAddIngredient && this.#newIngredients.length - 1 === pIndex ? 'threeCol' : ''}">
									<label>
										<input name="ingredient_${pIndex + 1}" required type="text" value="${pText}"/>
									</label>
									<button type="button" class="remove" @click="${() => this.#removeIngredient(pIndex)}">
										<svg class="minus">
											<use href="#minus"></use>
										</svg>
										<span>Supprimer un ingrédient</span>
									</button>
									${this.#isEditAndAddIngredient && this.#newIngredients.length - 1 === pIndex ? html`
										<button type="button" class="add" @click="${(pEvent) => {
											this.#isEditAndAddIngredient = false
											this.#addIngredient(pEvent)
										}}">
											<svg class="add">
												<use href="#add"></use>
											</svg>
											<span>Ajouter un ingrédient</span>
										</button>
									` : ''}
								</div>
							`
					)}
					${!this.#isEditAndAddIngredient ? html`
						<div class="grid">
							<label>
								<input
										name="ingredient_0"
										required
										type="text"
										@keyup="${(pEvent) => {
											Commons.managePropositions(pEvent, (pEvent) => this.#addIngredient(pEvent))
											this.#render()
										}}"
								/>
							</label>
							<button type="button" class="add" @click="${(pEvent) => this.#addIngredient(pEvent)}">
								<svg class="add">
									<use href="#add"></use>
								</svg>
								<span>Ajouter un ingrédient</span>
							</button>
							<fs-propose list="${Commons.propositions}" @listReset="${() => {
								Commons.setPropositions()
								this.#render()
							}}"></fs-propose>
					` : ''}
					</div>
				</fieldset>
				<button type="submit">
					<span>${this.#submitButtonName}</span>
				</button>
			</form>
		`, this)
	}
}

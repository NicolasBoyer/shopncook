import { html, render } from 'https://cdn.jsdelivr.net/npm/lit-html'
import { Utils } from '../utils.js'
import { Commons } from '../commons.js'

export default class Recipe extends HTMLElement {
	async connectedCallback () {
		Commons.clearPropositionsOnBackgroundClick(() => this.render())
		const splitUrl = location.pathname.split('/')
		this.submitButtonName = 'Ajouter'
		this.title = 'Ajouter une recette'
		this.isInEditMode = splitUrl.includes('edit')
		if (this.isInEditMode) {
			const currentRecipe = await Utils.request('/db', 'POST', { body: `{ "getRecipes": { "slug": "${splitUrl[splitUrl.length - 1]}" } }` })
			if (Array.isArray(currentRecipe)) location.href = location.origin + '/404.html'
			this.currentRecipeTitle = currentRecipe.title
			this.currentRecipeId = currentRecipe._id
			this.submitButtonName = 'Modifier'
			this.title = 'Modifier une recette'
			this.newIngredients = currentRecipe.ingredients
		} else this.newIngredients = []
		Commons.savedIngredients = await Utils.request('/db', 'POST', { body: '{ "getIngredients": "" }' })
		document.body.style.display = 'flex'
		this.render()
		this.setFormListener()
	}

	setFormListener () {
		const form = this.querySelector('form')
		form.addEventListener('keypress', async (pEvent) => {
			if (pEvent.key === 'Enter') pEvent.preventDefault()
		})
		form.addEventListener('submit', async (pEvent) => {
			pEvent.preventDefault()
			try {
				const splitUrl = location.pathname.split('/')
				const isEdit = splitUrl.includes('edit')
				const plainFormData = Object.fromEntries(new FormData(form).entries())
				const id = plainFormData.id
				const response = await Utils.request('/db', 'POST', { body: `{ "setRecipe": { "title": "${plainFormData.recipe}", ${id ? `"id": "${id}",` : ''} "ingredients": ${JSON.stringify(Object.keys(plainFormData).map((key) => key !== 'recipe' && key !== 'id' && { title: plainFormData[key] }).filter((ingredient) => ingredient))}} }` })
				if (isEdit) location.href = '/recipes'
				else {
					this.newIngredients = []
					document.querySelectorAll('input').forEach((input) => {
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

	addIngredient (pEvent) {
		Commons.setPropositions()
		const button = pEvent.target.closest('button')
		const previousSibling = button && button.previousElementSibling
		const input = pEvent.target.tagName === 'INPUT' ? pEvent.target : previousSibling && previousSibling.querySelector('input')
		if (input && input.value) {
			this.newIngredients.push(input.value)
			input.value = ''
			this.render()
		}
	}

	removeIngredient (pIndex) {
		Commons.setPropositions()
		this.newIngredients.splice(pIndex, 1)
		this.render()
	}

	render () {
		render(html`
			<h2>${this.title}</h2>
			<form>
				<label>
					<span>Nom</span>
					<input name="recipe" required type="text" value="${this.currentRecipeTitle || ''}">
					<input name="id" type="hidden" value="${this.currentRecipeId || ''}">
				</label>
				<fieldset class="ingredients">
					<legend>Ingrédients</legend>
					${this.newIngredients.map(
							(pText, pIndex) => html`
								<div class="grid ${this.isInEditMode && this.newIngredients.length - 1 === pIndex ? 'threeCol' : ''}">
									<label>
										<input name="ingredient_${pIndex + 1}" required type="text" value="${pText}"/>
									</label>
									<button type="button" class="remove" @pointerup="${() => this.removeIngredient(pIndex)}">
										<svg class="minus">
											<use href="#minus"></use>
										</svg>
										<span>Supprimer un ingrédient</span>
									</button>
									${this.isInEditMode && this.newIngredients.length - 1 === pIndex ? html`
										<button type="button" class="add" @pointerup="${(pEvent) => {
											this.isInEditMode = false
											this.addIngredient(pEvent)
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
					${!this.isInEditMode ? html`
						<div class="grid">
							<label>
								<input
										name="ingredient_0"
										required
										type="text"
										@keyup="${(pEvent) => {
											Commons.managePropositions(pEvent, (pEvent) => this.addIngredient(pEvent))
											this.render()
										}}"
								/>
							</label>
							<button type="button" class="add" @pointerup="${(pEvent) => this.addIngredient(pEvent)}">
								<svg class="add">
									<use href="#add"></use>
								</svg>
								<span>Ajouter un ingrédient</span>
							</button>
							<fs-propose list="${Commons.propositions}" @listReset="${() => {
								Commons.setPropositions()
								this.render()
							}}"></fs-propose>
					` : ''}
					</div>
				</fieldset>
				<button type="submit">
					<span>${this.submitButtonName}</span>
				</button>
			</form>
		`, this)
	}
}

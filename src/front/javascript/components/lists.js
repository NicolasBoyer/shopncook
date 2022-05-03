import { html, render } from 'https://cdn.jsdelivr.net/npm/lit-html'
import { Utils } from '../utils.js'
import { Commons } from '../commons.js'

export default class Lists extends HTMLElement {
	async connectedCallback () {
		Commons.clearPropositionsOnBackgroundClick(() => this.render())
		this.ingredients = await this.getListIngredients()
		this.savedIngredients = await Utils.request('/db', 'POST', { body: '{ "getIngredients": "" }' })
		Commons.savedIngredients = this.savedIngredients.map((pIngredient) => pIngredient.title)
		this.recipeChoices = []
		this.orderedIngredients = this.ingredients.filter((pIngredient) => pIngredient.ordered).map((pIngredient) => pIngredient.title)
		this.render()
	}

	async getListIngredients () {
		return await Utils.request('/db', 'POST', { body: '{ "getListIngredients": "" }' })
	}

	resetMode () {
		this.editMode = null
		this.render()
	}

	async editAndSaveListIngredient (oldIngredient, newIngredient, ordered = false) {
		this.ingredients = await Utils.request('/db', 'POST', { body: `{ "editListIngredient": { "oldIngredient": "${oldIngredient}", "newIngredient": "${newIngredient}", "ordered": ${ordered} } }` })
		this.resetMode()
	}

	async removeListIngredient (pIngredient) {
		Utils.confirm(html`<h3>Voulez-vous vraiment supprimer ?</h3>`, async () => {
			this.ingredients = await Utils.request('/db', 'POST', { body: `{ "removeListIngredient": "${pIngredient}" }` })
			this.render()
			Utils.toast('success', 'Ingrédient supprimé')
		})
	}

	async saveListIngredient (pEvent) {
		Commons.setPropositions()
		const input = pEvent.target.tagName === 'INPUT' ? pEvent.target : pEvent.target.closest('button').previousElementSibling
		if (input && input.value) {
			this.ingredients = await Utils.request('/db', 'POST', { body: `{ "setListIngredient": "${input.value}" }` })
			if (!Commons.savedIngredients.includes(input.value)) Commons.savedIngredients.push(input.value)
			input.value = ''
			this.render()
		}
	}

	addListIngredientByRecipe () {
		document.body.addEventListener('modalConfirm', (pEvent) => {
			this.recipeChoices = pEvent.detail.choices
		})
		Utils.confirm(html`
			<fs-recipes choiceMode/>
		`, async () => {
			if (this.recipeChoices.length) {
				const newIngredients = this.savedIngredients.filter((pIngredient) => pIngredient.recipes.length && pIngredient.recipes.some((pRecipe) => this.recipeChoices.includes(pRecipe))).map((pIngredient) => pIngredient.title)
				this.ingredients = await Utils.request('/db', 'POST', { body: `{ "setListIngredients": "${newIngredients}" }` })
				this.recipeChoices = []
				this.render()
			}
		})
	}

	clear () {
		Utils.confirm(html`<h3>Voulez vous vider la liste ?</h3>`, async () => {
			this.orderedIngredients = []
			this.ingredients = await Utils.request('/db', 'POST', { body: '{ "clearListIngredients": "" }' })
			this.render()
		})
	}

	render () {
		render(html`
			<div class="title">
				<h2>Votre liste</h2>
				<button type="button" class="trash" @pointerdown="${() => this.clear()}">
					<svg class="trash">
						<use href="#trash"></use>
					</svg>
					<span>Vider</span>
				</button>
			</div>
			<aside>
				<nav>
					<ul>
						${!this.ingredients.length ? html`
							<li>Aucun ingrédient ...</li>` : this.ingredients.map(
								(pIngredient) => {
									const ingredientTitle = pIngredient.title
									const isIngredientOrdered = this.orderedIngredients.includes(ingredientTitle)
									return html`
										<li>
											<div class="editListIngredient">
												${this.editMode === ingredientTitle ? html`
													<input name="${ingredientTitle}" required type="text" value="${ingredientTitle}" @keyup="${(pEvent) => {
														if (pEvent.key === 'Enter') this.editAndSaveListIngredient(ingredientTitle, pEvent.target.value)
														if (pEvent.key === 'Escape') this.resetMode()
													}}"/>
												` : html`
													<a class="${isIngredientOrdered ? 'ordered' : ''}" @pointerdown="${() => {
														this.editAndSaveListIngredient(ingredientTitle, ingredientTitle, !isIngredientOrdered)
														if (!isIngredientOrdered) this.orderedIngredients.push(ingredientTitle)
														else this.orderedIngredients = this.orderedIngredients.filter((pOrderedIngredient) => ingredientTitle !== pOrderedIngredient)
														if (this.orderedIngredients.length === this.ingredients.length) this.clear()
													}}">${ingredientTitle}</a>
												`}
												${this.editMode === ingredientTitle ? html`
													<button class="valid" @pointerdown="${(pEvent) => this.editAndSaveListIngredient(ingredientTitle, pEvent.target.closest('button').previousElementSibling.value)}">
														<svg class="valid">
															<use href="#valid"></use>
														</svg>
														<span>Valider</span>
													</button>
												` : html`
													<button class="edit" @pointerdown="${() => {
														this.editMode = ingredientTitle
														this.render()
													}}" .disabled="${isIngredientOrdered}">
														<svg class="edit">
															<use href="#edit"></use>
														</svg>
														<span>Modifier</span>
													</button>
												`}
												${this.editMode === ingredientTitle ? html`
													<button type="button" class="undo" @pointerdown="${() => this.resetMode()}">
														<svg class="undo">
															<use href="#undo"></use>
														</svg>
														<span>Annuler</span>
													</button>
												` : html`
													<button type="button" class="remove" @pointerdown="${() => this.removeListIngredient(ingredientTitle)}" .disabled="${isIngredientOrdered}">
														<svg class="remove">
															<use href="#remove"></use>
														</svg>
														<span>Supprimer</span>
													</button>
												`}
											</div>
										</li>
									`
								}
						)}
						<li>
							<div class="addListIngredient grid">
								<input name="newIngredient" type="text" @keyup="${(pEvent) => {
									Commons.managePropositions(pEvent, () => this.saveListIngredient(pEvent))
									this.render()
								}}"/>
								<button type="button" class="add" @pointerdown="${(pEvent) => this.saveListIngredient(pEvent)}">
									<svg class="add">
										<use href="#add"></use>
									</svg>
									<span>Ajouter un ingrédient</span>
								</button>
								<button type="button" class="addList" @pointerdown="${() => this.addListIngredientByRecipe()}">
									<svg class="addList">
										<use href="#addList"></use>
									</svg>
									<span>Ajouter des ingrédients</span>
								</button>
								<fs-propose list="${Commons.propositions}" @listReset="${() => {
									Commons.setPropositions()
									this.render()
								}}"></fs-propose>
							</div>
						</li>
					</ul>
				</nav>
			</aside>
		`, this)
	}
}

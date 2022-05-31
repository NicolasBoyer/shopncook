import { html, render } from 'https://cdn.jsdelivr.net/npm/lit-html'
import autoAnimate from 'https://cdn.jsdelivr.net/npm/@formkit/auto-animate'
import { Utils } from '../utils.js'
import { Commons } from '../commons.js'

// TODO Categories, websocket

export default class Lists extends HTMLElement {
	async connectedCallback () {
		Utils.initWsConnection(async (event) => {
			this.ingredients = JSON.parse(await event.data.text())
			this.orderedIngredients = this.ingredients.length ? this.ingredients.filter((pIngredient) => pIngredient.ordered).map((pIngredient) => pIngredient._id) : []
			this.render()
			autoAnimate(document.querySelector('ul'))
		})
		Commons.clearPropositionsOnBackgroundClick(() => this.render())
		this.ingredients = await this.getListIngredients()
		await Commons.getIngredients()
		this.recipeChoices = []
		Utils.wsConnection.send(JSON.stringify(this.ingredients))
	}

	async getListIngredients () {
		return await Utils.request('/db', 'POST', { body: '{ "getListIngredients": "" }' })
	}

	resetMode () {
		this.editMode = null
		Utils.wsConnection.send(JSON.stringify(this.ingredients))
	}

	async editAndSaveListIngredient (pEvent, id) {
		Commons.setPropositions()
		const input = pEvent.target.tagName === 'INPUT' && pEvent.target.name === 'ingredient' ? pEvent.target : pEvent.target.tagName === 'INPUT' && pEvent.target.name === 'size' ? pEvent.target.previousElementSibling : pEvent.target.closest('button').previousElementSibling.previousElementSibling
		const categoryButton = input.parentElement.querySelector('button.setCategory')
		const categoryId = categoryButton?.getAttribute('data-id')
		const sizeInput = input.nextElementSibling
		if (input && input.value) {
			this.ingredients = await Utils.request('/db', 'POST', { body: `{ "setListIngredients": { "ingredients": [ { "title": "${input.value}"${id ? `, "id": "${id}"` : ''}${categoryId ? `, "category": "${categoryId}"` : ''}, "size": "${sizeInput.value}" } ] } }` })
			if (!id && Commons.savedIngredients && !Commons.savedIngredients.some((pIngredient) => pIngredient.title === input.value)) Commons.savedIngredients.push({ title: input.value })
			input.value = ''
			sizeInput.value = ''
			this.resetMode()
		}
	}

	async editListIngredientOrdered (id, ordered) {
		this.ingredients = await Utils.request('/db', 'POST', { body: `{ "setListIngredients": { "ingredients": [ { "id": "${id}", "ordered": ${ordered} } ] } }` })
		this.resetMode()
	}

	async removeListIngredient (id) {
		Utils.confirm(html`<h3>Voulez-vous vraiment supprimer ?</h3>`, async () => {
			this.ingredients = await Utils.request('/db', 'POST', { body: `{ "removeListIngredient": "${id}" }` })
			Utils.wsConnection.send(JSON.stringify(this.ingredients))
			Utils.toast('success', 'Ingrédient supprimé')
		})
	}

	addListIngredientByRecipe () {
		document.body.addEventListener('modalConfirm', (pEvent) => {
			this.recipeChoices = pEvent.detail.choices
		})
		Utils.confirm(html`
			<fs-recipes choiceMode/>
		`, async () => {
			if (this.recipeChoices.length) {
				const newIngredients = Commons.savedIngredients.filter((pIngredient) => pIngredient.recipes && pIngredient.recipes.length && pIngredient.recipes.some((pRecipeId) => this.recipeChoices.includes(pRecipeId))).map((pIngredient) => ({ title: pIngredient.title }))
				this.ingredients = await Utils.request('/db', 'POST', { body: `{ "setListIngredients": { "ingredients": ${JSON.stringify(newIngredients)} } }` })
				this.recipeChoices = []
				Utils.wsConnection.send(JSON.stringify(this.ingredients))
			}
		})
	}

	setCategory (pEvent) {
		// TODO choicemode pour categories
		let id, title
		document.body.addEventListener('modalConfirm', (pEvent) => {
			id = pEvent.detail.id
			title = pEvent.detail.title
		})
		const button = pEvent.currentTarget
		Utils.confirm(html`
			<fs-categories choiceMode/>
		`, async () => {
			// TODO ici
			button.setAttribute('data-tooltip', title)
			button.setAttribute('data-id', id)
		})
	}

	clear () {
		Utils.confirm(html`<h3>Voulez vous vider la liste ?</h3>`, async () => {
			this.orderedIngredients = []
			this.ingredients = await Utils.request('/db', 'POST', { body: '{ "clearListIngredients": "" }' })
			Utils.wsConnection.send(JSON.stringify(this.ingredients))
		})
	}

	render () {
		// TODO en cours sur category présent si pas de category
		render(html`
			<div class="title">
				<h2>Votre liste</h2>
				<button type="button" class="trash" @pointerup="${() => this.clear()}">
					<svg class="trash">
						<use href="#trash"></use>
					</svg>
					<span>Vider</span>
				</button>
			</div>
			<aside>
				<nav>
					<ul>
						<li>
							<div class="addListIngredient grid">
								<input name="ingredient" type="text" @keyup="${(pEvent) => {
									Commons.managePropositions(pEvent, () => this.editAndSaveListIngredient(pEvent))
									this.render()
								}}"/>
								<input name="size" type="text" @keyup="${(pEvent) => {
									if (pEvent.key === 'Enter') this.editAndSaveListIngredient(pEvent)
								}}"/>
								<button type="button" class="add" @pointerdown="${(pEvent) => this.editAndSaveListIngredient(pEvent)}">
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
						${!this.ingredients.length ? html`
							<li>Aucun ingrédient ...</li>` : this.ingredients.map(
								(pIngredient) => {
									const ingredientTitle = pIngredient.title
									const ingredientId = pIngredient._id
									const ingredientSize = pIngredient.size
									const isIngredientOrdered = this.orderedIngredients && this.orderedIngredients.includes(ingredientId)
									return html`
										<li>
											<div class="editListIngredient ${this.editMode === ingredientId ? 'grid' : ''}">
												${this.editMode === ingredientId ? html`
													<input name="ingredient" required type="text" value="${ingredientTitle}" @keyup="${(pEvent) => {
														if (pEvent.key === 'Enter') this.editAndSaveListIngredient(pEvent, ingredientId)
														if (pEvent.key === 'Escape') this.resetMode()
													}}"/>
													<input name="size" type="text" value="${ingredientSize}" @keyup="${(pEvent) => {
														if (pEvent.key === 'Enter') this.editAndSaveListIngredient(pEvent, ingredientId)
														if (pEvent.key === 'Escape') this.resetMode()
													}}"/>
												` : html`
													<a class="${isIngredientOrdered ? 'ordered' : ''}" @pointerup="${() => {
														this.editListIngredientOrdered(ingredientId, !isIngredientOrdered)
														if (!isIngredientOrdered) this.orderedIngredients.push(ingredientId)
														else this.orderedIngredients = this.orderedIngredients.filter((pOrderedIngredient) => ingredientId !== pOrderedIngredient)
														if (this.orderedIngredients.length === this.ingredients.length) this.clear()
													}}"><span>${ingredientTitle}${ingredientSize && html` (${ingredientSize})`}</span></a>
												`}
												${this.editMode === ingredientId ? html`
													<button class="valid" @pointerdown="${(pEvent) => this.editAndSaveListIngredient(pEvent, ingredientId)}">
														<svg class="valid">
															<use href="#valid"></use>
														</svg>
														<span>Valider</span>
													</button>
												` : html`
													<button class="edit" @pointerdown="${() => {
														this.editMode = ingredientId
														this.render()
													}}" .disabled="${isIngredientOrdered}">
														<svg class="edit">
															<use href="#edit"></use>
														</svg>
														<span>Modifier</span>
													</button>
												`}
												${this.editMode === ingredientId ? html`
													<button type="button" class="undo" @pointerdown="${() => this.resetMode()}">
														<svg class="undo">
															<use href="#undo"></use>
														</svg>
														<span>Annuler</span>
													</button>
												` : html`
													<button type="button" class="remove" @pointerdown="${() => this.removeListIngredient(ingredientId)}" .disabled="${isIngredientOrdered}">
														<svg class="remove">
															<use href="#remove"></use>
														</svg>
														<span>Supprimer</span>
													</button>
													<button type="button" class="setCategory" @pointerdown="${(pEvent) => this.setCategory(pEvent)}">
														<svg class="setCategory">
															<use href="#setCategory"></use>
														</svg>
														<span>Associer une catégorie</span>
													</button>
												`}
											</div>
										</li>
									`
								}
						)}
					</ul>
				</nav>
			</aside>
		`, this)
	}
}

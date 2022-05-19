import { html, render } from 'https://cdn.jsdelivr.net/npm/lit-html'
import { Utils } from '../utils.js'
import { Commons } from '../commons.js'

export default class Ingredients extends HTMLElement {
	async connectedCallback () {
		await Commons.getIngredients()
		this.search()
		this.querySelector('input').addEventListener('keyup', (pEvent) => this.search(pEvent.target.value))
	}

	async editAndSaveIngredient (id, title) {
		Commons.savedIngredients = (await Utils.request('/db', 'POST', { body: `{ "setIngredients": { "ingredients": [ { "title": "${title}", "id": "${id}" } ] } }` }))
		this.resetMode()
	}

	resetMode () {
		this.editMode = null
		this.search()
	}

	async removeIngredient (id) {
		Utils.confirm(html`<h3>Voulez-vous vraiment supprimer ?</h3>`, async () => {
			Commons.savedIngredients = (await Utils.request('/db', 'POST', { body: `{ "removeIngredient": "${id}" }` }))
			this.search()
			Utils.toast('success', 'Ingrédient supprimé')
		})
	}

	search (pValue) {
		this.ingredients = (pValue ? Commons.savedIngredients.filter((pIngredient) => pIngredient.title.toLowerCase().includes(pValue.toLowerCase())) : Commons.savedIngredients).sort((a, b) => a.title.localeCompare(b.title))
		this.render()
	}

	render () {
		render(html`
			<h2>Liste des ingrédients</h2>
			<label>
				<input type="search" name="search" placeholder="Rechercher"/>
			</label>
			<aside>
				<nav>
					<ul>
						${!this.ingredients.length ? html`
							<li>Aucun résultat</li>` : this.ingredients.map(
								(pIngredient) => {
									const ingredientTitle = pIngredient.title
									const ingredientId = pIngredient._id
									return html`
										<li>
											<div>
												${this.editMode === ingredientId ? html`
													<input name="${ingredientId}" required type="text" value="${ingredientTitle}" @keyup="${(pEvent) => {
														if (pEvent.key === 'Enter') this.editAndSaveIngredient(ingredientId, pEvent.target.value)
														if (pEvent.key === 'Escape') this.resetMode()
													}}"/>
												` : html`
													<span>${ingredientTitle}</span>
												`}
												${this.editMode === ingredientId ? html`
													<button class="valid" @pointerup="${(pEvent) => this.editAndSaveIngredient(ingredientId, pEvent.target.closest('button').previousElementSibling.value)}">
														<svg class="valid">
															<use href="#valid"></use>
														</svg>
														<span>Valider</span>
													</button>
												` : html`
													<button class="edit" @pointerup="${() => {
														this.editMode = ingredientId
														this.search()
													}}">
														<svg class="edit">
															<use href="#edit"></use>
														</svg>
														<span>Modifier</span>
													</button>
												`}
												${this.editMode === ingredientId ? html`
													<button type="button" class="undo" @pointerup="${() => this.resetMode()}">
														<svg class="undo">
															<use href="#undo"></use>
														</svg>
														<span>Annuler</span>
													</button>
												` : html`
													<button type="button" class="remove" @pointerup="${() => this.removeIngredient(ingredientId)}">
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
					</ul>
				</nav>
			</aside>
		`, this)
	}
}

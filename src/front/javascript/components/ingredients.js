import { html, render } from 'https://cdn.jsdelivr.net/npm/lit-html'
import { Utils } from '../utils.js'
import { Commons } from '../commons.js'

export default class Ingredients extends HTMLElement {
	async connectedCallback () {
		await Commons.getIngredients()
		this.search()
		this.querySelector('input').addEventListener('keyup', (pEvent) => this.search(pEvent.target.value))
	}

	async editAndSaveIngredient (oldIngredient, newIngredient) {
		Commons.savedIngredients = (await Utils.request('/db', 'POST', { body: `{ "editIngredient": { "oldIngredient": "${oldIngredient}", "newIngredient": "${newIngredient}" } }` })).map((pIngredient) => pIngredient.title)
		this.resetMode()
	}

	resetMode () {
		this.editMode = null
		this.search()
	}

	async removeIngredient (pIngredient) {
		Utils.confirm(html`<h3>Voulez-vous vraiment supprimer ?</h3>`, async () => {
			Commons.savedIngredients = (await Utils.request('/db', 'POST', { body: `{ "removeIngredient": "${pIngredient}" }` })).map((pIngredient) => pIngredient.title)
			this.search()
			Utils.toast('success', 'Ingrédient supprimé')
		})
	}

	search (pValue) {
		this.ingredients = (pValue ? Commons.savedIngredients.filter((pIngredient) => pIngredient.toLowerCase().includes(pValue.toLowerCase())) : Commons.savedIngredients).sort((a, b) => a.localeCompare(b))
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
								(pIngredient) => html`
									<li>
										<div>
											${this.editMode === pIngredient ? html`
												<input name="${pIngredient}" required type="text" value="${pIngredient}" @keyup="${(pEvent) => {
													if (pEvent.key === 'Enter') this.editAndSaveIngredient(pIngredient, pEvent.target.value)
													if (pEvent.key === 'Escape') this.resetMode()
												}}"/>
											` : html`
												<span>${pIngredient}</span>
											`}
											${this.editMode === pIngredient ? html`
												<button class="valid" @pointerup="${(pEvent) => this.editAndSaveIngredient(pIngredient, pEvent.target.closest('button').previousElementSibling.value)}">
													<svg class="valid">
														<use href="#valid"></use>
													</svg>
													<span>Valider</span>
												</button>
											` : html`
												<button class="edit" @pointerup="${() => {
													this.editMode = pIngredient
													this.search()
												}}">
													<svg class="edit">
														<use href="#edit"></use>
													</svg>
													<span>Modifier</span>
												</button>
											`}
											${this.editMode === pIngredient ? html`
												<button type="button" class="undo" @pointerup="${() => this.resetMode()}">
													<svg class="undo">
														<use href="#undo"></use>
													</svg>
													<span>Annuler</span>
												</button>
											` : html`
												<button type="button" class="remove" @pointerup="${() => this.removeIngredient(pIngredient)}">
													<svg class="remove">
														<use href="#remove"></use>
													</svg>
													<span>Supprimer</span>
												</button>
											`}
										</div>
									</li>
								`
						)}
					</ul>
				</nav>
			</aside>
		`, this)
	}
}

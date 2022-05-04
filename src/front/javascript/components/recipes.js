import { html, render } from 'https://cdn.jsdelivr.net/npm/lit-html'
import { Utils } from '../utils.js'

export default class Recipes extends HTMLElement {
	static get observedAttributes () { return ['choiceMode'] }

	get choiceMode () {
		return this.hasAttribute('choiceMode')
	}

	set choiceMode (pValue) {
		if (pValue) this.setAttribute('choiceMode', '')
		else this.removeAttribute('choiceMode')
	}

	async connectedCallback () {
		this.savedRecipes = await this.getRecipes()
		this.search()
		this.querySelector('input').addEventListener('keyup', (pEvent) => this.search(pEvent.target.value))
	}

	attributeChangedCallback (name, oldValue, newValue) {
		if ((name === 'choiceMode') && oldValue !== newValue) this.render()
	}

	async getRecipes () {
		return await Utils.request('/db', 'POST', { body: '{ "getRecipes": "" }' })
	}

	async removeRecipe (pRecipe) {
		Utils.confirm(html`<h3>Voulez-vous vraiment supprimer ?</h3>`, async () => {
			this.savedRecipes = await Utils.request('/db', 'POST', { body: `{ "removeRecipe": "${pRecipe.title}" }` })
			this.search()
			Utils.toast('success', 'Recette supprimée')
		})
	}

	search (pValue) {
		this.recipes = (pValue ? this.savedRecipes.filter((pRecipe) => pRecipe.title.toLowerCase().includes(pValue.toLowerCase())) : this.savedRecipes.length === 1 ? [this.savedRecipes] : this.savedRecipes).sort((a, b) => a.title.localeCompare(b.title))
		this.render()
	}

	render () {
		let choices = []
		render(html`
			${!this.choiceMode ? html`<h2>Liste des recettes</h2>` : ''}
			<label>
				<input type="search" name="search" placeholder="Rechercher"/>
			</label>
			<aside>
				<nav>
					<ul>
						${!this.recipes.length ? html`
							<li>Aucun résultat</li>` : this.recipes.map(
								(pRecipe) => html`
									<li>
										${this.choiceMode ? html`
											<label for="${pRecipe.slug}">
												<input type="checkbox" id="${pRecipe.slug}" name="${pRecipe.slug}" value="${pRecipe.title}" @change="${(pEvent) => {
													const value = pEvent.target.value
													if (pEvent.target.checked) choices.push(value)
													else choices = choices.filter((pChoice) => pChoice !== value)
													document.body.dispatchEvent(new CustomEvent('modalConfirm', { detail: { choices } }))
												}}">
												${pRecipe.title}
											</label>
										` : html`
											<div>
												<span>${pRecipe.title}</span>
												<a role="button" class="edit" href="/recipe/edit/${pRecipe.slug}">
													<svg class="edit">
														<use href="#edit"></use>
													</svg>
													<span>Éditer</span>
												</a>
												<button type="button" class="remove" @pointerdown="${() => this.removeRecipe(pRecipe)}">
													<svg class="remove">
														<use href="#remove"></use>
													</svg>
													<span>Supprimer</span>
												</button>
											</div>
											<div class="ingredients">
												${pRecipe.ingredients && pRecipe.ingredients.map((pIngredient, pIndex) => pIngredient + (pRecipe.ingredients.length - 1 === pIndex ? '' : ', '))}
											</div>
										`}
									</li>
								`
						)}
					</ul>
				</nav>
			</aside>
		`, this)
	}
}

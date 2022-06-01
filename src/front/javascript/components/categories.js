import { html, render } from 'https://cdn.jsdelivr.net/npm/lit-html'
import { Utils } from '../utils.js'

export default class Categories extends HTMLElement {
	get choiceMode () {
		const choiceMode = this.getAttribute('choiceMode')
		return choiceMode !== null ? choiceMode : null
	}

	set choiceMode (pValue) {
		if (pValue) this.setAttribute('choiceMode', pValue)
		else this.removeAttribute('choiceMode')
	}

	async connectedCallback () {
		this.categories = await Utils.request('/db', 'POST', { body: '{ "getCategories": "" }' })
		this.render()
	}

	resetMode () {
		this.editMode = null
		this.render()
	}

	async editAndSaveCategory (pEvent, id) {
		const input = pEvent.target.tagName === 'INPUT' ? pEvent.target : pEvent.target.closest('button').previousElementSibling
		if (input && input.value) {
			this.categories = await Utils.request('/db', 'POST', { body: `{ "setCategory": { "title": "${input.value}"${id ? `, "id": "${id}"` : ''} } }` })
			input.value = ''
			this.resetMode()
		}
	}

	async removeCategory (id) {
		Utils.confirm(html`<h3>Voulez-vous vraiment supprimer ?</h3>`, async () => {
			this.categories = await Utils.request('/db', 'POST', { body: `{ "removeCategory": "${id}" }` })
			this.render()
			Utils.toast('success', 'Catégorie supprimée')
		})
	}

	render () {
		this.categories.sort((a, b) => a.title.localeCompare(b.title))
		render(html`
			${this.choiceMode === null ? html`<h2>Liste des catégories</h2>` : ''}
			<aside>
				<nav>
					<ul>
						<li>
							${this.choiceMode === null
									? html`
										<div class="addCategory grid">
											<input name="newCategory" type="text" @keyup="${(pEvent) => {
												if (pEvent.key === 'Enter') this.editAndSaveCategory(pEvent)
											}}"/>
											<button type="button" class="add" @pointerdown="${(pEvent) => this.editAndSaveCategory(pEvent)}">
												<svg class="add">
													<use href="#add"></use>
												</svg>
												<span>Ajouter une catégorie</span>
											</button>
										</div>
									`
									: ''}
						</li>
						${!this.categories.length ? html`
							<li>Aucune catégorie ...</li>` : this.categories.map(
								(pCategory) => {
									const categoryTitle = pCategory.title
									const categoryId = pCategory._id
									return this.choiceMode !== null ? html`
										<label for="${categoryId}">
											<input type="radio" id="${categoryId}" name="category" value="${categoryTitle}" .checked="${this.choiceMode === categoryId}"
												   @change="${() => document.body.dispatchEvent(new CustomEvent('modalConfirm', { detail: { id: categoryId, title: categoryTitle } }))}">
											${categoryTitle}
										</label>
									` : html`
										<li>
											<div class="editCategory ${this.editMode === categoryId ? 'grid' : ''}">
												${this.editMode === categoryId ? html`
													<input name="editCategory" required type="text" value="${categoryTitle}" @keyup="${(pEvent) => {
														if (pEvent.key === 'Enter') this.editAndSaveCategory(pEvent, categoryId)
														if (pEvent.key === 'Escape') this.resetMode()
													}}"/>` : html`
													<span>${categoryTitle}</span>
												`}
												${this.editMode === categoryId ? html`
													<button class="valid" @pointerdown="${(pEvent) => this.editAndSaveCategory(pEvent, categoryId)}">
														<svg class="valid">
															<use href="#valid"></use>
														</svg>
														<span>Valider</span>
													</button>
												` : html`
													<button class="edit" @pointerdown="${() => {
														this.editMode = categoryId
														this.render()
													}}">
														<svg class="edit">
															<use href="#edit"></use>
														</svg>
														<span>Modifier</span>
													</button>
												`}
												${this.editMode === categoryId ? html`
													<button type="button" class="undo" @pointerdown="${() => this.resetMode()}">
														<svg class="undo">
															<use href="#undo"></use>
														</svg>
														<span>Annuler</span>
													</button>
												` : html`
													<button type="button" class="remove" @pointerdown="${() => this.removeCategory(categoryId)}">
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

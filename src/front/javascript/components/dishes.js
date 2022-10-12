import { html, render } from '../thirdParty/litHtml.js'
import { Utils } from '../classes/utils.js'
import { Commons } from '../classes/commons.js'
import { Caches } from '../classes/caches.js'

export default class Dishes extends HTMLElement {
	async connectedCallback () {
		this.week = ['Lundi', 'mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
		this.calendar = {
			Midi: this.week,
			Soir: this.week
		}
		const response = Caches.get('dishes', 'ingredients') || await Utils.request('/db', 'POST', { body: '[{ "getDishes": "" }, { "getIngredients": "" }]' })
		Caches.set('dishes', response[0], 'ingredients', response[1])
		this.dishes = response[0]
		Commons.savedIngredients = response[1]
		this.refresh()
	}

	openModal (pEvent, dish, isEdit) {
		pEvent.target.closest('details').removeAttribute('open')
		document.body.addEventListener('modalConfirm', (pEvent) => {
			this.dishName = pEvent.detail.dishName || pEvent.detail.title
			this.dishId = pEvent.detail.choices && pEvent.detail.choices[0] || null
		})
		Utils.confirm(isEdit ? html`
			<label for="firstname">
				<input type="text" value="${dish?.name}" @input="${(pEvent) => document.body.dispatchEvent(new CustomEvent('modalConfirm', { detail: { dishName: pEvent.target.value } }))}"/>
			</label>
		` : html`
			<fs-recipes choiceMode="radio"/>
		`, async () => {
			if (this.dishName) {
				dish.name = this.dishName
				this.dishes = await Utils.request('/db', 'POST', { body: `{ "setDish": ${JSON.stringify(dish)} }` })
				Caches.set('dishes', this.dishes)
			}
			this.refresh()
			if (!isEdit && this.dishName) {
				const newIngredients = Commons.savedIngredients.filter((pIngredient) => pIngredient.recipes && pIngredient.recipes.length && pIngredient.recipes.some((pRecipeId) => this.dishId === pRecipeId)).map((pIngredient) => ({
					title: pIngredient.title,
					category: pIngredient.category
				}))
				const listIngredients = await Utils.request('/db', 'POST', { body: `{ "setListIngredients": { "ingredients": ${JSON.stringify(newIngredients)} } }` })
				Caches.set('listIngredients', listIngredients)
			}
			this.dishName = ''
		})
	}

	refresh () {
		this.dishesByCalendar = this.dishes.reduce((group, dish) => {
			group[dish.time] = group[dish.time] ?? {}
			group[dish.time][dish.day] = group[dish.time][dish.day] ?? {}
			group[dish.time][dish.day] = dish
			return group
		}, {})
		this.render()
	}

	clear (pEvent, id) {
		if (pEvent) pEvent.target.closest('details').removeAttribute('open')
		Utils.confirm(html`<h3>Voulez vous effacer ${id ? 'ce plat' : 'les plats de la semaine'} ?</h3>`, async () => {
			this.dishes = await Utils.request('/db', 'POST', { body: `{ "clearDishes": "${id}" }` })
			Caches.set('dishes', this.dishes)
			this.refresh()
		})
	}

	render () {
		render(html`
			<div class="title">
				<h2>Les plats de la semaine</h2>
				<button type="button" class="trash" @click="${() => this.clear()}">
					<svg class="trash">
						<use href="#trash"></use>
					</svg>
					<span>Vider</span>
				</button>
			</div>
			<div class="content">
				<div class="grid">
					<div>#</div>
					${this.week.map((pDay) => {
						return html`
							<div>${pDay}</div>
						`
					})}
				</div>
				${Object.entries(this.calendar).map(([pTime, pDays]) => {
					return html`
						<div class="grid">
							<div>${pTime}</div>
							${pDays.map((pDay) => {
								const dish = (this.dishesByCalendar[pTime] && this.dishesByCalendar[pTime][pDay]) ?? { time: pTime, day: pDay }
								return html`
									<details role="list">
										<summary aria-haspopup="listbox" role="button">${dish.name}</summary>
										<ul role="listbox">
											<li>
												<button @click="${(pEvent) => this.openModal(pEvent, dish, true)}">Éditer</button>
											</li>
											<li>
												<button @click="${(pEvent) => this.openModal(pEvent, dish)}">Ajouter</button>
											</li>
											${dish._id && html`
												<li>
													<button @click="${(pEvent) => this.clear(pEvent, dish._id)}">Effacer</button>
												</li>
											`}
										</ul>
									</details>
								`
							})}
						</div>
					`
				})}
			</div>
		`, this)
	}
}

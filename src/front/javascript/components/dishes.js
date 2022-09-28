import { html, render } from '../thirdParty/litHtml.js'
import { Utils } from '../utils.js'
import { Commons } from '../commons.js'

export default class Dishes extends HTMLElement {
	async connectedCallback () {
		this.week = ['Lundi', 'mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
		this.calendar = {
			Midi: this.week,
			Soir: this.week
		}
		const response = await Utils.request('/db', 'POST', { body: '[{ "getDishes": "" }, { "getIngredients": "" }]' })
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
				if (!isEdit) {
					const newIngredients = Commons.savedIngredients.filter((pIngredient) => pIngredient.recipes && pIngredient.recipes.length && pIngredient.recipes.some((pRecipeId) => this.dishId === pRecipeId)).map((pIngredient) => ({
						title: pIngredient.title,
						category: pIngredient.category
					}))
					await Utils.request('/db', 'POST', { body: `{ "setListIngredients": { "ingredients": ${JSON.stringify(newIngredients)} } }` })
				}
				dish.name = this.dishName
				this.dishes = await Utils.request('/db', 'POST', { body: `{ "setDish": ${JSON.stringify(dish)} }` })
			}
			this.dishName = ''
			this.refresh()
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

	clear () {
		Utils.confirm(html`<h3>Voulez vous effacer les plats de la semaine ?</h3>`, async () => {
			this.dishes = await Utils.request('/db', 'POST', { body: '{ "clearDishes": "" }' })
			this.refresh()
		})
	}

	render () {
		render(html`
			<div class="title">
				<h2>Les plats de la semaine</h2>
				<button type="button" class="trash" @pointerup="${() => this.clear()}">
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

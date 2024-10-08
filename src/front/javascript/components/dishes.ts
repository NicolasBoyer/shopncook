import { html, render, TemplateResult } from 'lit'
import { Utils } from '../classes/utils.js'
import { Commons } from '../classes/commons.js'
import { Caches } from '../classes/caches.js'
import { Websocket } from '../classes/websocket.js'
import { HTMLElementEvent, TDish, TIngredient, TRecipeInIngredient } from '../types.js'

export default class Dishes extends HTMLElement {
    private week: string[] = []
    private calendar: Record<string, string[]> = {}
    private dishes: TDish[] = []
    private dishName: string = ''
    private dishId: string | null = null
    private dishesByCalendar: Record<string, Record<string, TDish>> = {}

    async connectedCallback(): Promise<void> {
        this.week = ['Lundi', 'mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
        this.calendar = {
            Midi: this.week,
            Soir: this.week,
        }
        const response = ((await Caches.get('dishes', 'ingredients')) || (await Utils.request('/db', 'POST', { body: '[{ "getDishes": "" }, { "getIngredients": "" }]' }))) as unknown as [TDish[], TIngredient[]]
        await Caches.set(false, 'dishes', response[0], 'ingredients', response[1])
        this.dishes = response[0]
        Commons.savedIngredients = response[1]
        this.refresh()
    }

    private openModal(pEvent: HTMLElementEvent<HTMLButtonElement>, dish: TDish, isEdit: boolean = false): void {
        pEvent.target.closest('details')?.removeAttribute('open')
        document.body.addEventListener('modalConfirm', (pEvent): void => {
            const detail = (pEvent as CustomEvent).detail
            this.dishName = detail.dishName || detail.title
            this.dishId = (detail.choices && detail.choices[0]) || null
        })
        Utils.confirm(
            isEdit
                ? html`
                      <label for="firstname">
                          <input
                              type="text"
                              value="${dish?.name}"
                              @input="${(pEvent: CustomEvent): boolean => document.body.dispatchEvent(new CustomEvent('modalConfirm', { detail: { dishName: (pEvent.target as HTMLInputElement).value } }))}"
                          />
                      </label>
                  `
                : html` <fs-recipes choiceMode="radio" /> `,
            async (): Promise<void> => {
                if (this.dishName) {
                    dish.name = this.dishName
                    this.dishes = (await Utils.request('/db', 'POST', { body: `{ "setDish": ${JSON.stringify(dish)} }` })) as TDish[]
                    await Caches.set(false, 'dishes', this.dishes)
                }
                this.refresh()
                if (!isEdit && this.dishName) {
                    const newIngredients = Commons.savedIngredients
                        .filter((pIngredient): number | boolean => pIngredient.recipes.length && pIngredient.recipes.some((pRecipe): boolean => pRecipe.recipeId === this.dishId))
                        .map((pIngredient): { category: string; title: string; unit: string; size: string } => {
                            const recipe = pIngredient.recipes.find((pRecipe): boolean => pRecipe.recipeId === this.dishId) as TRecipeInIngredient
                            return {
                                title: pIngredient.title,
                                category: pIngredient.category,
                                unit: recipe.unit,
                                size: recipe.size,
                            }
                        })
                    const listIngredients = (await Utils.request('/db', 'POST', { body: `{ "setListIngredients": { "ingredients": ${JSON.stringify(newIngredients)} } }` })) as TIngredient[]
                    await Caches.set(false, 'listIngredients', listIngredients)
                    Websocket.send(listIngredients)
                }
                this.dishName = ''
            }
        )
    }

    private refresh(): void {
        this.dishesByCalendar = this.dishes.reduce((group: Record<string, Record<string, TDish>>, dish): Record<string, Record<string, TDish>> => {
            group[dish.time] = group[dish.time] ?? {}
            group[dish.time][dish.day] = group[dish.time][dish.day] ?? {}
            group[dish.time][dish.day] = dish
            return group
        }, {})
        this.render()
    }

    private clear(pEvent: HTMLElementEvent<HTMLButtonElement> | null = null, id: string = ''): void {
        if (pEvent) pEvent.target.closest('details')?.removeAttribute('open')
        Utils.confirm(html`<h3>Voulez vous effacer ${id ? 'ce plat' : 'les plats de la semaine'} ?</h3>`, async (): Promise<void> => {
            this.dishes = (await Utils.request('/db', 'POST', { body: `{ "clearDishes": "${id || ''}" }` })) as TDish[]
            await Caches.set(false, 'dishes', this.dishes)
            this.refresh()
        })
    }

    private render(): void {
        render(
            html`
                <div class="title">
                    <h2>Les plats de la semaine</h2>
                    <button type="button" class="trash" @click="${(): void => this.clear()}">
                        <svg class="trash">
                            <use href="#trash"></use>
                        </svg>
                        <span>Vider</span>
                    </button>
                </div>
                <div class="content">
                    <div class="grid">
                        <div>#</div>
                        ${this.week.map((pDay): TemplateResult => {
                            return html` <div>${pDay}</div> `
                        })}
                    </div>
                    ${Object.entries(this.calendar).map(([pTime, pDays]): TemplateResult => {
                        return html`
                            <div class="grid">
                                <div>${pTime}</div>
                                ${pDays.map((pDay): TemplateResult => {
                                    const dish = (this.dishesByCalendar[pTime] && this.dishesByCalendar[pTime][pDay]) ?? { time: pTime, day: pDay }
                                    return html`
                                        <details class="dropdown">
                                            <summary aria-haspopup="listbox" role="button">${dish.name}</summary>
                                            <ul role="listbox">
                                                <li>
                                                    <button @click="${(pEvent: HTMLElementEvent<HTMLButtonElement>): void => this.openModal(pEvent, dish, true)}">Éditer</button>
                                                </li>
                                                <li>
                                                    <button @click="${(pEvent: HTMLElementEvent<HTMLButtonElement>): void => this.openModal(pEvent, dish)}">Ajouter</button>
                                                </li>
                                                ${dish._id &&
                                                html`
                                                    <li>
                                                        <button @click="${(pEvent: HTMLElementEvent<HTMLButtonElement>): void => this.clear(pEvent, dish._id.toString())}">Effacer</button>
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
            `,
            this
        )
    }
}

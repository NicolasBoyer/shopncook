import { html, render, TemplateResult } from 'lit'
import { Utils } from '../classes/utils.js'
import { Caches } from '../classes/caches.js'
import { HTMLElementEvent, TCategory, TIngredient } from '../types.js'

export default class Ingredients extends HTMLElement {
    private savedIngredients: TIngredient[] = []
    private editMode: string | null = null
    private ingredients: TIngredient[] = []
    private categories: TCategory[] = []

    async connectedCallback(): Promise<void> {
        const response = ((await Caches.get('ingredients', 'categories')) || (await Utils.request('/db', 'POST', { body: '[{ "getIngredients": "" }, { "getCategories": "" }]' }))) as unknown as [TIngredient[], TCategory[]]
        await Caches.set(false, 'ingredients', response[0], 'categories', response[1])
        this.savedIngredients = response[0]
        this.categories = response[1]
        this.search()
        this.querySelector('input')?.addEventListener('keyup', (pEvent: KeyboardEvent): void => this.search((pEvent.target as HTMLInputElement).value))
    }

    private async editAndSaveIngredient(id: string, title: string): Promise<void> {
        this.savedIngredients = (await Utils.request('/db', 'POST', { body: `{ "setIngredients": { "ingredients": [ { "title": "${title}", "id": "${id}" } ] } }` })) as TIngredient[]
        await Caches.set(false, 'ingredients', this.savedIngredients)
        this.resetMode()
    }

    private resetMode(): void {
        this.editMode = null
        this.search(this.querySelector('input')?.value)
    }

    private async removeIngredient(id: string): Promise<void> {
        Utils.confirm(html`<h3>Voulez-vous vraiment supprimer ?</h3>`, async (): Promise<void> => {
            this.savedIngredients = (await Utils.request('/db', 'POST', { body: `{ "removeIngredient": "${id}" }` })) as TIngredient[]
            await Caches.set(false, 'ingredients', this.savedIngredients)
            this.search(this.querySelector('input')?.value)
            Utils.toast('success', 'Ingrédient supprimé')
        })
    }

    private setCategory(ingredientId: string, ingredientTitle: string, selectedCategoryId: string): void {
        let categoryId: string
        document.body.addEventListener('modalConfirm', (pEvent): void => {
            categoryId = (pEvent as CustomEvent).detail.id
        })
        Utils.confirm(html` <fs-categories choiceMode="${selectedCategoryId}" /> `, async (): Promise<void> => {
            this.savedIngredients = (await Utils.request('/db', 'POST', { body: `{ "setIngredients": { "ingredients": [ { "title": "${ingredientTitle}", "id": "${ingredientId}", "category": "${categoryId}" } ] } }` })) as TIngredient[]
            await Caches.set(false, 'ingredients', this.savedIngredients)
            this.search()
        })
    }

    private search(pValue: string | null = null): void {
        this.ingredients = (pValue ? this.savedIngredients.filter((pIngredient): boolean => pIngredient.title.toLowerCase().includes(pValue.toLowerCase())) : this.savedIngredients).sort((a, b): number => a.title.localeCompare(b.title))
        this.render()
    }

    private render(): void {
        render(
            html`
                <h2>Liste des ingrédients</h2>
                <label>
                    <input type="search" name="search" placeholder="Rechercher" />
                </label>
                <aside>
                    <nav>
                        <ul>
                            ${!this.ingredients.length
                                ? html` <li>Aucun résultat</li>`
                                : this.ingredients.map((pIngredient): TemplateResult => {
                                      const ingredientTitle = pIngredient.title
                                      const category = this.categories.map((pCategory): string | false => pCategory._id.toString() === pIngredient.category && pCategory.title).filter((pCategory): string | false => pCategory)[0]
                                      const ingredientId = pIngredient._id
                                      return html`
                                          <li>
                                              <div>
                                                  ${this.editMode === ingredientId.toString()
                                                      ? html`
                                                            <input
                                                                name="${ingredientId}"
                                                                required
                                                                type="text"
                                                                value="${ingredientTitle}"
                                                                @keyup="${(pEvent: HTMLElementEvent<HTMLInputElement>): void => {
                                                                    if (pEvent.key === 'Enter') this.editAndSaveIngredient(ingredientId.toString(), pEvent.target.value)
                                                                    if (pEvent.key === 'Escape') this.resetMode()
                                                                }}"
                                                            />
                                                        `
                                                      : html` <span>${ingredientTitle}${category ? html` (${category})` : ''}</span> `}
                                                  ${this.editMode === ingredientId.toString()
                                                      ? html`
                                                            <button
                                                                class="valid"
                                                                @click="${(pEvent: HTMLElementEvent<HTMLButtonElement>): Promise<void> =>
                                                                    this.editAndSaveIngredient(ingredientId.toString(), (pEvent.target.closest('button')?.previousElementSibling as HTMLInputElement)?.value)}"
                                                            >
                                                                <svg class="valid">
                                                                    <use href="#valid"></use>
                                                                </svg>
                                                                <span>Valider</span>
                                                            </button>
                                                        `
                                                      : html`
                                                            <button
                                                                class="edit"
                                                                @click="${(): void => {
                                                                    this.editMode = ingredientId.toString()
                                                                    this.search(this.querySelector('input')?.value)
                                                                }}"
                                                            >
                                                                <svg class="edit">
                                                                    <use href="#edit"></use>
                                                                </svg>
                                                                <span>Modifier</span>
                                                            </button>
                                                        `}
                                                  ${this.editMode === ingredientId.toString()
                                                      ? html`
                                                            <button type="button" class="undo" @click="${(): void => this.resetMode()}">
                                                                <svg class="undo">
                                                                    <use href="#undo"></use>
                                                                </svg>
                                                                <span>Annuler</span>
                                                            </button>
                                                        `
                                                      : html`
                                                            <button type="button" class="remove" @click="${(): Promise<void> => this.removeIngredient(ingredientId.toString())}">
                                                                <svg class="remove">
                                                                    <use href="#remove"></use>
                                                                </svg>
                                                                <span>Supprimer</span>
                                                            </button>
                                                            <button type="button" class="setCategory" @click="${(): void => this.setCategory(ingredientId.toString(), ingredientTitle, pIngredient.category)}">
                                                                <svg class="setCategory">
                                                                    <use href="#setCategory"></use>
                                                                </svg>
                                                                <span>Associer une catégorie</span>
                                                            </button>
                                                        `}
                                              </div>
                                          </li>
                                      `
                                  })}
                        </ul>
                    </nav>
                </aside>
            `,
            this
        )
    }
}

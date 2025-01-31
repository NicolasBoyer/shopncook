import { html, render, TemplateResult } from 'lit'
import { Utils } from '../classes/utils.js'
import { Caches } from '../classes/caches.js'
import { HTMLElementEvent, TRecipe } from '../types.js'

export default class Recipes extends HTMLElement {
    private savedRecipes!: TRecipe[]
    private recipes!: TRecipe[]

    static get observedAttributes(): [string] {
        return ['choiceMode']
    }

    get choiceMode(): string | null {
        return this.getAttribute('choiceMode')
    }

    set choiceMode(pValue) {
        if (pValue) this.setAttribute('choiceMode', pValue)
        else this.removeAttribute('choiceMode')
    }

    async connectedCallback(): Promise<void> {
        this.savedRecipes = await this.getRecipes()
        this.search()
        this.querySelector('input')?.addEventListener('keyup', (pEvent: KeyboardEvent): void => this.search((pEvent.target as HTMLInputElement).value))
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        if (name === 'choiceMode' && oldValue !== newValue) this.render()
    }

    private async getRecipes(): Promise<TRecipe[]> {
        const recipes = ((await Caches.get('recipes')) || (await Utils.request('/db', 'POST', { body: '{ "getRecipes": "" }' }))) as TRecipe[]
        await Caches.set(false, 'recipes', recipes)
        return recipes
    }

    private removeRecipe(pRecipe: TRecipe): void {
        Utils.confirm(html`<h3>Voulez-vous vraiment supprimer ?</h3>`, async (): Promise<void> => {
            this.savedRecipes = (await Utils.request('/db', 'POST', { body: `{ "removeRecipe": "${pRecipe._id}" }` })) as TRecipe[]
            await Caches.set(false, 'recipes', this.savedRecipes)
            this.search()
            Utils.toast('success', 'Recette supprimée')
        })
    }

    private search(pValue: string | null = null): void {
        this.recipes = (
            pValue && Array.isArray(this.savedRecipes)
                ? this.savedRecipes.filter((pRecipe): boolean => pRecipe.title.toLowerCase().includes(pValue.toLowerCase()))
                : !Array.isArray(this.savedRecipes) && Object.keys(this.savedRecipes).length
                  ? [this.savedRecipes]
                  : this.savedRecipes
        ).sort((a, b): number => a.title.localeCompare(b.title))
        this.render()
    }

    private render(): void {
        let choices: string[] = []
        render(
            html`
                ${!this.choiceMode ? html`<h2>Liste des recettes</h2>` : ''}
                <label>
                    <input type="search" name="search" placeholder="Rechercher" />
                </label>
                <aside>
                    <nav>
                        <ul>
                            ${!this.recipes.length
                                ? html` <li>Aucun résultat</li>`
                                : this.recipes.map(
                                      (pRecipe): TemplateResult => html`
                                          <li>
                                              ${this.choiceMode
                                                  ? html`
                                                        <label for="${pRecipe.slug}">
                                                            <input
                                                                type="${this.choiceMode}"
                                                                id="${pRecipe.slug}"
                                                                name="${this.choiceMode === 'checkbox' ? pRecipe.slug : 'recipe'}"
                                                                value="${pRecipe.title}"
                                                                @change="${(pEvent: HTMLElementEvent<HTMLInputElement>): void => {
                                                                    const value = pRecipe._id.toString()
                                                                    if (pEvent.target.checked) choices.push(value)
                                                                    else choices = choices.filter((pChoice): boolean => pChoice !== value)
                                                                    let detail: { choices: string[]; title?: string } = { choices }
                                                                    if (this.choiceMode === 'radio') {
                                                                        detail = { ...detail, title: pRecipe.title }
                                                                    }
                                                                    document.body.dispatchEvent(new CustomEvent('modalConfirm', { detail }))
                                                                }}"
                                                            />
                                                            ${pRecipe.title}
                                                        </label>
                                                    `
                                                  : html`
                                                        <div>
                                                            <span>${pRecipe.title}</span>
                                                            <fs-link role="button" class="edit" href="/recipe/edit/${pRecipe.slug}">
                                                                <svg class="edit">
                                                                    <use href="#edit"></use>
                                                                </svg>
                                                                <span>Éditer</span>
                                                            </fs-link>
                                                            <button type="button" class="remove" @click="${(): void => this.removeRecipe(pRecipe)}">
                                                                <svg class="remove">
                                                                    <use href="#remove"></use>
                                                                </svg>
                                                                <span>Supprimer</span>
                                                            </button>
                                                        </div>
                                                        <div class="ingredients">${pRecipe.ingredients?.map((pIngredient, pIndex): string => pIngredient.title + (pRecipe.ingredients.length - 1 === pIndex ? '' : ', '))}</div>
                                                    `}
                                          </li>
                                      `
                                  )}
                        </ul>
                    </nav>
                </aside>
            `,
            this
        )
    }
}

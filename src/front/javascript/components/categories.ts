import { html, render, TemplateResult } from 'lit'
import { Utils } from '../classes/utils.js'
import { Caches } from '../classes/caches.js'
import { HTMLElementEvent, TCategory } from '../types.js'

export default class Categories extends HTMLElement {
    private categories: TCategory[] = []
    private editMode: string | null = null

    get choiceMode(): string | null {
        const choiceMode = this.getAttribute('choiceMode')
        return choiceMode !== null ? choiceMode : null
    }

    set choiceMode(pValue) {
        if (pValue) this.setAttribute('choiceMode', pValue)
        else this.removeAttribute('choiceMode')
    }

    async connectedCallback(): Promise<void> {
        this.categories = ((await Caches.get('categories')) || (await Utils.request('/db', 'POST', { body: '{ "getCategories": "" }' }))) as unknown as TCategory[]
        await Caches.set(false, 'categories', this.categories)
        this.render()
    }

    private resetMode(): void {
        this.editMode = null
        this.render()
    }

    private async editAndSaveCategory(pEvent: KeyboardEvent & HTMLElementEvent<HTMLInputElement>, id: string | null = null): Promise<void> {
        const input = pEvent.target.tagName === 'INPUT' ? pEvent.target : (pEvent.target.closest('button')?.previousElementSibling as HTMLInputElement)
        if (input?.value) {
            this.categories = (await Utils.request('/db', 'POST', { body: `{ "setCategory": { "title": "${input.value}"${id ? `, "id": "${id}"` : ''} } }` })) as unknown as TCategory[]
            await Caches.set(false, 'categories', this.categories)
            input.value = ''
            this.resetMode()
        }
    }

    private removeCategory(id: string): void {
        Utils.confirm(html`<h3>Voulez-vous vraiment supprimer ?</h3>`, async (): Promise<void> => {
            this.categories = (await Utils.request('/db', 'POST', { body: `{ "removeCategory": "${id}" }` })) as unknown as TCategory[]
            await Caches.set(false, 'categories', this.categories)
            this.render()
            Utils.toast('success', 'Catégorie supprimée')
        })
    }

    private render(): void {
        this.categories.sort((a, b): number => a.title.localeCompare(b.title))
        render(
            html`
                ${this.choiceMode === null ? html`<h2>Liste des catégories</h2>` : ''}
                <aside>
                    <nav>
                        <ul>
                            <li>
                                ${this.choiceMode === null
                                    ? html`
                                          <div class="addCategory grid">
                                              <input
                                                  name="newCategory"
                                                  type="text"
                                                  @keyup="${(pEvent: HTMLElementEvent<HTMLInputElement>): void => {
                                                      if (pEvent.key === 'Enter') this.editAndSaveCategory(pEvent)
                                                  }}"
                                              />
                                              <button type="button" class="add" @click="${(pEvent: HTMLElementEvent<HTMLInputElement>): Promise<void> => this.editAndSaveCategory(pEvent)}">
                                                  <svg class="add">
                                                      <use href="#add"></use>
                                                  </svg>
                                                  <span>Ajouter une catégorie</span>
                                              </button>
                                          </div>
                                      `
                                    : ''}
                            </li>
                            ${!this.categories.length
                                ? html` <li>Aucune catégorie ...</li>`
                                : this.categories.map((pCategory): TemplateResult => {
                                      const categoryTitle = pCategory.title
                                      const categoryId = pCategory._id.toString()
                                      return this.choiceMode !== null
                                          ? html`
                                                <label for="${categoryId}">
                                                    <input
                                                        type="radio"
                                                        id="${categoryId}"
                                                        name="category"
                                                        value="${categoryTitle}"
                                                        .checked="${this.choiceMode === categoryId}"
                                                        @change="${(): boolean => document.body.dispatchEvent(new CustomEvent('modalConfirm', { detail: { id: categoryId, title: categoryTitle } }))}"
                                                    />
                                                    ${categoryTitle}
                                                </label>
                                            `
                                          : html`
                                                <li>
                                                    <div class="editCategory ${this.editMode === categoryId ? 'grid' : ''}">
                                                        ${this.editMode === categoryId
                                                            ? html` <input
                                                                  name="editCategory"
                                                                  required
                                                                  type="text"
                                                                  value="${categoryTitle}"
                                                                  @keyup="${(pEvent: HTMLElementEvent<HTMLInputElement>): void => {
                                                                      if (pEvent.key === 'Enter') this.editAndSaveCategory(pEvent, categoryId)
                                                                      if (pEvent.key === 'Escape') this.resetMode()
                                                                  }}"
                                                              />`
                                                            : html` <span>${categoryTitle}</span> `}
                                                        ${this.editMode === categoryId
                                                            ? html`
                                                                  <button class="valid" @click="${(pEvent: HTMLElementEvent<HTMLInputElement>): Promise<void> => this.editAndSaveCategory(pEvent, categoryId)}">
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
                                                                          this.editMode = categoryId
                                                                          this.render()
                                                                      }}"
                                                                  >
                                                                      <svg class="edit">
                                                                          <use href="#edit"></use>
                                                                      </svg>
                                                                      <span>Modifier</span>
                                                                  </button>
                                                              `}
                                                        ${this.editMode === categoryId
                                                            ? html`
                                                                  <button type="button" class="undo" @click="${(): void => this.resetMode()}">
                                                                      <svg class="undo">
                                                                          <use href="#undo"></use>
                                                                      </svg>
                                                                      <span>Annuler</span>
                                                                  </button>
                                                              `
                                                            : html`
                                                                  <button type="button" class="remove" @click="${(): void => this.removeCategory(categoryId)}">
                                                                      <svg class="remove">
                                                                          <use href="#remove"></use>
                                                                      </svg>
                                                                      <span>Supprimer</span>
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

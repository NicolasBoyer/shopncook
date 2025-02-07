import { html, render } from 'lit'
import { HTMLElementEvent, TIngredient, TListIngredient } from '../types.js'

export class Commons {
    static strings = {
        ordered: 'Acheté',
        gram: 'Gr',
        centiliter: 'Cl',
        number: 'Nb',
        gramComplete: 'Gramme',
        centiliterComplete: 'Centilitre',
        numberComplete: 'Nombre',
    }

    static propositions: string[]
    static savedIngredients: TIngredient[]

    static renderAddIngredientInDialog(ingredient: TListIngredient, isReset = false): void {
        const element = document.querySelector('sc-confirm > dialog > article')
        render(
            isReset
                ? ''
                : html`
                      <div class="addIngredient">
                          <input
                              autocomplete="off"
                              class="ingredient"
                              name="ingredient"
                              required
                              type="text"
                              value="${ingredient?.title}"
                              @input="${(pEvent: HTMLElementEvent<HTMLInputElement>): boolean => document.body.dispatchEvent(new CustomEvent('modalConfirm', { detail: { event: pEvent } }))}"
                              @keyup="${(pEvent: HTMLElementEvent<HTMLInputElement>): void => {
                                  if (pEvent.key !== 'Enter') {
                                      Commons.managePropositions(pEvent)
                                      this.renderAddIngredientInDialog(ingredient, isReset)
                                  }
                              }}"
                          />
                          <sc-propose
                              list="${Commons.propositions}"
                              @listReset="${(): void => {
                                  Commons.setPropositions()
                                  this.renderAddIngredientInDialog(ingredient, isReset)
                              }}"
                          ></sc-propose>
                      </div>
                      <input
                          autocomplete="off"
                          class="size"
                          name="size"
                          type="number"
                          value="${ingredient?.size}"
                          @change="${(pEvent: HTMLElementEvent<HTMLInputElement>): boolean => document.body.dispatchEvent(new CustomEvent('modalConfirm', { detail: { event: pEvent } }))}"
                      />
                      <select class="unit" name="'unit'" @input="${(pEvent: HTMLElementEvent<HTMLInputElement>): boolean => document.body.dispatchEvent(new CustomEvent('modalConfirm', { detail: { event: pEvent } }))}">
                          <option class="nb" ?selected="${ingredient?.unit === 'nb'}" value="nb">${this.strings.numberComplete}</option>
                          <option class="g" ?selected="${ingredient?.unit === 'g'}" value="g">${this.strings.gramComplete}</option>
                          <option class="cl" ?selected="${ingredient?.unit === 'cl'}" value="cl">${this.strings.centiliterComplete}</option>
                      </select>
                  `,
            element as HTMLElement,
            { renderBefore: element?.querySelector('footer') }
        )
    }

    static setPropositions(pValue: string | null = null): void {
        if (!this.savedIngredients || !this.savedIngredients.length) return
        this.propositions = pValue ? this.savedIngredients.map((pIngredient: TIngredient): string => pIngredient.title).filter((pIngredient: string): boolean => pIngredient.toLowerCase().includes(pValue.toLowerCase())) : []
    }

    static clearPropositionsOnBackgroundClick(pCb: () => void): void {
        document.body.addEventListener('click', (pEvent: MouseEvent): void => {
            if (!(pEvent.target as HTMLElement).closest('div.propose')) {
                this.setPropositions()
                pCb()
            }
        })
    }

    static managePropositions(pEvent: HTMLElementEvent<HTMLInputElement>): void {
        const input = pEvent.target
        this.setPropositions(input.value)
        if (pEvent.key === 'ArrowDown' && this.propositions) (input.closest('article')?.querySelector('sc-propose a:first-child') as HTMLElement).focus()
        else if (input.value.length === 0 || (this.propositions.length && this.propositions.length === 1 && this.propositions[0].toLowerCase() === input.value?.toLowerCase())) {
            if (this.propositions[0]?.toLowerCase() === input.value?.toLowerCase()) input.value = this.propositions[0]
            this.setPropositions()
        }
    }
}

Commons.savedIngredients = []

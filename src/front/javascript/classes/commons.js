import { html, render } from '../thirdParty/litHtml.js'

export class Commons {
	static strings = {
		ordered: 'Acheté',
		gram: 'Gr',
		centiliter: 'Cl',
		number: 'Nb',
		gramComplete: 'Gramme',
		centiliterComplete: 'Centilitre',
		numberComplete: 'Nombre'
	}

	static renderAddIngredientInDialog (ingredient, isReset) {
		const element = document.querySelector('fs-confirm > dialog > article')
		render(isReset ? '' : html`
			<div class="addIngredient">
				<input
						autocomplete="off" class="ingredient" name="ingredient" required type="text" value="${ingredient?.title}"
						@input="${(pEvent) => document.body.dispatchEvent(new CustomEvent('modalConfirm', { detail: { event: pEvent } }))}"
						@keyup="${(pEvent) => {
							if (pEvent.key !== 'Enter') {
								Commons.managePropositions(pEvent)
								this.renderAddIngredientInDialog(ingredient, isReset)
							}
						}}"/>
				<fs-propose list="${Commons.propositions}" @listReset="${() => {
					Commons.setPropositions()
					this.renderAddIngredientInDialog(ingredient, isReset)
				}}"></fs-propose>
			</div>
			<input autocomplete="off" class="size" name="size" type="number" value="${ingredient?.size}" @change="${(pEvent) => document.body.dispatchEvent(new CustomEvent('modalConfirm', { detail: { event: pEvent } }))}"/>
			<select class="unit" name="'unit'" @input="${(pEvent) => document.body.dispatchEvent(new CustomEvent('modalConfirm', { detail: { event: pEvent } }))}">
				<option class="nb" ?selected="${ingredient?.unit === 'nb'}" value="nb">${this.strings.numberComplete}</option>
				<option class="g" ?selected="${ingredient?.unit === 'g'}" value="g">${this.strings.gramComplete}</option>
				<option class="cl" ?selected="${ingredient?.unit === 'cl'}" value="cl">${this.strings.centiliterComplete}</option>
			</select>
		`, element, { renderBefore: element.querySelector('footer') })
	}

	static setPropositions (pValue) {
		if (!this.savedIngredients || !this.savedIngredients.length) return
		this.propositions = pValue ? this.savedIngredients.length && this.savedIngredients.map((pIngredient) => pIngredient.title).filter((pIngredient) => pIngredient.toLowerCase().includes(pValue.toLowerCase())) : []
	}

	static clearPropositionsOnBackgroundClick (pCb) {
		document.body.addEventListener('click', (pEvent) => {
			if (!pEvent.target.closest('div.propose')) {
				this.setPropositions()
				pCb()
			}
		})
	}

	static managePropositions (pEvent, pEnterFunction) {
		const input = pEvent.target
		this.setPropositions(input.value)
		if (pEvent.key === 'ArrowDown' && this.propositions) input.closest('article').querySelector('fs-propose a:first-child').focus()
		else if (input.value.length === 0 || this.propositions.length && this.propositions.length === 1 && this.propositions[0].toLowerCase() === input.value?.toLowerCase()) {
			if (this.propositions[0]?.toLowerCase() === input.value?.toLowerCase()) input.value = this.propositions[0]
			this.setPropositions()
		}
	}
}

Commons.savedIngredients = []

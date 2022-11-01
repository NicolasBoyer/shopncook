import { html } from '../thirdParty/litHtml.js'

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

	static focusIngredient (pEvent, pClass, pPlaceholder = '', pIsUnit = false) {
		if (pPlaceholder) pEvent.target.closest('.grid').classList.add(pClass)
		else pEvent.target.closest('.grid').classList.remove(pClass)
		pEvent.target.placeholder = pPlaceholder
		if (pIsUnit) {
			pEvent.target.querySelector('.nb').innerHTML = pPlaceholder ? this.strings.numberComplete : this.strings.number
			pEvent.target.querySelector('.g').innerHTML = pPlaceholder ? this.strings.gramComplete : this.strings.gram
			pEvent.target.querySelector('.cl').innerHTML = pPlaceholder ? this.strings.centiliterComplete : this.strings.centiliter
		}
	}

	static getUnitSelect (pName, pValue) {
		return html`
			<select class="unit" name="${pName || 'unit'}" @focus="${(pEvent) => this.focusIngredient(pEvent, 'unitFocused', 'Unité', true)}" @blur="${(pEvent) => this.focusIngredient(pEvent, 'unitFocused', '', true)}">
				<option class="nb" ?selected="${pValue === 'nb'}" value="nb">${this.strings.number}</option>
				<option class="g" ?selected="${pValue === 'g'}" value="g">${this.strings.gram}</option>
				<option class="cl" ?selected="${pValue === 'cl'}" value="cl">${this.strings.centiliter}</option>
			</select>
		`
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
		if (pEvent.key === 'ArrowDown' && this.propositions) input.closest('.grid').querySelector('fs-propose a:first-child').focus()
		else if (input.value.length === 0 || this.propositions.length && this.propositions.length === 1 && this.propositions[0].toLowerCase() === input.value?.toLowerCase()) {
			if (this.propositions[0]?.toLowerCase() === input.value?.toLowerCase()) input.value = this.propositions[0]
			this.setPropositions()
		}
	}
}

Commons.savedIngredients = []

import { html } from '../thirdParty/litHtml.js'

export class Commons {
	static strings = {
		ordered: 'Acheté',
		gram: 'Gr',
		centiliter: 'Cl',
		number: 'Nb'
	}

	static getUnitSelect (pName, pValue) {
		return html`
			<select class="unit" name="${pName || 'unit'}">
				<option ?selected="${pValue === 'nb'}" value="nb">${this.strings.number}</option>
				<option ?selected="${pValue === 'g'}" value="g">${this.strings.gram}</option>
				<option ?selected="${pValue === 'cl'}" value="cl">${this.strings.centiliter}</option>
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

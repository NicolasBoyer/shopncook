import { html } from '../thirdParty/litHtml.js'

export class Commons {
	static strings = {
		ordered: 'Acheté',
		gram: 'Gramme',
		centiliter: 'Centilitre',
		number: 'Nombre'
	}

	static getUnitSelect (pName, pValue) {
		return html`
			<select name="${pName || 'unit'}">
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

	static async managePropositions (pEvent, pEnterFunction) {
		const input = pEvent.target
		this.setPropositions(input.value)
		if (pEvent.key === 'Enter') {
			// TODO rendu ici essai de supprimer le bug de choix avec un entrée
			console.log(pEvent.target)
			pEnterFunction(pEvent)
			pEvent.preventDefault()
		} else if (pEvent.key === 'ArrowDown' && this.propositions) input.closest('.grid').querySelector('fs-propose a:first-child').focus()
		else if (this.propositions.length) {
			if (input.value.length === 0 || this.propositions.length === 1 && this.propositions[0].toLowerCase() === input.value) {
				if (this.propositions[0].toLowerCase() === input.value) input.value = this.propositions[0]
				this.setPropositions()
			}
		}
	}
}

Commons.savedIngredients = []

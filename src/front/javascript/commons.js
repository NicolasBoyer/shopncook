export class Commons {
	static setPropositions (pValue) {
		if (!this.savedIngredients || !this.savedIngredients.length) return
		this.propositions = pValue ? this.savedIngredients.length && this.savedIngredients.map((pIngredient) => pIngredient.title).filter((pIngredient) => pIngredient.toLowerCase().includes(pValue.toLowerCase())) : []
	}

	static clearPropositionsOnBackgroundClick (pCb) {
		document.body.addEventListener('pointerup', (pEvent) => {
			if (!pEvent.target.closest('div.propose')) {
				this.setPropositions()
				pCb()
			}
		})
	}

	static async managePropositions (pEvent, pEnterFunction) {
		const input = pEvent.target
		this.setPropositions(input.value)
		if (pEvent.key === 'Enter') pEnterFunction(pEvent)
		else if (pEvent.key === 'ArrowDown' && this.propositions) input.closest('.grid').querySelector('fs-propose a:first-child').focus()
		else if (this.propositions.length) {
			if (input.value.length === 0 || this.propositions.length === 1 && this.propositions[0].toLowerCase() === input.value) {
				if (this.propositions[0].toLowerCase() === input.value) input.value = this.propositions[0]
				this.setPropositions()
			}
		}
	}
}

Commons.savedIngredients = []

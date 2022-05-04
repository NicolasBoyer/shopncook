import { Utils } from './utils.js'

export class Commons {
	static async getIngredients () {
		this.savedIngredients = await Utils.request('/db', 'POST', { body: '{ "getIngredients": { "map": "title" } }' })
		return this.savedIngredients
	}

	static setPropositions (pValue) {
		this.propositions = pValue ? this.savedIngredients.filter((pIngredient) => pIngredient.toLowerCase().includes(pValue.toLowerCase())) : []
	}

	static clearPropositionsOnBackgroundClick (pCb) {
		document.body.addEventListener('pointerup', (pEvent) => {
			if (!pEvent.target.closest('div.propose')) {
				this.setPropositions()
				pCb()
			}
		})
	}

	static managePropositions (pEvent, pEnterFunction) {
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

import Toast from './components/toast.js'
import Propose from './components/propose.js'
import { Dom, Utils } from './utils.js'
import Confirm from './components/confirm.js'
import Recipes from './components/recipes.js'
import Ingredients from './components/ingredients.js'
import Recipe from './components/recipe.js'
import Lists from './components/lists.js'
import Header from './components/header.js'
import Login from './components/login.js'
import Categories from './components/categories.js'
import AnimatedSection from './components/animatedSection.js'
import Loader from './components/loader.js'
import LoadingBlock from './components/loadingBlock.js'
import Dishes from './components/dishes.js'
import Link from './components/link.js'

class App {
	// TODO images pour la page de home
	// TODO size dans recette (transformer size avec une unité)
	// TODO Liste de ce qui est présent dans le congelé
	// TODO Choix pour activer les fonctionnalités
	// TODO permettre qu'il existe plusieurs sessions différentes pour que plusieurs personnes puissent l'utiliser sans être sur le même compte
	// TODO permettre de rendre payant
	// TODO minifier et combiner les fichiers js clients dans app.js
	// TODO faire en sorte de mettre en cache certaines requetes pour ne pas à avoir les faire à chaque fois ...
	// TODO repasser sur les var && et remplacer par var?. si possible
	// TODO Si possible de plus minifier
	// TODO récupérer les fonts dans les sources
	// TODO si on met un / derrière app ça marche pas
	// TODO revoir la conf qua pour faire en sorte de modifier aussi l'appel vers le min.js dans page.html
	// TODO revoir les erreurs en loc autoanimate
	// TODO Test ajout recette
	// TODO bug car quand recherche un ingredient alors que recherche si suppr rest de la liste
	// TODO bug dishes lors ajourt recette -> fait mais peut potentiellement etre lent voir si améliorable avec websocket
	// TODO Mise en place de test auto ?
	// TODO si pas de categories la categ non acheté ne se crée pas

	constructor () {
		this.setBackButton()
		Utils.helpers()
		this.wakeLock()
	}

	async wakeLock () {
		let wakeLock = null
		const requestWakeLock = async () => {
			try {
				wakeLock = await navigator.wakeLock.request()
			} catch (err) {
				console.error(`${err.name}, ${err.message}`)
			}
		}
		document.addEventListener('visibilitychange', async () => {
			if (wakeLock !== null && document.visibilityState === 'visible') {
				await requestWakeLock()
			}
		})
		await requestWakeLock()
	}

	setBackButton () {
		if (location.pathname.split('/').filter((pPart) => pPart).length && history.length > 2) {
			const bd = Dom.newDom(document.querySelector('fs-header > div:first-child'))
			bd.elt('a', 'back').att('role', 'button').att('href', '#').listen('click', () => history.back())
			bd.svg('back').up()
			bd.elt('span').text('Retour').up()
			bd.up()
		}
	}
}

new App()
customElements.define('fs-loader', Loader)
customElements.define('fs-header', Header)
customElements.define('fs-toast', Toast)
customElements.define('fs-confirm', Confirm)
customElements.define('fs-propose', Propose)
customElements.define('fs-recipes', Recipes)
customElements.define('fs-recipe', Recipe)
customElements.define('fs-lists', Lists)
customElements.define('fs-ingredients', Ingredients)
customElements.define('fs-categories', Categories)
customElements.define('fs-login', Login)
customElements.define('fs-loading-block', LoadingBlock)
customElements.define('fs-animated-section', AnimatedSection)
customElements.define('fs-dishes', Dishes)
customElements.define('fs-link', Link)

import Toast from './components/toast.js'
import Propose from './components/propose.js'
import { Utils } from './classes/utils.js'
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
import { Websocket } from './classes/websocket.js'
import Menu from './components/menu.js'

class App {
	// TODO images pour la page de home
	// TODO size dans recette (transformer size avec une unité)
	// TODO Liste de ce qui est présent dans le congelé
	// TODO Choix pour activer les fonctionnalités
	// TODO permettre qu'il existe plusieurs sessions différentes pour que plusieurs personnes puissent l'utiliser sans être sur le même compte
	// TODO permettre de rendre payant
	// TODO minifier et combiner les fichiers js clients dans app.js
	// TODO repasser sur les var && et remplacer par var?. si possible
	// TODO Si possible de plus minifier
	// TODO récupérer les fonts dans les sources
	// TODO revoir la conf qua pour faire en sorte de modifier aussi l'appel vers le min.js dans page.html
	// TODO bug car quand recherche un ingredient alors que recherche si suppr rest de la liste
	// TODO bug dishes lors ajourt recette -> fait mais peut potentiellement etre lent voir si améliorable avec websocket le mettre partout le websocket
	// TODO Mise en place de test auto ?
	// TODO home à passer sur mobile
	// TODO ne pas tester l'auth à chaque connection !!! -> Possible que le problème soit réglé
	// TODO revoir erreur sur map sur recipe à test
	// TODO essayer de tester les méthodes privés
	// TODO Documenter les fonctions !!!

	constructor () {
		Utils.helpers()
		this.wakeLock()
		Websocket.init()
		if (location.href.charAt(location.href.length - 1) === '/') history.replaceState({}, '', location.href.replace(/\/$/, ''))
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
customElements.define('fs-menu', Menu)

import '@picocss/pico'
import '../styles/main.css'
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
import Register from './components/register.js'
import LoggedUser from './components/loggedUser.js'
import ResetPassword from './components/resetPassword.js'

class App {
    // TODO images pour la page de home
    // TODO Liste de ce qui est présent dans le congelé
    // TODO Choix pour activer les fonctionnalités
    // TODO permettre qu'il existe plusieurs sessions différentes pour que plusieurs personnes puissent l'utiliser sans être sur le même compte
    // TODO permettre de rendre payant
    // TODO minifier et combiner les fichiers js clients dans app.js
    // TODO Si possible de plus minifier
    // TODO revoir la conf qua pour faire en sorte de modifier aussi l'appel vers le min.js dans page.html
    // TODO Mise en place de test auto ?
    // TODO home à passer sur mobile
    // TODO ne pas tester l'auth à chaque connection !!! -> Possible que le problème soit réglé
    // TODO Documenter les fonctions !!!
    // TODO repasser sur les recettes
    // TODO améliorer les focus sur les input et voir si possible de trouver mieux pour le mobile après utilisation
    // TODO erreur sur le tableau dishes si texte trop long
    // TODO gérer le tab pour passer d'un input à l'autre sur size unit ...

    constructor() {
        Utils.helpers()
        // TODO à remettre ?
        // this.wakeLock()
        Websocket.init()
        if (location.href.charAt(location.href.length - 1) === '/') history.replaceState({}, '', location.href.replace(/\/$/, ''))
    }

    async wakeLock(): Promise<void> {
        let wakeLock: WakeLockSentinel | null = null
        const requestWakeLock = async (): Promise<void> => {
            try {
                wakeLock = await navigator.wakeLock.request()
            } catch (e) {
                if (e instanceof Error) {
                    console.error(`${e.name}, ${e.message}`)
                }
            }
        }
        document.addEventListener('visibilitychange', async (): Promise<void> => {
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
customElements.define('fs-signup', Register)
customElements.define('fs-loading-block', LoadingBlock)
customElements.define('fs-animated-section', AnimatedSection)
customElements.define('fs-dishes', Dishes)
customElements.define('fs-link', Link)
customElements.define('fs-menu', Menu)
customElements.define('fs-logged-user', LoggedUser)
customElements.define('fs-reset-password', ResetPassword)

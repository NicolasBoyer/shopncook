import { html, render } from 'lit'
import { User } from '../classes/user.js'
import { TUser } from '../types.js'
import { Utils } from '../classes/utils.js'
import { Caches } from '../classes/caches.js'

export default class LoggedUser extends HTMLElement {
    private currentUser: TUser | null = null

    async connectedCallback(): Promise<void> {
        this.currentUser = await User.getCurrentUser()
        this.render()
        // const image = this.querySelector('img') as HTMLImageElement
        // image.style.transform = `translate3d(0, ${window.scrollY}px, 0)`
        // window.addEventListener('scroll', (): void => {
        //     image.style.transform = `translate3d(0, ${window.scrollY * 0.5}px, 0)`
        //     if (window.scrollY >= this.getBoundingClientRect().height) this.firstElementChild?.classList.add('titles')
        //     else this.firstElementChild?.classList.remove('titles')
        // })
    }

    private render(): void {
        render(
            this.currentUser
                ? html`<button><span>${this.currentUser.firstName} ${this.currentUser.lastName}</span></button>
                      <div class="menu">
                          <a
                              @click="${async (pEvent: PointerEvent): Promise<void> => {
                                  // TODO à mettre dans une fonction user
                                  pEvent.preventDefault()
                                  await Caches.clear()
                                  await Utils.request('/logout', 'POST')
                                  location.reload()
                              }}"
                              href="#"
                              ><span>Se déconnecter</span></a
                          >
                      </div>`
                : html`<button>
                      <span>Se connecter</span>
                  </button>`,
            this
        )
    }
}

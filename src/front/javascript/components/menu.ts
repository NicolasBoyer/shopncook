import { html, render, TemplateResult } from 'lit'
import { TRoute } from '../types.js'
import { Caches } from '../classes/caches.js'
import { Utils } from '../classes/utils.js'

export default class Menu extends HTMLElement {
    private links: TRoute[] = []
    private isBurger: boolean = false
    private isHidden: boolean = false

    constructor() {
        super()
        this.style.display = 'none'
    }

    connectedCallback(): void {
        document.body.addEventListener('currentUserAvailable', async (): Promise<void> => {
            this.links = ((await Caches.get('routes')) || (await Utils.request('/routes.json'))) as TRoute[] & { error: string }
            if (!this.links || (this.links as unknown as { error: string }).error) return
            await Caches.set(false, 'routes', this.links)
            this.removeAttribute('style')
            this.displayMenu()
            window.addEventListener('resize', (): void => this.displayMenu())
            window.addEventListener('popstate', (): void => this.render())
        })
    }

    private displayMenu(): void {
        this.isBurger = window.innerWidth <= 1100
        this.isHidden = window.innerWidth <= 1100
        if (this.isBurger) this.setAttribute('data-burger', '')
        else this.removeAttribute('data-burger')
        this.render()
    }

    private render(): void {
        render(
            html`
                ${this.isBurger
                    ? html`
                          <button
                              class="burger"
                              @click="${(): void => {
                                  this.isHidden = false
                                  this.render()
                              }}"
                          >
                              <svg class="burger">
                                  <use href="#burger"></use>
                              </svg>
                              <span>Burger Menu</span>
                          </button>
                      `
                    : ''}
                <div data-hidden="${this.isHidden}">
                    ${this.isBurger
                        ? html`
                              <button
                                  class="back"
                                  @click="${(): void => {
                                      this.isHidden = true
                                      this.render()
                                  }}"
                              >
                                  <svg class="back">
                                      <use href="#back"></use>
                                      <span>Retour</span>
                                  </svg>
                              </button>
                          `
                        : ''}
                    <ul>
                        ${this.links.map(
                            (pLink): TemplateResult => html`
                                <li data-selected="${pLink.path === location.pathname}" @click="${(): void => this.displayMenu()}">
                                    <fs-link href="${pLink.path}" role="button">
                                        <span>${pLink.label}</span>
                                    </fs-link>
                                </li>
                            `
                        )}
                    </ul>
                </div>
            `,
            this
        )
    }
}

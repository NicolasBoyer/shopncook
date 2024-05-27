import { html, render } from 'lit'

export default class Header extends HTMLElement {
    constructor() {
        super()
        this.render()
    }

    get src(): string | null {
        return this.getAttribute('src')
    }

    get alt(): string | null {
        return this.getAttribute('alt')
    }

    connectedCallback(): void {
        const image = this.querySelector('img') as HTMLImageElement
        image.style.transform = `translate3d(0, ${window.scrollY}px, 0)`
        window.addEventListener('scroll', (): void => {
            image.style.transform = `translate3d(0, ${window.scrollY * 0.5}px, 0)`
            if (window.scrollY >= this.getBoundingClientRect().height) this.firstElementChild?.classList.add('titles')
            else this.firstElementChild?.classList.remove('titles')
        })
    }

    private render(): void {
        render(
            html`
                <div class="image">
                    <img alt="${this.alt}" src="${this.src}" />
                </div>
            `,
            this
        )
    }
}

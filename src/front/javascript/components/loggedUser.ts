import { html, render } from 'lit'

export default class LoggedUser extends HTMLElement {
    constructor() {
        super()
        this.render()
    }

    connectedCallback(): void {
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
            html`
                <button><span>Nicolas</span></button>
                <div class="menu">
                    <a href="#"><span>Se déconnecter</span></a>
                </div>
            `,
            this
        )
    }
}

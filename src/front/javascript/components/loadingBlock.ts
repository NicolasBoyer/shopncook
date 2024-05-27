import { Utils } from '../classes/utils.js'

export default class LoadingBlock extends HTMLElement {
    constructor() {
        super()
        this.style.visibility = 'hidden'
    }

    get loadingTimer(): number {
        return Number(this.getAttribute('loadingTimer'))
    }

    connectedCallback(): void {
        Utils.loader(true)
        setTimeout((): void => {
            Utils.loader(false)
            this.style.visibility = 'visible'
        }, this.loadingTimer)
    }

    // private render(): void {
    //     // TODO vérifier que le slot fonctionne bien
    //     render(html` <slot></slot> `, this)
    // }
}

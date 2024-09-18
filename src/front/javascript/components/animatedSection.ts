import { html, render } from 'lit'

type TAnimations = Record<string, { element: HTMLElement; lowValue: number; highValue: number; animations: string }[]>

export default class AnimatedSection extends HTMLElement {
    private animations!: TAnimations

    get height(): string | null {
        return this.getAttribute('height')
    }

    connectedCallback(): void {
        this.style.cssText = `height: ${this.height || 8000}px; position: relative;display: block;`
        this.animations = Array.from(this.querySelectorAll('*')).reduce((pGroup: TAnimations, pChild): TAnimations => {
            const name = `${pChild.tagName}.${pChild.className}`
            Array.from(pChild.attributes).forEach((pAttribute): void => {
                if (pAttribute.name.includes('data')) {
                    if (!pGroup[name]) pGroup[name] = []
                    const values = pAttribute.name.split('-')
                    pGroup[name].push({ element: pChild as HTMLElement, lowValue: Number(values[1]), highValue: Number(values[2]), animations: pAttribute.value })
                }
            })
            return pGroup
        }, {})
        const children = Array.from(this.children)
        this.render()
        this.querySelector('slot')?.replaceWith(...children)
        document.body.addEventListener('scroll', (): void => this.scrollListener())
        this.scrollListener()
    }

    private scrollListener(): void {
        const containerRect = document.body.getBoundingClientRect()
        const selfRect = this.getBoundingClientRect()
        if (containerRect.height < selfRect.height) {
            const offTop = containerRect.y - selfRect.y
            const viewHeight = selfRect.height - containerRect.height
            const proportion = offTop / viewHeight
            this.setAnimations(proportion)
        }
    }

    private setAnimations(proportion: number): void {
        Object.values(this.animations).forEach((pAnimations): void => {
            for (const animation of pAnimations) {
                if ((proportion >= animation.lowValue && proportion < animation.highValue) || (animation.lowValue === 0 && proportion < animation.lowValue)) {
                    animation.element.setAttribute('style', animation.animations.replaceAll('§§proportion§§', `${proportion}`))
                }
            }
        })
    }

    private render(): void {
        render(
            html`
                <div style="height: ${window.innerHeight}px; position: sticky; top: 0;">
                    <slot></slot>
                </div>
            `,
            this
        )
    }
}

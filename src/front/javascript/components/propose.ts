import { html, render, TemplateResult } from 'lit'

export default class Propose extends HTMLElement {
    private input: HTMLInputElement | null = null

    static get observedAttributes(): [string] {
        return ['list']
    }

    get list(): string | null {
        return this.getAttribute('list')
    }

    set list(pValue: string | null) {
        this.setAttribute('list', <string>pValue)
    }

    connectedCallback(): void {
        this.input = <HTMLInputElement>this.closest('div')?.querySelector('input')
        this.render()
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        if (name === 'list' && oldValue !== newValue) this.render()
    }

    private resetList(pText: string): void {
        const input = <HTMLInputElement>this.input
        if (pText) input.value = pText
        input.focus()
        this.dispatchEvent(new CustomEvent('listReset'))
    }

    private render(): void {
        const list = this.list?.split(',').filter((pEntry: string): string => pEntry)
        render(
            list?.length
                ? html`
                      <div class="propose">
                          ${list.map(
                              (pText: string): TemplateResult => html`
                                  <a
                                      href="#"
                                      @click="${(pEvent: PointerEvent): void => {
                                          pEvent.preventDefault()
                                          this.resetList(pText)
                                      }}"
                                      @keyup="${(pEvent: Event): void => {
                                          const keyboardEvent = <KeyboardEvent>pEvent
                                          const link = <HTMLElement>pEvent.target
                                          if (keyboardEvent.key === 'ArrowDown' && link.nextElementSibling) (<HTMLElement>link.nextElementSibling).focus()
                                          if (keyboardEvent.key === 'ArrowUp' && link.previousElementSibling) (<HTMLElement>link.nextElementSibling).focus()
                                          if (keyboardEvent.key === 'Enter') this.resetList(pText)
                                      }}"
                                      >${pText}</a
                                  >
                              `
                          )}
                      </div>
                  `
                : html``,
            this
        )
    }
}

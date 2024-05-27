export class Dom {
    private static currentElement: HTMLElement | SVGElement

    static newDom(element: HTMLElement): typeof Dom {
        return this.setCurrent(element)
    }

    static setCurrent(element: HTMLElement): typeof Dom {
        this.currentElement = element
        return this
    }

    static elt(name: string, classes = ''): typeof Dom {
        const element = document.createElement(name)
        if (classes) element.className = classes
        this.currentElement.appendChild(element)
        this.currentElement = element
        return this
    }

    static svg(name: string): typeof Dom {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        svg.classList.add(name)
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use')
        svg.appendChild(use)
        use.setAttribute('href', `#${name}`)
        this.currentElement.appendChild(svg)
        this.currentElement = svg
        return this
    }

    static att(name: string, value: string): typeof Dom {
        if (value !== null) this.currentElement.setAttribute(name, value)
        return this
    }

    static text(text: string): typeof Dom {
        if (text !== null) this.currentElement.appendChild(document.createTextNode(text))
        return this
    }

    static listen(eventName: string, listener: EventListenerOrEventListenerObject): typeof Dom {
        this.currentElement.addEventListener(eventName, listener, false)
        return this
    }

    static up(): typeof Dom {
        this.currentElement = this.currentElement.parentNode as HTMLElement
        if (!this.currentElement) this.currentElement = document.body
        return this
    }

    static clear(): typeof Dom {
        this.currentElement.innerHTML = ''
        return this
    }

    static current(): HTMLElement {
        return this.currentElement as HTMLElement
    }

    static remove(): void {
        this.currentElement.remove()
    }
}

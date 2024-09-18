type TCommands = {
    help: string
    exit: string
    report: string
    commands: string
    clear: string
}

enum TWindowSize {
    max,
    min,
    re,
}

class error404 {
    private BLACKLISTED_KEY = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Alt', 'CapsLock', 'Control', 'Shift', 'Tab', 'Escape', 'NumLock']
    private COMMANDS: TCommands = {
        help: 'La page que vous souhaitez visiter n\'existe pas, ou elle a peut-être été supprimée, ou une mauvaise adresse a été saisie. Pour voir les commandes, entrez le mot <span class="red"> commands</span>',
        exit: '',
        report: '<span class=\'green\'>\n' + 'Ce rapport de page a été envoyé avec succès au support.</span>',
        commands: 'Liste des commandes : <span class="red"> help</span>, <span class="red"> report</span>, <span class="red"> exit</span>, <span class="red"> clear</span>\n',
        clear: '',
    }
    private userInput = document.getElementById('userInput') as HTMLElement
    private terminalOutput = document.getElementById('code') as HTMLElement
    private terminal = document.getElementById('Terminal') as HTMLElement
    private keyboard = document.getElementById('Keyboard') as HTMLElement
    private str = ''

    constructor() {
        this.keyboard.focus()
        if (screen.width < 991) this.keyboard.addEventListener('keyup', (event: KeyboardEvent): void => this.evalKey(event))
        else document.addEventListener('keypress', (event: KeyboardEvent): void => this.evalKey(event))
        document.addEventListener('keydown', (event: KeyboardEvent): void => this.removeEntry(event))
        ;(document.getElementById('min') as HTMLElement).addEventListener('click', (event): void => this.interact(event, TWindowSize.min))
        ;(document.getElementById('max') as HTMLElement).addEventListener('click', (event): void => this.interact(event, TWindowSize.max))
        ;((document.getElementById('min_app') as HTMLElement).querySelector('a') as HTMLElement).addEventListener('click', (event): void => this.interact(event, TWindowSize.re))
    }

    private interact(event: MouseEvent, windowSize: TWindowSize): void {
        event.preventDefault()
        switch (windowSize) {
            case TWindowSize.max:
                document.body.className = document.body.className !== 'max' ? 'max' : ''
                break
            case TWindowSize.min:
                document.body.className = document.body.className === 'max' ? 'max min' : 'min'
                break
            case TWindowSize.re:
                document.body.className = document.body.className === 'max min' ? 'max' : ''
                break
        }
    }

    private execute(input: string): void {
        let output
        if (input.length === 0) {
            return
        }
        if (!Object.keys(this.COMMANDS).includes(input)) {
            output = '<p>La commande saisie n\'est pas correcte</p>'
        } else if (input === 'clear') {
            this.terminalOutput.innerHTML = ''
            return
        } else if (input === 'close' || input === 'exit') {
            location.href = '/'
            return
        } else if (input === 'report') {
            // window.open('mailto:test@example.com?subject=subject&body=body')
            this.terminalOutput.innerHTML = `${this.terminalOutput.innerHTML}<p>${this.COMMANDS[input]}</p>`
            return
        } else {
            output = this.COMMANDS[input as keyof TCommands]
        }
        this.terminalOutput.innerHTML = `${this.terminalOutput.innerHTML}<p class="out_code">${output}</p>`
        this.terminal.scrollTop = this.terminalOutput.scrollHeight
    }

    private evalKey(event: KeyboardEvent): void {
        let currentKey = event.key
        this.keyboard.focus()
        this.keyboard.innerHTML = (event.target as HTMLInputElement).value
        if (this.BLACKLISTED_KEY.includes(currentKey)) {
            return
        }
        if (!currentKey || currentKey === 'Unidentified' || screen.width < 991) {
            currentKey = (event.target as HTMLInputElement).value
        }
        if (event.key === 'Enter') {
            this.execute(this.userInput.innerHTML)
            this.userInput.innerHTML = ''
            ;(event.target as HTMLInputElement).value = ''
            this.str = ''
        } else {
            if (screen.width < 991) this.str = currentKey
            else this.str += currentKey
            event.preventDefault()
            this.userInput.innerHTML = this.str
        }
    }

    private removeEntry(event: KeyboardEvent): void {
        if (event.code === 'Backspace') {
            this.userInput.innerHTML = this.userInput.innerHTML.slice(0, this.userInput.innerHTML.length - 1)
            this.str = this.str.slice(0, this.str.length - 1)
        }
    }
}

new error404()

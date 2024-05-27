import fs from 'fs/promises'

const fromSrc = (pFile: string): string => `src/${pFile}`
const fromTemplate = (pFile: string): string => fromSrc(`front/html/templates/${pFile}`)
const fromFragments = (pFile: string): string => fromSrc(`front/html/fragments/${pFile}`)
const replaceTagAndGetHtml = (pFileContents: string, pTag: string, pReplace: string): string => {
    let html = ''
    pFileContents.split(/\r?\n/).forEach((pLine): string => (html += pLine.trim()))
    return html.replace(pTag, pReplace)
}
const salt = 'XSzAx9x4qn9BFZGk'

export class Utils {
    static fromFront(pFile: string): string {
        return fromSrc(`front${pFile}`)
    }

    static async page(pFile: string, pClassName: string, pTitle = '', pTemplateHtml = 'page.html'): Promise<string> {
        const fragment = await fs.readFile(fromFragments(pFile), 'utf8')
        let template = await fs.readFile(fromTemplate(pTemplateHtml), 'utf8')
        template = replaceTagAndGetHtml(template, '§§title§§', `<div class='subtitle' data-replaced-title>${pTitle}</div>`)
        template = replaceTagAndGetHtml(template, '§§className§§', pClassName)
        if (process.env.NODE_ENV === 'dev') {
            template = replaceTagAndGetHtml(
                template,
                '§§scripts§§',
                `
<script crossorigin='anonymous' defer='defer' src='http://localhost:5173/src/front/javascript/app.ts' type='module'></script>
<script>
	document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')
</script>
`
            )
        } else template = replaceTagAndGetHtml(template, '§§scripts§§', '<script crossorigin="anonymous" defer="defer" src="/dist/app.min.js" type="module"></script>')
        return replaceTagAndGetHtml(template, '§§content§§', fragment)
    }

    static async fragment(pFile: string): Promise<string> {
        return await fs.readFile(fromFragments(pFile), 'utf8')
    }

    static slugify(pStr: string): string {
        const a = 'ãàáäâèéëêìíïîòóöôùúüûñçßÿœæŕśńṕẃǵǹḿǘẍźḧ·/-,:;'
        const b = 'aaaaaeeeeiiiioooouuuuncsyoarsnpwgnmuxzh______'
        const p = new RegExp(a.split('').join('|'), 'g')

        return (
            pStr
                .toString()
                .toLowerCase()
                .replace(/\s+/g, '_') // Replace spaces with _
                .replace(p, (c): string => b.charAt(a.indexOf(c))) // Replace special chars
                .replace(/&/g, '_and_') // Replace & with 'and'
                // eslint-disable-next-line no-useless-escape
                .replace(/[^\w\-]+/g, '') // Remove all non-word chars
                // eslint-disable-next-line no-useless-escape
                .replace(/--+/g, '_') // Replace multiple - with single _
                .replace(/^-+/, '') // Trim - from start of text
                .replace(/-+$/, '')
        ) // Trim - from end of text
    }

    static crypt(text: string): string {
        const textToChars = (text: string): number[] => text.split('').map((c): number => c.charCodeAt(0))
        const byteHex = (n: number): string => ('0' + Number(n).toString(16)).substr(-2)
        const applySaltToChar = (code: number[]): number => textToChars(salt).reduce((a: number, b: number): number => a ^ b, code[0])
        return text.split('').map(textToChars).map(applySaltToChar).map(byteHex).join('')
    }

    static decrypt(encoded: string): string | undefined {
        const textToChars = (text: string): number[] => text.split('').map((c): number => c.charCodeAt(0))
        const applySaltToChar = (code: number): number => textToChars(salt).reduce((a, b): number => a ^ b, code)
        return encoded
            .match(/.{1,2}/g)
            ?.map((hex): number => parseInt(hex, 16))
            .map(applySaltToChar)
            .map((charCode): string => String.fromCharCode(charCode))
            .join('')
    }
}

import fs from 'fs/promises'

const fromSrc = (pFile: string): string => `src/${pFile}`
const fromTemplate = (pFile: string): string => fromSrc(`front/html/templates/${pFile}`)
const fromFragments = (pFile: string): string => fromSrc(`front/html/fragments/${pFile}`)
const replaceTagAndGetHtml = (pFileContents: string, pTag: string, pReplace: string): string => {
    let html = ''
    pFileContents.split(/\r?\n/).forEach((pLine): string => (html += pLine.trim()))
    return html.replace(pTag, pReplace)
}

export class Utils {
    static fromFront(pFile: string): string {
        return fromSrc(`front${pFile}`)
    }

    static async page(options: { file?: string; className: string; title?: string; templateHtml?: string }): Promise<string> {
        const fragment = options.file && (await fs.readFile(fromFragments(options.file), 'utf8'))
        let template = await fs.readFile(fromTemplate(options.templateHtml || 'page.html'), 'utf8')
        if (options.title) template = replaceTagAndGetHtml(template, '§§title§§', `<div class='subtitle' data-replaced-title>${options.title}</div>`)
        if (options.className) template = replaceTagAndGetHtml(template, '§§className§§', options.className)
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
        return fragment ? replaceTagAndGetHtml(template, '§§content§§', fragment) : template
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

                .replace(/--+/g, '_') // Replace multiple - with single _
                .replace(/^-+/, '') // Trim - from start of text
                .replace(/-+$/, '')
        ) // Trim - from end of text
    }
}

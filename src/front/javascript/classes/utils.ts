import { html, render, TemplateResult } from 'lit'
import { Dom } from './dom.js'
import { Caches } from './caches.js'

export class Utils {
    static helpers({ confirmMessage = '', cbConfirm = null, cbCancel = null, isConfirmInit = true, loaderVisible = false }: Record<string, (() => void) | TemplateResult | string | boolean | null> = {}): void {
        const confirm = cbConfirm as () => void
        const cancel = cbCancel as () => void
        render(
            html`
                <fs-loader ?visible="${loaderVisible}"></fs-loader>
                <fs-confirm .message="${confirmMessage}" ?open="${isConfirmInit ? !isConfirmInit : Math.random()}" @modalConfirm="${(): void => confirm()}" @modalCancel="${(): void => cancel()}"></fs-confirm>
            `,
            document.body
        )
    }

    static loader(visible: boolean): void {
        this.helpers({ loaderVisible: visible })
    }

    static confirm(message: string | TemplateResult, cbConfirm: () => void, cbCancel: (() => void) | null = null): void {
        this.helpers({ confirmMessage: message, cbConfirm, cbCancel, isConfirmInit: false })
    }

    static toast(type: string, message: string): void {
        const bd = Dom.newDom(document.body)
        bd.elt('fs-toast').att('type', type).att('message', message)
    }

    static async request(pUrl: string, pMethod = 'GET', pOptions: Record<string, unknown> | null = {}, pReturnType = ''): Promise<string | number | Blob | Response | Record<string, unknown> | Record<string, unknown>[] | undefined> {
        const response = await fetch(pUrl, { ...{ method: pMethod }, ...pOptions })
        if (pReturnType === 'status' && pMethod === 'HEAD') return response.status
        if (response.status !== 200 && response.status !== 204) {
            // eslint-disable-next-line no-console
            console.error('Request failed : ' + response.status)
            // eslint-disable-next-line no-console
            console.log(response)
        } else {
            switch (pReturnType) {
                case 'blob':
                    return response.blob()
                case 'text':
                    return response.text()
                case 'response':
                    return response
                default:
                    return response.json()
            }
        }
    }

    static async getFragmentHtml(pUrl: string): Promise<Record<string, string>> {
        const fragment = <Record<string, string>>((await Caches.get(pUrl)) || (await Utils.request(pUrl, 'POST')))
        Caches.set(false, pUrl, fragment)
        return fragment
    }

    static generateId(): number {
        return new Date().getTime()
    }

    static getMousePosition(): { x: number; y: number } {
        return { x: mouseX, y: mouseY }
    }

    static async getBase64FromFileReader(pFile: Blob): Promise<string | ArrayBuffer | null> {
        return new Promise((resolve, reject): void => {
            const reader = new FileReader()
            reader.addEventListener('load', (): void => resolve(reader.result))
            reader.addEventListener('error', (): ((reason?: unknown) => void) => reject)
            reader.readAsDataURL(pFile)
        })
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

    static urlToBase64(pUrl: string): Promise<string | ArrayBuffer | null> {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve): Promise<void> => {
            const reader = new FileReader()
            reader.onload = (): void => resolve(reader.result)
            reader.readAsDataURL(<Blob>await this.request(pUrl, 'GET', null, 'blob'))
        })
    }

    static async uploadFileAndGetUrl(pFile: Blob, pName: string | null = null): Promise<string> {
        const formData = new FormData()
        formData.append('file', pFile)
        if (pName) formData.append('public_id', pName)
        formData.append('upload_preset', 'sheetrpg')
        return ((await Utils.request('https://api.cloudinary.com/v1_1/elendil/upload', 'POST', { body: formData })) as Record<string, unknown>)?.secure_url as string
    }

    static isValidHttpUrl(pStr: string): boolean {
        const pattern = new RegExp(
            '^(https?:\\/\\/)?' + // protocol
                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
                '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
                '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
                '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
                '(\\#[-a-z\\d_]*)?$', // fragment locator
            'i'
        )
        return pattern.test(pStr)
    }
}

let mouseX = 0
let mouseY = 0
document.body.addEventListener('pointermove', (pEvent): void => {
    mouseX = pEvent.pageX + window.scrollX
    mouseY = pEvent.pageY + window.scrollY
})

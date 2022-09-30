import fs from 'fs/promises'

const fromSrc = (pFile) => `src/${pFile}`
const fromTemplate = (pFile) => fromSrc(`front/html/templates/${pFile}`)
const fromFragments = (pFile) => fromSrc(`front/html/fragments/${pFile}`)
const replaceTagAndGetHtml = (pFileContents, pTag, pReplace) => {
	let html = ''
	pFileContents.split(/\r?\n/).forEach((pLine) => (html += pLine.trim()))
	return html.replace(pTag, pReplace)
}
const salt = 'XSzAx9x4qn9BFZGk'

export class Utils {
	static fromFront (pFile) {
		return fromSrc(`front${pFile}`)
	}

	static async page (pFile, pClassName, pTitle = '', pTemplateHtml = 'page.html') {
		const fragment = await fs.readFile(fromFragments(pFile), 'utf8')
		let template = await fs.readFile(fromTemplate(pTemplateHtml), 'utf8')
		template = replaceTagAndGetHtml(template, '§§title§§', `<div class="subtitle" data-replaced-title>${pTitle}</div>`)
		template = replaceTagAndGetHtml(template, '§§className§§', pClassName)
		return replaceTagAndGetHtml(template, '§§content§§', fragment)
	}

	static async fragment (pFile) {
		return await fs.readFile(fromFragments(pFile), 'utf8')
	}

	static slugify (pStr) {
		const a = 'ãàáäâèéëêìíïîòóöôùúüûñçßÿœæŕśńṕẃǵǹḿǘẍźḧ·/-,:;'
		const b = 'aaaaaeeeeiiiioooouuuuncsyoarsnpwgnmuxzh______'
		const p = new RegExp(a.split('').join('|'), 'g')

		return pStr.toString().toLowerCase()
			.replace(/\s+/g, '_') // Replace spaces with _
			.replace(p, (c) => b.charAt(a.indexOf(c))) // Replace special chars
			.replace(/&/g, '_and_') // Replace & with 'and'
			// eslint-disable-next-line no-useless-escape
			.replace(/[^\w\-]+/g, '') // Remove all non-word chars
			// eslint-disable-next-line no-useless-escape
			.replace(/--+/g, '_') // Replace multiple - with single _
			.replace(/^-+/, '') // Trim - from start of text
			.replace(/-+$/, '') // Trim - from end of text
	}

	static crypt (text) {
		const textToChars = (text) => text.split('').map((c) => c.charCodeAt(0))
		const byteHex = (n) => ('0' + Number(n).toString(16)).substr(-2)
		const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code)
		return text
			.split('')
			.map(textToChars)
			.map(applySaltToChar)
			.map(byteHex)
			.join('')
	}

	static decrypt (encoded) {
		const textToChars = (text) => text.split('').map((c) => c.charCodeAt(0))
		const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code)
		return encoded?.match(/.{1,2}/g)
			.map((hex) => parseInt(hex, 16))
			.map(applySaltToChar)
			.map((charCode) => String.fromCharCode(charCode))
			.join('')
	}
}

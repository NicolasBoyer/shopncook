import fs from 'fs/promises'
import mkdirp from 'mkdirp'

const fromSrc = (pFile) => `src/${pFile}`
const fromTemplate = (pFile) => fromSrc(`front/html/templates/${pFile}`)
const fromFragments = (pFile) => fromSrc(`front/html/fragments/${pFile}`)
const replaceTagAndGetHtml = (pFileContents, pTag, pReplace) => {
	let html = ''
	pFileContents.split(/\r?\n/).forEach((pLine) => (html += pLine.trim()))
	return html.replace(pTag, pReplace)
}

export class Utils {
	static fromFront (pFile) {
		return fromSrc(`front${pFile}`)
	}

	static async readFileFromBack (pFile) {
		return await fs.readFile(fromSrc(`back${pFile}`), 'utf8')
	}

	static async createFileFromBack (pFile, pInitText) {
		// eslint-disable-next-line no-undef
		const file = `${process.cwd()}/${fromSrc(`back${pFile}`)}`
		try {
			await mkdirp(file)
			await fs.writeFile(file, pInitText, { flag: 'wx' })
		} catch (e) {
			console.log(e)
			console.log(`Le fichier ${file} a déjà été créé !`)
		}
	}

	static async saveDB (db, json) {
		return await fs.writeFile(fromSrc(`back/datas/${json}`), JSON.stringify(db, null, 2))
	}

	static async fragments (pFile, pClassName, pSubTitle = '') {
		const fragment = await fs.readFile(fromFragments(pFile), 'utf8')
		let template = await fs.readFile(fromTemplate('page.html'), 'utf8')
		template = replaceTagAndGetHtml(template, '§§title§§', `<div class="subtitle">${pSubTitle}</div>`)
		template = replaceTagAndGetHtml(template, '§§className§§', pClassName)
		return replaceTagAndGetHtml(template, '§§content§§', fragment)
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
}

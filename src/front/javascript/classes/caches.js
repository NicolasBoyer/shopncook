export class Caches {
	static set (...args) {
		for (let i = 0; i < args.length; i++) {
			if (i % 2 === 0) sessionStorage.setItem(args[i], JSON.stringify(args[i + 1]))
		}
	}

	static get (...args) {
		let datas = []
		args.forEach((pArg) => datas.push(JSON.parse(sessionStorage.getItem(pArg))))
		datas = datas.filter((pEntry) => pEntry)
		return datas.length === 1 && datas.length === args.length ? datas[0] : datas.length && datas.length === args.length ? datas : null
	}
}

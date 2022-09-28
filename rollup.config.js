import { terser } from 'rollup-plugin-terser'

export default {
	input: 'src/front/javascript/app.js',
	output: {
		file: 'src/front/dist/app.min.js',
		plugins: [terser()],
		format: 'es'
	}
}

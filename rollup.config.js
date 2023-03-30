import terser from '@rollup/plugin-terser'
import babel from '@rollup/plugin-babel'

export default {
	input: 'src/front/javascript/app.js',
	output: {
		file: 'src/front/dist/app.min.js',
		plugins: [terser()],
		format: 'es'
	},
	plugins: [babel({
		babelHelpers: 'bundled'
	})]
}

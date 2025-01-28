import { defineConfig } from 'vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default defineConfig({
	plugins: [
        cssInjectedByJsPlugin(),
    ],
    build: {
        outDir: 'src/front/dist',
        sourcemap: true,
        target: 'es2022',
        rollupOptions: {
            input: 'src/front/javascript/app.ts',
            output: {
                entryFileNames: 'app.min.js'
            }
        }
    }
})

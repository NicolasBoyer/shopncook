import { defineConfig } from 'vite'

export default defineConfig({
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

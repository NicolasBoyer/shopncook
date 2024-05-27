import { Server } from './server.js'
import Routes from './routes.js'
import livereload from 'livereload'

new Routes(new Server())
console.log('Server is running on http://localhost:8000')

const hrServer = livereload.createServer({ exts: ['html', 'css', 'js', 'png', 'gif', 'jpg', 'php', 'ts'] })
hrServer.watch('./src')

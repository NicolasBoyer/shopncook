import { Server } from './server.js'
import Routes from './routes.js'

new Routes(new Server())
console.log('Server is running on http://localhost:8000')

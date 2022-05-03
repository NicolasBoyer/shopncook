import { Server } from './server.js'
import Routes from './routes.js'

new Routes(new Server(8888, 'foodshop.netlify.app'))

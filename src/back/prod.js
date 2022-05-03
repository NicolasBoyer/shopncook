import { Server } from './server.js'
import Routes from './routes.js'

new Routes(new Server(9000, 'foodshop-nib.heroku.com'))

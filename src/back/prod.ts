import { Server } from './server.js'
import Routes from './routes.js'
import { PORT } from './config.js'

new Routes(new Server(PORT as unknown as number))

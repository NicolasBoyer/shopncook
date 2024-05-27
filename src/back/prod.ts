import { Server } from './server.js'
import Routes from './routes.js'

new Routes(new Server(process.env.PORT as unknown as number))

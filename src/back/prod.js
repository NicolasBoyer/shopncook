import { Server } from './server.js'
import Routes from './routes.js'

// eslint-disable-next-line no-undef
new Routes(new Server(process.env.PORT))

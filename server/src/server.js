/**
 * Copyright Serotonin Software 2019
 */
// const bodyParser = require('body-parser')
// const compression = require('compression')
const express = require('express')
const fs = require('fs')
// const helmet = require('helmet')
const http = require('http')
const https = require('https')
const morgan = require('morgan')
const path = require('path')
const RateLimit = require('express-rate-limit')
const rfs = require('rotating-file-stream')
const redirector = require('./redirector')
const stateRefresher = require('./stateRefresher')

module.exports = options => {
  const { db, logger } = options

  // Create and configure the server
  const app = express()

  options.state = {
    hostMap: {}
  }

  // Start jobs
  stateRefresher(options)

  // // Assume that we're behind a load balancer.
  // app.set('trust proxy', true)

  // app.use(helmet())
  // app.use(compression())

  // Rate limiting
  app.use('/api/', new RateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 requests per windowMs
    delayMs: 0 // disable delaying - full speed until the max limit is reached
  }))

  // Logging
  const logDirectory = path.join(__dirname, '../logs')
  // Ensure log directory exists
  fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)
  // Create a rotating write stream
  const accessLogStream = rfs('access.log', {
    interval: '1d', // rotate daily
    path: logDirectory
  })
  // Setup the logger
  app.use(morgan('combined', { stream: accessLogStream }))

  // Middleware to inject the log and state into the request object.
  app.use((req, res, next) => {
    req.logger = logger
    req.state = options.state
    next()
  })

  // Set the routes
  app.use('*', redirector)
  app.use(express.static('static'))
  app.get('*', (req, res, next) => {
    // Route requests for specific URLs to the index.html file if they were requested
    // as text/html. This allows for initial requests for URLs like '/about' and '/register'
    // to make it to the client. Otherwise they would be 404s.
    if (req.headers.accept && req.headers.accept.indexOf('text/html') > -1) {
      // Path names have to be absolute.
      res.sendFile(path.join(__dirname, '..', 'static', 'index.html'))
    } else {
      next()
    }
  })
  app.use((req, res) => res.status(404).send('Not found'))

  // Start HTTP the listener
  const httpServer = http.createServer(app)
  const port = process.env.PORT || 3000
  httpServer.listen(port, () => {
    // Confirm that the server started ok
    logger.info(`Redirectr HTTP server started on: ${port}`)
  })

  // Certificates
  try {
    const credentials = {
      key: fs.readFileSync('certs/privkey.pem', 'utf8'),
      cert: fs.readFileSync('certs/cert.pem', 'utf8'),
      ca: fs.readFileSync('certs/chain.pem', 'utf8')
    }

    const httpsServer = https.createServer(credentials, app)
    const sslPort = process.env.SSL_PORT || 3443
    httpsServer.listen(sslPort, () => {
      logger.info(`Redirectr HTTPS server started on: ${sslPort}`)
    })
  } catch (err) {
    logger.info('Redirectr HTTPS server not started')
  }
}

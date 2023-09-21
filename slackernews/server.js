const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  // generate a random token that we will use to
  // handle metrics requests
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  process.env['METRICS_TOKEN'] = token;

  createServer(async (req, res) => {
    try {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true)
      const { pathname, query } = parsedUrl

      if (pathname === '/a') {
        await app.render(req, res, '/a', query)
      } else if (pathname === '/b') {
        await app.render(req, res, '/b', query)
      } else {
        await handle(req, res, parsedUrl)
      }
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
  .once('error', (err) => {
    console.error(err)
    process.exit(1)
  })
  .listen(port, () => {
    startMetricsLoop();
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})

async function startMetricsLoop() {
  // send every hour
  const interval = 60 * 60 * 1000;

  const requestMetrics = async function() {
    const res = await fetch(`http://${hostname}:${port}/api/metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env['METRICS_TOKEN'],
      },
      body: JSON.stringify({}),
    })

    if (!res.ok) {
      console.log('error sending metrics: ', res.statusText)
    }
  }

  // send metrics once on startup
  requestMetrics()

  // schedule weekly metrics payload

  setInterval( () => {
    requestMetrics()
  }, interval);
}

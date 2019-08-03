module.exports = (req, res, next) => {
  const { hostMap } = req.state

  // Get the host value, and remove the port if it's there.
  let host = req.headers.host
  const colon = host.indexOf(':')
  if (colon !== -1) {
    host = host.substring(0, colon)
  }

  console.log(process.env.THIS_HOST)

  // Lookup the host in the host map.
  const value = hostMap[host]
  if (value) {
    const { target, type, appendOriginalUrl } = value
    const fullTarget = target + (appendOriginalUrl ? req.originalUrl : '')

    if (type === '301' || type === '302') {
      // Response code redirect
      res.redirect(parseInt(type), fullTarget)
    } else {
      // Javascript location redirect
      res.send(`<script>location.href='${fullTarget}'</script>`)
    }
  } else {
    next()
  }
}


/**
 * Copyright Serotonin Software 2019
 */
module.exports = (req, res, next) => {
  const { hostMap } = req.state

  // Get the host value, and remove the port if it's there.
  let host = req.headers.host
  const colon = host.indexOf(':')
  if (colon !== -1) {
    host = host.substring(0, colon)
  }

  // Lookup the host in the host map.
  const value = hostMap[host]
  if (value) {
    const { target, type, appendOriginalUrl } = value
    let scheme = ''
    if (target.indexOf('://') === -1) {
      scheme = req.scheme + '://'
    }
    const fullTarget = scheme + target + (appendOriginalUrl ? req.originalUrl : '')

    if (type === '301' || type === '302') {
      // Response code redirect
      res.redirect(parseInt(type), fullTarget)
    } else {
      // Javascript location redirect
      res.send(`<script>location.href='${fullTarget}'</script>`)
    }

    // Write behind the current time to the table
    req.db.query(`UPDATE redirects SET last_hit = NOW() WHERE hostname = $1`, [host])
  } else {
    next()
  }
}


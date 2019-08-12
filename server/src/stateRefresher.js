/**
 * Copyright Serotonin Software 2019
 */
const dns = require('dns')
const { isArray } = require('lodash')

module.exports = async opts => {
  opts.logger.info('Starting state refresher')

  // First, load the state immediately
  await load(opts)

  // Then, refresh the state every 60 seconds (TODO configurable)
  setInterval(() => load(opts), 60000)
}

let lastLoadTime = new Date(0)

async function load(opts) {
  const { db, logger, state } = opts
  const { hostMap } = state

  // Timing
  const start = Date.now()

  const min = lastLoadTime
  lastLoadTime = (await db.query('SELECT NOW()')).rows[0].now
  const max = lastLoadTime

  logger.debug(`Deleting expired DNS verifications`)
  const delResult = await db.query(`DELETE FROM staged_redirects WHERE expiry < NOW()`)
  if (delResult.rowCount > 0) {
    logger.info(`Deleted ${delResult.rowCount} expired DNS verifications`)
  }

  logger.debug(`Testing all active DNS verifications`)
  db.query(`
    SELECT id, code, hostname, target_url, redirect_type, append_original_url
    FROM staged_redirects
    WHERE id IN (SELECT MIN(id) FROM staged_redirects GROUP BY hostname)
    LIMIT 50`,
    (err, rs) => {
      if (err) {
        logger.error(err)
      } else {
        rs.rows.forEach(row => doDNSVerification(opts, row))
      }
    })

  logger.debug(`Loading state since ${min} until ${max}`)
  const selResult = await db.query(`
    SELECT hostname, target_url, redirect_type, append_original_url, active
    FROM redirects
    WHERE modified > $1 AND modified <= $2`,
    [min, max])

  selResult.rows.forEach(row => {
    if (row.active) {
      logger.info(`Adding or updating redirect for ${row.hostname}`)
      hostMap[row.hostname] = {
        target: row.target_url,
        type: row.redirect_type,
        appendOriginalUrl: row.append_original_url
      }
    } else if (hostMap[row.hostname]) {
      logger.info(`Removing redirect for ${row.hostname}`)
      // If this is slow, use >= node 10. Fast for me, and faster than maps too.
      delete hostMap[row.hostname]
    }
  })

  logger.info(`stateRefresher runtime: ${Date.now() - start} ms`)
}

function doDNSVerification(opts, row) {
  const { db, logger } = opts
  const { append_original_url, code, hostname, id, redirect_type, target_url } = row

  logger.debug(`Doing DNS verification for ${hostname}`)
  dns.resolveTxt(`${hostname}`, async (err, result) => {
    if (err) {
      // We can ignore this. Errors are returned when entries are not found.
      logger.info(`DNS query returned an error for ${hostname}: `, err)
    } else if (isArray(result)) {
      let found = false
      result.forEach(e => {
        if (isArray(e)) {
          // This should always be the case. All entries of this array should be strings.
          result.forEach(ee => {
            if (ee.toString() === 'redirectr-' + code) {
              found = true
            }
          })
        } else {
          logger.warn(`Unexpected string entry:`, e)
        }
      })

      if (found) {
        logger.info(`DNS verified for ${hostname}`)

        // Upsert the redirect table
        await db.query(`
          INSERT INTO redirects (hostname, target_url, redirect_type, append_original_url)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (hostname) DO UPDATE SET target_url = $2, redirect_type = $3,
            append_original_url = $4, modified = NOW()`,
          [hostname, target_url, redirect_type, append_original_url])

        // Delete the from staged redirect table
        await db.query(`DELETE FROM staged_redirects WHERE id = $1`, [id])
      } else {
        logger.info(`DNS not verified for ${hostname}`)
      }
    } else {
      logger.warn(`Unhandled DNS query result:`, result)
    }
  })
}

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
  const delResult = await db.query(`
    DELETE FROM redirects WHERE redirect_id IN (
      SELECT redirect_id FROM dns_verifications WHERE expiry < NOW()
    )
  `)
  if (delResult.rowCount > 0) {
    logger.info(`Deleted ${delResult.rowCount} expired DNS verifications`)
  }

  logger.debug(`Loading state since ${min} until ${max}`)
  const selResult = await db.query(`
    SELECT r.redirect_id, r.hostname, r.target_url, r.redirect_type, r.append_original_url,
        r.active AS redirect_active,
      u.active AS user_active,
      d.code
    FROM redirects r
      JOIN users u ON r.user_id = u.user_id
      LEFT JOIN dns_verifications d ON r.redirect_id = d.redirect_id
    WHERE (u.modified > $1 AND u.modified <= $2)
      OR (r.modified > $1 AND r.modified <= $2)
      OR d.code IS NOT NULL
    `, [min, max])

  selResult.rows.forEach(row => {
    if (row.code) {
      // Do a DNS verification
      doDNSVerification(opts, row)
    } else if (row.user_active && row.redirect_active) {
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
  const { code, hostname, redirect_id } = row

  logger.debug(`Doing DNS verification for ${hostname}`)
  dns.resolveTxt(`_redirectr.${hostname}`, async (err, result) => {
    if (err) {
      // We can ignore this. Errors are returned when entries are not found.
      logger.info(`DNS query returned an error for ${hostname}`, err)
    } else if (isArray(result)) {
      let found = false
      result.forEach(e => {
        if (isArray(e)) {
          // This should always be the case. All entries of this array should be strings.
          result.forEach(ee => {
            if (ee.toString() === code) {
              found = true
            }
          })
        } else {
          logger.warn(`Unexpected string entry:`, e)
        }
      })

      if (found) {
        logger.info(`DNS verified for ${hostname}`)
        await db.query(`DELETE FROM dns_verifications WHERE redirect_id = $1`, [redirect_id])
        await db.query(`UPDATE redirects SET modified = NOW() WHERE redirect_id = $1`, [redirect_id])
      } else {
        logger.info(`DNS not verified for ${hostname}`)
      }
    } else {
      logger.warn(`Unhandled DNS query result:`, result)
    }
  })
}
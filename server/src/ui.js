/**
 * Copyright Serotonin Software 2019
 */
const express = require('express')
const { isBoolean, isString } = require('lodash')
const uuidv4 = require('uuid/v4')

const router = express.Router()

router.get('/redirects/:hostname', read)
router.post('/redirects/:hostname', create)

module.exports = router

async function read(req, res) {
  const { db, params } = req
  const { hostname } = params

  const redirPromise = db.query(`
    SELECT hostname, target_url, redirect_type, append_original_url, last_hit
    FROM redirects
    WHERE hostname = $1 AND active`,
    [hostname])

  const stagedPromise = await db.query(`
    SELECT COUNT(*) FROM staged_redirects WHERE hostname = $1 AND expiry >= NOW()`,
    [hostname])

  const rss = await Promise.all([redirPromise, stagedPromise])
  const result = {
    active: null,
    staged: parseInt(rss[1].rows[0].count)
  }
  if (rss[0].rows.length) {
    result.active = {
      hostname: rss[0].rows[0].hostname,
      targetUrl: rss[0].rows[0].target_url,
      redirectType: rss[0].rows[0].redirect_type,
      appendOriginalUrl: rss[0].rows[0].append_original_url,
      lastHit: rss[0].rows[0].last_hit
    }
  }

  res.json(result)
}

async function create(req, res) {
  const { body, db, params } = req
  const { hostname } = params
  const { appendOriginalUrl, redirectType, targetUrl } = body

  // Validate
  if (!isString(hostname) || !hostname.length) {
    return sendInputError(res, 'redirect-create-1', `Invalid 'hostname'`)
  }
  if (!isString(targetUrl) || !targetUrl.length) {
    return sendInputError(res, 'redirect-create-2', `Invalid 'targetUrl'`)
  }
  if (!isString(redirectType) || ['301', '302', 'location'].indexOf(redirectType) === -1) {
    return sendInputError(res, 'redirect-create-3', `Invalid 'redirectType'`)
  }
  if (!isBoolean(appendOriginalUrl)) {
    return sendInputError(res, 'redirect-create-4', `Invalid 'appendOriginalUrl'`)
  }

  const uuid = uuidv4()
  db.query(`
    INSERT INTO staged_redirects (code, hostname, target_url, redirect_type, append_original_url, expiry)
    VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '10 minutes')`,
    [uuid, hostname, targetUrl, redirectType, appendOriginalUrl])

  res.json({ uuid })
}

function sendInputError(res, code, message) {
  res.status(400).json({ error: { code, message } })
}

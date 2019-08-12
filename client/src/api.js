import axios from 'axios'
import { localUrl } from './util'

export function get(ep, params) {
  return rest(ep, 'get', params)
}

export function post(ep, data) {
  return rest(ep, 'post', null, data)
}

async function rest(ep, method, params, data, headers = {}) {
  try {
    const response = await axios({
      method,
      baseURL: process.env.VUE_APP_API_BASE || localUrl('/ui'),
      url: ep,
      params,
      data,
      headers,
      timeout: 30000,
      validateStatus: status => (status >= 200 && status < 300) || status === 400
    })
    return response.data
  } catch (err) {
    console.error('Error in response', err)
    // Rethrow the error so that "then"s for the the requestor are not run.
    throw err
  }
}

/**
 * This is needed for unit tests.
 */
export default {
  get,
  post,
}

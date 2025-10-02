/* Simple backend smoke tests */
const axios = require('axios')

const BASE = process.env.API_URL || 'http://localhost:5000/api'
const TOKEN = process.env.API_TOKEN || null

async function check(path, expect = 200) {
  try {
    const res = await axios.get(`${BASE}${path}`, TOKEN ? { headers: { Authorization: `Bearer ${TOKEN}` } } : undefined)
    const ok = res.status === expect
    console.log(`${ok ? 'OK' : 'FAIL'} GET ${path} -> ${res.status}`)
    return ok
  } catch (e) {
    const status = e.response?.status || 'ERR'
    const unauthOk = status === 401 || status === 403
    console.log(`${unauthOk ? 'OK ' : 'FAIL'} GET ${path} -> ${status}`)
    return unauthOk
  }
}

async function main() {
  const results = await Promise.all([
    check('/health'),
    check('/modules'),
    check('/adoption'),
    check('/ecommerce/products'),
    check('/pharmacy/medications'),
    check('/rescue'),
    check('/shelter'),
    check('/temporary-care'),
    check('/veterinary/clinics')
  ])
  const passed = results.filter(Boolean).length
  console.log(`\nSmoke summary: ${passed}/${results.length} passed`)
  process.exit(passed === results.length ? 0 : 1)
}

main()



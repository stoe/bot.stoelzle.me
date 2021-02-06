const {createNodeMiddleware, createProbot} = require('probot')

const app = require('../app')
const probot = createProbot()
const middleware = createNodeMiddleware(app, {probot})

/**
 * Redirect `GET /` to homepage, pass `POST /` to Probot's middleware
 *
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.redirect(301, 'https://stefan.stoelzle.me')
    return
  }

  middleware(req, res)
}

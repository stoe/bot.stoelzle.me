const {createNodeMiddleware, createProbot} = require('probot')

const app = require('./src/probot')
const probot = createProbot()
const middleware = createNodeMiddleware(app, {probot})

/**
 * Redirect `GET /` to homepage, pass `POST /` to Probot's middleware
 *
 * @param {import('@vercel/node').NowRequest} req
 * @param {import('@vercel/node').NowResponse} res
 */
module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.redirect(301, 'https://stefan.stoelzle.me')
    return
  }

  middleware(req, res)
}

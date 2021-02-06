const applyDefaultSettings = require('./settings')
const applyDefaultBranchSettings = require('./branch')

module.exports = app => {
  app.log(`bot.stoelzle.me 🤖 is alive`)

  app.on('repository.created', async context => {
    try {
      await applyDefaultSettings(context)
    } catch (error) {
      app.log(error)
    }
  })

  app.on('create', async context => {
    try {
      await applyDefaultBranchSettings(context)
    } catch (error) {
      app.log(error)
    }
  })
}

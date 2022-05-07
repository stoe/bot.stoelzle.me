const applyDefaultBranchSettings = require('./branch')
const applyDefaultSettings = require('./settings')
const applyDefaultLabels = require('./labels')
const enableAutoMerge = require('./pr')

module.exports = robot => {
  robot.log(`bot.stoelzle.me 🤖 is alive`)

  robot.on('repository.created', async context => {
    try {
      await applyDefaultSettings(context)
      await applyDefaultLabels(context)
    } catch (error) {
      robot.log(error)
    }
  })

  robot.on('create', async context => {
    try {
      await applyDefaultBranchSettings(context)
    } catch (error) {
      robot.log(error)
    }
  })

  robot.on('pull_request.review_requested', async context => {
    try {
      await enableAutoMerge(context)
    } catch (error) {
      robot.log(error)
    }
  })
}

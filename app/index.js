const applyDefaultBranchSettings = require('./branch')
const applyDefaultSettings = require('./settings')
const applyDefaultLabels = require('./labels')
const {autoMerge, autoApprove} = require('./pr')

module.exports = robot => {
  robot.log(`bot.stoelzle.me 🤖 is alive`)

  robot.on('repository.created', async context => {
    try {
      await applyDefaultSettings(context)
      await applyDefaultLabels(context)
    } catch (error) {
      robot.log.error(error.message)
    }
  })

  robot.on('create', async context => {
    try {
      await applyDefaultBranchSettings(context)
    } catch (error) {
      robot.log.error(error.message)
    }
  })

  robot.on('pull_request.opened', async context => {
    try {
      await applyDefaultBranchSettings(context)
    } catch (error) {
      robot.log.error(error.message)
    }
  })

  robot.on('pull_request.review_requested', async context => {
    try {
      await autoMerge(context)
    } catch (error) {
      robot.log.error(error.message)
    }
  })

  robot.on('check_run.completed', async context => {
    try {
      await autoApprove(context)
    } catch (error) {
      robot.log.error(error.message)
    }
  })
}

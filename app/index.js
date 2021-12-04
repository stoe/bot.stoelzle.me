const applyDefaultBranchSettings = require('./branch')
const applyDefaultSettings = require('./settings')

module.exports = robot => {
  robot.log(`bot.stoelzle.me 🤖 is alive`)

  robot.on('repository.created', async context => {
    try {
      await applyDefaultSettings(context)
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
}

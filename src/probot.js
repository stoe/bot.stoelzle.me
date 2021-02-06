module.exports = app => {
  app.log(`bot.stoelzle.me 🤖 is alive`)

  app.on('*', async context => {
    app.log(context)
  })
}

const {setTimeout} = require('timers/promises')

const LABLES = [
  {
    name: 'bug :bug:',
    description: 'Something not working?',
    color: 'bd2c00',
  },
  {
    name: 'feature-request :construction:',
    description: 'Want something new?',
    color: '4078c0',
  },
  {
    name: 'stale :robot:',
    description: 'Extra attention needed (stalebot)',
    color: '6e5494',
  },
  {
    name: 'dependency :robot:',
    description: 'Dependency update (dependabot)',
    color: '1b1f23',
  },
  {
    name: 'github-action :robot:',
    description: 'GitHub Action update (dependabot)',
    color: '1b1f23',
  },
  {
    name: 'help wanted :hand:',
    description: 'Pull requests welcome',
    color: '0b260c',
  },
  {
    name: 'wontfix :no_entry:',
    description: 'This will not be worked on',
    color: 'ebebeb',
  },
]

/**
 * @param {import('probot').Context} context
 */
module.exports = async context => {
  const {octokit} = context
  const {owner, repo} = context.repo()

  // current labels
  const {data} = await octokit.request('GET /repos/{owner}/{repo}/labels', {
    owner,
    repo,
    per_page: 100,
  })

  // sleep 1.5 seconds
  await setTimeout(1500)

  const currentLabels = new Set(data.map(label => `${label.name} ${label.description} ${label.color}`))
  const wantLabels = new Set(LABLES.map(label => `${label.name} ${label.description} ${label.color}`))

  // delete current labels
  for (const {name, description, color} of data) {
    if (!wantLabels.has(`${name} ${description} ${color}`)) {
      try {
        // https://docs.github.com/en/rest/reference/issues#delete-a-label
        await octokit.request('DELETE /repos/{owner}/{repo}/labels/{name}', {owner, repo, name})

        context.log.info(`🚮 label ${name} ${description} deleted for ${owner}/${repo}`)
      } catch (error) {
        context.log.info(`❌ label ${name} ${description} not deleted for ${owner}/${repo}`)
        context.log.error(error.message)
      }
    }

    // sleep 1.5 seconds
    await setTimeout(1500)
  }

  // create missing labels
  for (const {name, color, description} of LABLES) {
    if (!currentLabels.has(`${name} ${description} ${color}`)) {
      try {
        // https://docs.github.com/en/rest/reference/issues#create-a-label
        await octokit.request('POST /repos/{owner}/{repo}/labels', {
          owner,
          repo,
          name,
          color,
          description,
        })

        context.log.info(`🆕 label ${name} ${description} created for ${owner}/${repo}`)
      } catch (error) {
        context.log.info(`❌ label ${name} ${description} not created for ${owner}/${repo}`)
        context.log.error(error.message)
      }
    }

    // sleep 1.5 seconds
    await setTimeout(1500)
  }
}

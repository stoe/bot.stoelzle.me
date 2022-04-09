/**
 * @param {import('probot').Context} context
 */
module.exports = async context => {
  const {
    octokit,
    payload: {
      pull_request: {node_id: pullRequestId, html_url, state, user},
      sender
    }
  } = context

  if (user.login !== 'dependabot[bot]' && user.type !== 'Bot' && user.login !== sender.login) return
  if (state !== 'open') return

  try {
    await octokit.graphql(
      `mutation($pullRequestId: ID!) {
  enablePullRequestAutoMerge(input: {
    pullRequestId: $pullRequestId
    mergeMethod: SQUASH
  }) {
    pullRequest { title }
  }
}`,
      {pullRequestId}
    )

    context.log.info(`Auto-merge enabled for ${html_url}`)
  } catch (error) {
    context.log.info(`Auto-merge not enabled for ${html_url}`)
    context.log.error(error.message)
  }
}

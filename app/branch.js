// https://docs.github.com/en/graphql/reference/input-objects#createbranchprotectionruleinput
const query = `mutation(
  $repo: ID!,
  $actors: [ID!] = []
) {
  createBranchProtectionRule(input: {
    clientMutationId: "@stoe/bot-stoelzle-me"
    repositoryId: $repo
    pattern: "main"

    requiresApprovingReviews: true
    requiredApprovingReviewCount: 1
    requiresCodeOwnerReviews: true
    restrictsReviewDismissals: false

    requiresStatusChecks: true
    requiresStrictStatusChecks: true
    requiredStatusCheckContexts: ["test / test"]

    requiresConversationResolution: true

    requiresCommitSignatures: true

    requiresLinearHistory: true

    restrictsPushes: false

    isAdminEnforced: false

    allowsForcePushes: true
    bypassForcePushActorIds: $actors

    allowsDeletions: false
  }) {
    clientMutationId
  }
}`

/**
 * @param {import('probot').Context} context
 */
module.exports = async context => {
  const {
    octokit,
    payload: {
      ref_type,
      ref: branch,
      repository: {
        node_id: id,
        owner: {type, node_id: actor}
      }
    }
  } = context
  const {owner, repo} = context.repo()

  if (ref_type === 'branch' && branch === 'main') {
    try {
      if (type === 'User') {
        await octokit.graphql(query, {repo: id, actors: [actor]})
      } else {
        await octokit.graphql(query, {repo: id})
      }

      context.log.info(`branch protection applied: ${owner}/${repo}:${branch}`)
    } catch (error) {
      context.log.warn(`branch protection already applied: ${owner}/${repo}:${branch}`)
      context.log.error(error.message)
    }
  }
}

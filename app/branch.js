// https://docs.github.com/en/graphql/reference/input-objects#createbranchprotectionruleinput
const query = `mutation($repo: ID!) {
  createBranchProtectionRule(input: {
    clientMutationId: "stoe-bot-client-protection"
    repositoryId: $repo
    pattern: "main"

    requiresApprovingReviews: true
    requiredApprovingReviewCount: 1
    requiresCodeOwnerReviews: true
    restrictsReviewDismissals: false

    requiresStatusChecks: true
    requiresStrictStatusChecks: true
    requiredStatusChecks: [{
      # GitHub Actions
      appId: "MDM6QXBwMTUzNjg="
      context: "test / test"
    }]

    requiresConversationResolution: true

    requiresLinearHistory: true

    requiresCommitSignatures: true

    isAdminEnforced: false

    restrictsPushes: false

    allowsDeletions: false
    allowsForcePushes: false
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
      repository: {node_id: id}
    }
  } = context
  const {owner, repo} = context.repo()

  if (ref_type === 'branch' && branch === 'main') {
    try {
      await octokit.graphql(query, {repo: id})

      context.log.info(`Branch protection applied: ${owner}/${repo}:${branch}`)
    } catch (error) {
      context.log.warn(`Branch protection already applied: ${owner}/${repo}:${branch}`)
    }
  }
}

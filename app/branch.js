// https://docs.github.com/en/graphql/reference/input-objects#createbranchprotectionruleinput
const getBranchProtectionQuery = `query(
  $owner: String!,
  $repo: String!
) {
  repository(
    owner: $owner,
    name: $repo
  ) {
    owner {
      id
      type: __typename
    }
    branchProtectionRules(first: 5) {
      nodes {
        id
        pattern
        requiredStatusChecks {
          context
        }
      }
    }
  }
}`

// https://docs.github.com/en/graphql/reference/input-objects#createbranchprotectionruleinput
const createBranchProtectionQuery = `mutation(
  $repo: ID!,
  $actors: [ID!] = []
) {
  createBranchProtectionRule(input: {
    clientMutationId: "@stoe/octoherd-script-repo-settings"
    repositoryId: $repo
    pattern: "main"

    requiresApprovingReviews: false
    requiredApprovingReviewCount: 0
    requiresCodeOwnerReviews: true
    restrictsReviewDismissals: false
    requireLastPushApproval: true

    requiresStatusChecks: true
    requiresStrictStatusChecks: true
    requiredStatusCheckContexts: ["test / test", "test / test-matrix (16)"]

    requiresConversationResolution: true

    requiresCommitSignatures: true

    requiresLinearHistory: true

    restrictsPushes: false

    isAdminEnforced: false

    allowsForcePushes: false
    bypassForcePushActorIds: $actors
    bypassPullRequestActorIds: $actors

    allowsDeletions: false
  }) {
    clientMutationId
  }
}`

// https://docs.github.com/en/graphql/reference/mutations#updatebranchprotectionrule
const updateBranchProtectionQuery = `mutation(
  $branchProtectionRuleId: ID!
  $pattern: String = "main",
  $actors: [ID!] = []
) {
  updateBranchProtectionRule(input: {
    clientMutationId: "@stoe/octoherd-script-repo-settings"
    branchProtectionRuleId: $branchProtectionRuleId

    pattern: $pattern

    requiresApprovingReviews: true
    requiredApprovingReviewCount: 0
    requiresCodeOwnerReviews: true
    restrictsReviewDismissals: false
    requireLastPushApproval: true

    requiresStatusChecks: true
    requiresStrictStatusChecks: true
    requiredStatusCheckContexts: ["test / test", "test / test-matrix (16)"]

    requiresConversationResolution: true

    requiresCommitSignatures: true

    requiresLinearHistory: true

    restrictsPushes: false

    isAdminEnforced: false

    allowsForcePushes: false
    bypassForcePushActorIds: $actors
    bypassPullRequestActorIds: $actors

    allowsDeletions: false
  }) {
    clientMutationId
  }
}`

// https://docs.github.com/en/graphql/reference/mutations#updatebranchprotectionrule
const updateBranchProtectionNoChecksQuery = `mutation(
  $branchProtectionRuleId: ID!
  $pattern: String = "main",
  $actors: [ID!] = []
) {
  updateBranchProtectionRule(input: {
    clientMutationId: "@stoe/octoherd-script-repo-settings"
    branchProtectionRuleId: $branchProtectionRuleId

    pattern: $pattern

    requiresApprovingReviews: true
    requiredApprovingReviewCount: 0
    requiresCodeOwnerReviews: true
    restrictsReviewDismissals: false
    requireLastPushApproval: true

    requiresStatusChecks: false
    requiresStrictStatusChecks: false
    requiredStatusCheckContexts: []

    requiresConversationResolution: true

    requiresCommitSignatures: true

    requiresLinearHistory: true

    restrictsPushes: false

    isAdminEnforced: false

    allowsForcePushes: false
    bypassForcePushActorIds: $actors
    bypassPullRequestActorIds: $actors

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
      pull_request: {
        base: {ref: branch}
      },
      repository: {
        node_id: id,
        owner: {type, node_id: actor},
        language: lang
      }
    }
  } = context
  const {owner, repo} = context.repo()
  const language = lang ? lang.toLowerCase() : null

  if (branch === 'main') {
    // branch protection
    const {
      repository: {
        branchProtectionRules: {nodes: rules}
      }
    } = await octokit.graphql(getBranchProtectionQuery, {owner, repo})

    try {
      if (rules.length === 0 && language === 'javascript') {
        if (type === 'User') {
          await octokit.graphql(createBranchProtectionQuery, {repo: id, actors: [actor]})
        } else {
          await octokit.graphql(createBranchProtectionQuery, {repo: id})
        }

        context.log.info(`branch protection applied: ${owner}/${repo}:${branch}`)
      } else {
        for (const rule of rules) {
          const {pattern, id: branchProtectionRuleId, requiredStatusChecks} = rule

          if (requiredStatusChecks.length === 0) {
            await octokit.graphql(updateBranchProtectionNoChecksQuery, {
              branchProtectionRuleId: id,
              pattern,
              actors: [actor]
            })
            context.log.debug('branch protection updated')
            continue
          }

          if (pattern === 'main') {
            await octokit.graphql(updateBranchProtectionQuery, {
              branchProtectionRuleId,
              pattern,
              actors: [actor]
            })
            context.log.debug('branch protection updated')
          }
        }
      }
    } catch (error) {
      context.log.warn(`branch protection already applied: ${owner}/${repo}:${branch}`)
      context.log.error(error.message)

      throw error
    }
  }
}

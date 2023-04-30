const {setTimeout} = require('timers/promises')

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
    clientMutationId: "bot.stoelzle.me"
    repositoryId: $repo
    pattern: "main"

    requiresApprovingReviews: true
    requiredApprovingReviewCount: 0
    requiresCodeOwnerReviews: true
    restrictsReviewDismissals: false
    requireLastPushApproval: true

    requiresStatusChecks: true
    requiresStrictStatusChecks: true
    // requiredStatusCheckContexts: ["test / test-matrix (16)", "test / test"]
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

// https://docs.github.com/en/graphql/reference/input-objects#createbranchprotectionruleinput
const createBranchProtectionNoChecksQuery = `mutation(
  $repo: ID!,
  $actors: [ID!] = []
) {
  createBranchProtectionRule(input: {
    clientMutationId: "bot.stoelzle.me"
    repositoryId: $repo
    pattern: "main"

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

// https://docs.github.com/en/graphql/reference/mutations#updatebranchprotectionrule
const updateBranchProtectionQuery = `mutation(
  $branchProtectionRuleId: ID!
  $pattern: String = "main",
  $actors: [ID!] = []
) {
  updateBranchProtectionRule(input: {
    clientMutationId: "bot.stoelzle.me"
    branchProtectionRuleId: $branchProtectionRuleId

    pattern: $pattern

    requiresApprovingReviews: true
    requiredApprovingReviewCount: 0
    requiresCodeOwnerReviews: true
    restrictsReviewDismissals: false
    requireLastPushApproval: true

    requiresStatusChecks: true
    requiresStrictStatusChecks: true
    // requiredStatusCheckContexts: ["test / test-matrix (16)", "test / test"]
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

// https://docs.github.com/en/graphql/reference/mutations#updatebranchprotectionrule
const updateBranchProtectionNoChecksQuery = `mutation(
  $branchProtectionRuleId: ID!
  $pattern: String = "main",
  $actors: [ID!] = []
) {
  updateBranchProtectionRule(input: {
    clientMutationId: "bot.stoelzle.me"
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
      pull_request,
      ref,
      repository: {
        node_id: repoId,
        owner: {type, node_id: actor},
        language: lang,
      },
      sender: {login: actorLogin, type: actorType},
    },
  } = context
  const {owner, repo} = context.repo()
  const language = lang ? lang.toLowerCase() : null

  const branch = pull_request && pull_request.base ? pull_request.base.ref : ref

  if (branch === 'main') {
    // branch protection
    const {
      repository: {
        branchProtectionRules: {nodes: rules},
      },
    } = await octokit.graphql(getBranchProtectionQuery, {owner, repo})

    // sleep 1.5 seconds
    await setTimeout(1500)

    try {
      const options = {
        repo: repoId,
      }

      if (type === 'User' && actorLogin === 'stoe' && actorType === 'User') {
        options.actors = [actor]
      }

      // determine if branch protection needs to be created or updated
      const create = rules.length === 0
      const update = rules.length > 0

      // create
      if (create && language === 'javascript') {
        await octokit.graphql(createBranchProtectionQuery, options)

        context.log.info(`🔒 create branch protectionfor ${owner}/${repo}`)
      }

      if (create && language !== 'javascript') {
        await octokit.graphql(createBranchProtectionNoChecksQuery, options)

        context.log.info(`🔒 create branch protectionfor ${owner}/${repo}`)
      }

      // update
      if (update && language === 'javascript') {
        for (const rule of rules) {
          const {pattern, id} = rule

          if (['main', 'master'].includes(pattern)) {
            await octokit.graphql(updateBranchProtectionQuery, {
              branchProtectionRuleId: id,
              pattern,
              ...options,
            })

            context.log.info(`🔒 update branch protectionfor ${owner}/${repo}`)
          }

          // sleep 1.5 seconds
          await setTimeout(1500)
        }
      }

      if (update && language !== 'javascript') {
        for (const rule of rules) {
          const {pattern, id, requiredStatusChecks} = rule

          if (requiredStatusChecks.length === 0) {
            await octokit.graphql(updateBranchProtectionNoChecksQuery, {
              branchProtectionRuleId: id,
              pattern,
              ...options,
            })

            context.log.info(`🔒 update branch protectionfor ${owner}/${repo}`)
          }
        }

        // sleep 1.5 seconds
        await setTimeout(1500)
      }

      if (!create && !update) {
        context.log.info(`🙊 skipped branch protection for ${owner}/${repo}`)
      }
    } catch (error) {
      context.log.warn(`🙈 branch protection already applied ${owner}/${repo}:${branch}`)
      context.log.error(error.message)

      throw error
    }
  }
}

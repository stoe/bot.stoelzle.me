/**
 * @param {import('probot').Context} context
 */
const autoMerge = async context => {
  const {
    octokit,
    payload: {
      pull_request: {node_id: pullRequestId, state, user},
      repository: {
        owner: {login: username, type},
      },
      sender,
    },
  } = context

  if (user.login !== 'dependabot[bot]' && user.type !== 'Bot' && user.login !== sender.login) return
  if (state !== 'open') return

  const {owner, repo} = context.repo()

  try {
    if (type === 'User') {
      const {email} = await octokit.request('GET /users/{username}', {
        username,
      })

      await octokit.graphql(
        `mutation($pullRequestId: ID!, $email: String) {
    enablePullRequestAutoMerge(input: {
      pullRequestId: $pullRequestId
      mergeMethod: SQUASH
      authorEmail: $email
    }) {
      pullRequest { title }
    }
  }`,
        {pullRequestId, email},
      )
    } else {
      await octokit.graphql(
        `mutation($pullRequestId: ID!) {
    enablePullRequestAutoMerge(input: {
      pullRequestId: $pullRequestId
      mergeMethod: SQUASH
    }) {
      pullRequest { title }
    }
  }`,
        {pullRequestId},
      )
    }

    context.log.info(`🤖 auto-merge enabled for ${owner}/${repo}`)
  } catch (error) {
    context.log.warn(`❌ auto-merge not enabled for ${owner}/${repo}`)
    context.log.error(error.message)

    throw error
  }
}

/**
 * @param {import('probot').Context} context
 */
const autoApprove = async context => {
  const {
    octokit,
    payload: {
      check_run: {
        name,
        status,
        conclusion,
        app: {slug},
        check_suite: {pull_requests: prs},
      },
      sender: {login: actorLogin, type: actorType},
    },
  } = context

  if (actorLogin !== 'dependabot[bot]' && actorType !== 'Bot') return

  const {owner, repo} = context.repo()

  try {
    if (
      ['test', 'test / test'].includes(name.toLowerCase()) &&
      status === 'completed' &&
      conclusion === 'success' &&
      slug === 'github-actions' &&
      prs.length === 1
    ) {
      const {
        number,
        head: {ref: headref, sha},
        base: {ref: baseref},
      } = prs[0]

      if (baseref !== 'main' || !headref.includes('dependabot')) return

      await octokit.request('POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews', {
        owner,
        repo,
        pull_number: number,
        commit_id: sha,
        event: 'APPROVE',
        body: `_🤖 auto-approved_`,
      })

      context.log.info(`🤖 auto-approved ${owner}/${repo}#${number}`)
    }
  } catch (error) {
    context.log.warn(`❌ auto-approve failed for ${owner}/${repo}`)
    context.log.error(error.message)

    throw error
  }
}

module.exports = {
  autoMerge,
  autoApprove,
}

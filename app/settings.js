/**
 * @param {import('probot').Context} context
 */
module.exports = async context => {
  const {
    octokit,
    payload: {
      repository: {
        private,
        owner: {type}
      }
    }
  } = context
  const {owner, repo} = context.repo()

  try {
    // https://docs.github.com/en/rest/reference/repos#enable-vulnerability-alerts
    await octokit.request('PUT /repos/{owner}/{repo}/vulnerability-alerts', {owner, repo})

    // https://docs.github.com/en/rest/reference/repos#enable-automated-security-fixes
    await octokit.request('PUT /repos/{owner}/{repo}/automated-security-fixes', {owner, repo})

    // https://docs.github.com/en/rest/reference/repos#update-a-repository
    const config = {
      owner,
      repo,
      name: repo,
      has_issues: true,
      has_projects: false,
      has_wiki: false,
      allow_squash_merge: true,
      allow_merge_commit: false,
      allow_rebase_merge: false,
      allow_auto_merge: true,
      delete_branch_on_merge: true,
      security_and_analysis: {
        secret_scanning: {
          status: 'enabled'
        },
        secret_scanning_push_protection: {
          status: 'enabled'
        }
      }
    }

    if (config.security_and_analysis.secret_scanning && private === false) {
      // Secret Scanning is enabled on public repositories
      delete config.security_and_analysis.secret_scanning
    }

    if (config.security_and_analysis.secret_scanning && type === 'User') {
      // Secret Scanning can only be set on organization owned repositories
      delete config.security_and_analysis.secret_scanning
      delete config.security_and_analysis.secret_scanning_push_protection
    }

    if (Object.keys(config.security_and_analysis).length === 0) {
      delete config.security_and_analysis
    }

    // https://docs.github.com/en/rest/reference/repos#update-a-repository
    await octokit.request('PATCH /repos/{owner}/{repo}', config)

    context.log.info(`repository settings applied for: ${owner}/${repo}`)
  } catch (error) {
    context.log.warn(`repository settings partially/not applied for: ${owner}/${repo}`)
    context.log.error(error.message)
  }
}

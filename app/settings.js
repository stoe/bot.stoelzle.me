/**
 * @param {import('probot').Context} context
 */
module.exports = async context => {
  const {octokit} = context
  const {owner, repo} = context.repo()

  try {
    // https://docs.github.com/en/rest/reference/repos#enable-vulnerability-alerts
    await octokit.request('PUT /repos/{owner}/{repo}/vulnerability-alerts', {
      owner,
      repo,
      mediaType: {
        previews: ['dorian']
      }
    })

    // https://docs.github.com/en/rest/reference/repos#enable-automated-security-fixes
    await octokit.request('PUT /repos/{owner}/{repo}/automated-security-fixes', {
      owner,
      repo,
      mediaType: {
        previews: ['london']
      }
    })

    // https://docs.github.com/en/rest/reference/repos#update-a-repository
    await octokit.request('PATCH /repos/{owner}/{repo}', {
      owner,
      repo,
      name: repo,
      has_issues: 'yes',
      has_projects: false,
      has_wiki: false,
      allow_squash_merge: true,
      allow_merge_commit: false,
      allow_rebase_merge: false,
      delete_branch_on_merge: true,
      security_and_analysis: {
        secret_scanning: {
          status: 'enabled'
        }
      }
    })

    context.log.info(`Repository settings applied for: ${owner}/${repo}`)
  } catch (error) {
    context.log.warn(`Repository settings partially/not applied for: ${owner}/${repo}`)
    context.log.error(error.message)
  }
}

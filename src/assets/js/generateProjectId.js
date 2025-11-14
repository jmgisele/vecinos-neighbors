/**
 * Turns a project repository URL into a folder name to clone into
 * (naive implementation, but should work considering we’re forcing the URL
 * to be a HTTP one as opposed to an SSH one)
 *
 * @param {String} projectRepo The repository URL of the project
 * @returns {String} The end part {@link projectRepo} without the '.git' suffix
 */
export default function generateProjectId(projectRepo) {
  if (!projectRepo) throw new Error('A project repository URL is required');
  return projectRepo.split('/').slice(-1)[0].replace(/\.git$/, '');
}

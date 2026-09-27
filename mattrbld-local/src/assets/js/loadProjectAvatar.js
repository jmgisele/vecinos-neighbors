export default async function loadProjectAvatar(projectId, fs) {
  try {
    const avatarFile = (await fs.readdir(`/projects/${projectId}/.mattrbld`)).find((file) => file.startsWith('avatar.'));
    const avatarData = await fs.readFile(`/projects/${projectId}/.mattrbld/${avatarFile}`);
    return URL.createObjectURL(new Blob([avatarData])); // revoking is handled by the ProjectAvatar component
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  return null;
}

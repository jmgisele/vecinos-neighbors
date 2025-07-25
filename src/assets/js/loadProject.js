import loadProjectAvatar from './loadProjectAvatar';

export default async function loadProject(id, fs) {
  const usersPath = `/projects/${id}/.mattrbld/users`;
  const userFiles = await fs.readdir(usersPath);

  const [projectJsonString, ...userJsonStrings] = await Promise.all([
    fs.readFile(`/projects/${id}/.mattrbld/config.json`, 'utf8'),
    ...userFiles.filter((userFile) => userFile.endsWith('.json')).map((userFile) => fs.readFile(`${usersPath}/${userFile}`, 'utf8')),
  ]);

  const project = JSON.parse(projectJsonString);
  project.id = id;
  const users = userJsonStrings.map((string) => JSON.parse(string));
  const avatarUrl = await loadProjectAvatar(id, fs);

  return { project, users, avatarUrl };
}

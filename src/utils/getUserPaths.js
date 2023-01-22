const fs = require('fs');
const path = require('path');

function getUserPaths(src) {
  const srcPath = path.resolve(src);
  if (srcPath.basename === 'settings_Default') return [srcPath];
  const trials = [
    path.resolve(srcPath, '/Users/'),
    path.resolve(srcPath, '/c/Users/'),
    path.resolve(srcPath, '/mnt/c/Users/'),
  ];
  const foundUserDirs = trials
    .filter((p) => fs.existsSync(p))
    .reduce((all, p) => {
      const listing = fs.readdirSync(p).map((f) => `${p}/${f}`);
      return [
        ...all,
        ...listing,
      ];
    }, []);
  const userDirs = [
    ...foundUserDirs,
    path.resolve(process.cwd(), '~'),
    path.resolve(process.cwd(), '%USERPROFILE%'),
    path.resolve(process.cwd(), '%LOCALAPPDATA%'),
  ].filter((p) => fs.existsSync(p) && fs.lstatSync(p).isDirectory());
  return userDirs;
}

module.exports = getUserPaths;

const fs = require('fs');
const path = require('path');

function ensureRecursiveSync(dir) {
  if (fs.existsSync(dir) && !fs.lstatSync(dir).isDirectory()) return;
  const dirPath = path.resolve(dir);
  const dirPathSplit = dirPath.split('/');
  if (dirPathSplit.length > 2) {
    ensureRecursiveSync(dirPathSplit.slice(0, dirPathSplit.length - 1).join('/'));
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

module.exports = ensureRecursiveSync;

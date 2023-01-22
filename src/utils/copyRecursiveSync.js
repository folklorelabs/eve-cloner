const fs = require('fs');
const path = require('path');

const ensureRecursiveSync = require('./ensureRecursiveSync');
const copyFileSync = require('./copyFileSync');

function copyRecursiveSync(source, target) {
  let files = [];

  // Check if folder needs to be created or integrated
  ensureRecursiveSync(target);

  // Copy
  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source);
    files.forEach((file) => {
      const curSource = path.join(source, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyRecursiveSync(curSource, target);
      } else {
        copyFileSync(curSource, target);
      }
    });
  }
}

module.exports = copyRecursiveSync;

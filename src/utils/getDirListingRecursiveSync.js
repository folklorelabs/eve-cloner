const fs = require('fs');
const path = require('path');

function getDirListingRecursiveSync(file) {
  const filePath = path.resolve(file);
  if (!fs.lstatSync(filePath).isDirectory()) return [path.dirname(filePath)];
  const listingFiles = fs.readdirSync(filePath);
  const listingPaths = listingFiles.map((f) => path.resolve(file, f));
  const listing = listingPaths.reduce((all, p) => [
    ...all,
    ...getDirListingRecursiveSync(p),
  ], []);
  return [...new Set(listing)];
}

module.exports = getDirListingRecursiveSync;

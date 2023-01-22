const fs = require('fs');
const path = require('path');

function getFileListingRecursiveSync(file) {
  const filePath = path.resolve(file);
  if (!fs.lstatSync(filePath).isDirectory()) return [filePath];
  const listingFiles = fs.readdirSync(filePath);
  const listingPaths = listingFiles.map((f) => path.resolve(file, f));
  const listing = listingPaths.reduce((all, p) => [
    ...all,
    ...getFileListingRecursiveSync(p),
  ], []);
  return listing;
}

module.exports = getFileListingRecursiveSync;

const os = require('os');
const path = require('path');

const uploadsRoot = process.env.VERCEL
  ? path.join(os.tmpdir(), 'meiosis-uploads')
  : path.join(__dirname, '../../uploads');

function resolveUploadPath(publicPath = '') {
  const relativePath = String(publicPath)
    .replace(/^\/+/, '')
    .replace(/^uploads\/?/, '');

  return path.join(uploadsRoot, relativePath);
}

module.exports = {
  uploadsRoot,
  resolveUploadPath,
};

const path = require('path');
const pak = require('../package.json');

// Autolinks the library's native code (the TenTapKeyboard module) from the
// repo root, which is not an npm dependency of this app.
module.exports = {
  dependencies: {
    [pak.name]: {
      root: path.join(__dirname, '..'),
    },
  },
};

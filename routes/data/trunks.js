var main = require('./trunks_main');

Object.keys(main).forEach(function(item) {
  exports[item] = main[item];
});
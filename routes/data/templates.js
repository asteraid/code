var main = require('./templates_main');

Object.keys(main).forEach(function(item) {
  exports[item] = main[item];
});
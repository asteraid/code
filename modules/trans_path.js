var config    = require('../config.js');

var path = {view: {}, modal: {}};

if (config.multi) {
  //path.modal  = {'template/edit': 'template/edit_multi'};
  path.view   = {};
}

module.exports = path;
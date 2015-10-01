/* module for common methods */
exports.getFile = function(file) {
  var fs    = require('fs');
  var path  = require('path');

  return fs.readFileSync(path.join(__dirname, '../routes/data', file), {encoding: 'utf8'});
}
var render = function (file, params) {
  var fs        = require('fs');
  var jade      = require('jade');
  var template  = fs.readFileSync(file, 'utf8');
  
  template = jade.compile(template, params);
  
  return template(params);
}

module.exports.render = render;
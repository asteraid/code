//var config    = require('../config.js');
//var mysql     = require('mysql');

var fs      = require('fs');
var path    = require('path');
var appDir  = path.dirname(require.main.filename);
//var params  = {config: "config_test"};

var getJSConfig = function(params) {
  var result = {};
  var content = '';
  var objConfig = {};
  
  try {
    content = fs.readFileSync(path.join(appDir, params.config), {encoding: "utf8"});
    result  = content.split(/\n|\r\n/);
    
    if (result.lenght === 0)
      throw new Error('Config empty');
    
    result.map(function(item) {
      item = item.split('=');
      if (item) {
        if (item[0] && (item[1] || item[1] === '')) {
          assign(objConfig, item[0], item[1]);
        }
      }
    });
  } catch(e) {
    return objConfig;
  }
  
  return objConfig;
  
  function assign(obj, prop, value) {
    if (typeof prop === 'string')
      prop = prop.split('_');

    if (prop.length > 1) {
      var e = prop.shift();

      if (typeof obj[e] !== 'object')
        obj[e] = {};
      
      assign(obj[e], prop, value);
    } else
      obj[prop[0]] = value;
  }
}

function mergeJSConfigs() {
  var merge       = require('merge');
  var configsList = ['config', 'config_user', 'config_dev'];
  var result      = {};

  configsList.forEach(function(item) {
    if (fs.existsSync('./' + item))
      result = merge.recursive(result, getJSConfig({config: item}));
  });
  
  return result;
}

module.exports.getJSConfig    = getJSConfig;
module.exports.mergeJSConfigs = mergeJSConfigs;
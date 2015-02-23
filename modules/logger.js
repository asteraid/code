var loggerCmd = 'logger -t node-asteraid ';

var login = function(req, obj) {
  var user  = getUserInfo(req, obj);
  var msg   = '';
  
  if (obj.success)
    msg = '"Authentication successed. User login. USER=' + user.name + ' CLIENT=' + user.ip + '"';
  else
    msg = '"Authentication failed. Wrong login or password. USER=' + user.name + ' CLIENT=' + user.ip + '"';
  
  var cmd = loggerCmd + msg;
  
  exec(cmd, function(error, stdout, stderr) {});
}

var logout = function(req, obj) {
  var user  = getUserInfo(req, obj);
  var  msg  = '"User ' + user.name + ' from ' + user.ip +  ' logout"';
  
  var cmd   = loggerCmd + msg;
  
  exec(cmd, function(error, stdout, stderr) {});
}

var getUserInfo = function(req, obj) {
  var ip    = req.connection.remoteAddress;
  var user  = obj.user;//req.session.user;
  
  return {ip: ip, name: user};
}

var exec = function(cmd, callback) {
  var execute = require('child_process').exec, child;
  execute(cmd, function(error, stdout, stderr) {
    callback(error, stdout, stderr);
  });
}

module.exports.login = login;
module.exports.logout = logout;
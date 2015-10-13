/* 
 * exec external command
 * 
 */
exports.apply_config = function (req, res) {
  var exec = require('child_process').exec, child;

  child = exec(config.execScriptDir + 'apply.sh', function(error,stdout,stderr) {
    if (!error) res.json({ success: true, message: stdout});
    else res.json({ success: false, message: stderr});
  });
}

exports.asterisk_restart = function (req, res) {
  var exec = require('child_process').exec, child;
  
  child = exec("asterisk -rx 'core restart now'", function(error,stdout,stderr) {
    if (!error) res.json({ success: true, message: stdout});
    else res.json({ success: false, message: stderr});
  });
}
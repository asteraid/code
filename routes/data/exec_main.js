/* 
 * exec external command
 * 
 */
exports.apply_config = function (req, res) {
    var exec = require('child_process').exec, child;
    //child = exec('cd ' + config.execScriptDir  + ' && ' + './apply.sh',function(error,stdout,stderr){
    //child = exec('./' + config.execScriptDir + 'apply.sh', function(error,stdout,stderr){
    child = exec(config.execScriptDir + 'apply.sh', function(error,stdout,stderr){
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
/*function run_cmd(cmd, args, done) {
    var spawn = require("child_process").spawn;
    var child = spawn(cmd, args);
    var result = { stdout: "" };
    child.stdout.on("data", function (data) {
            result.stdout += data;
    });
    child.stdout.on("end", function () {
            done();
    });
    return result;
}

function exec_command(cmd,res){
   var exec = require('child_process').exec, child;
   
   child = exec(cmd, function(error,stdout,stderr){
            if ( !error){
                    res.json({success:true, message: stdout});
            }
            else
                res.json({success:false, rows: [], error: error, message: stderr});
        });
}*/

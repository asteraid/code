var main = require('./exec_main');

Object.keys(main).forEach(function(item) {
  exports[item] = main[item];
});

// type - тип выборки short - короткий
exports.get_serverList = function(req, res){
  var exec      = require('child_process').exec, child;
  var fs        = require('fs');
  var req_type  = req.param('type');
  
  fs.readFile(config.serverHostsFile, 'utf-8', function(err,data) {
    if (!err) {
      var regexp  = /\[asterisk\]([.\s\S]*?)\[/im;
      var match   = regexp.exec(data);
      if ( match ) {
        var servers       = [];
        var servlist      = match[1].split('\n');
        console.log(servlist);
        var regexp_server = /(\S*)\ssid=(\d+)/;

        for ( var i = 0, length=servlist.length; i<length; i++) {
          var serv_match = regexp_server.exec(servlist[i]);
          if (serv_match) {
            if (serv_match[1].substring(0,1) !== '#')
              servers[serv_match[1]] = {
                "id":       serv_match[2],
                "name":     serv_match[1],
                "status":   "Unavailable",
                "ip":       "",
                "os":       "",
                "comment":  "",
                "config_version": ""
              };
          }
        }

        if ( req_type !== 'short'){
          child = exec(config.execScriptDir+"ansible-get-properties",function(error,stdout,stderr) {
            if ( !error || regexp.test(stderr) ) {  // Failed попадает в stderr
              var out         = stdout.split('\n')
              var regexp_serv = /^\[(.*)\]$/i;
              var server_name = '';
              var regexp_prop = /(.*?)\s*=\s*(.*?)$/i

              for (var i=0, length=out.length; i<length; i++) {
                if ( regexp_serv.test(out[i]) ){
                  server_name = regexp_serv.exec(out[i])[1];
                  servers[server_name]["status"] = "Operational" ;
                } else if (regexp_prop.test(out[i])) {
                  var match = regexp_prop.exec(out[i]);
                  var param = match[1];
                  var val   = match[2];
                  servers[server_name][param] = val;
                }
              }
              serv_out = [];
              for(key in servers){
                serv_out.push(servers[key]);
              }
              res.json({success:true, rows: serv_out});
            } else {
              res.json({success:false, rows: [], message: stderr});
            }
          });
        } else {
          serv_out = [];
          for(key in servers){
            serv_out.push(servers[key]);
          }
          res.json({success:true, rows: serv_out});
        }
      } else res.json({success:false, rows: [], message: "Not found list servers"});
    } else res.json({success:false, rows: [], message: err});
  });
}

exports.send_config = function(req, res) {
  var db    = require('../../modules/db');
  var exec  = require('child_process').exec, child;

  var params = {
    type: req.param('type')
  };
    
  executeApply({type: params.type}, function(error, result) {
    if (error) {
      res.json({success: false, message: error.message, type: error.type});
      return;
    }
    
    res.json({success: true});
  });

  function executeApply(params, callback) {
    if (params.type == 'send') {
      var version = new Date().getTime();
      
      child = exec(config.execScriptDir + 'apply.sh send ' + version, function(error, stdout, stderr) {
        if (error !== null) {
          if (stderr == '')
            stderr = error.message;

          callback({message: stderr, code: stderr});
          return;
        }
    
        var query = [
          'SELECT sl1.host, sl2.status, sl2.msg FROM syslog sl1',
          'LEFT OUTER JOIN syslog sl2',
          'ON(sl1.host = sl2.host and sl1.version = sl2.version and sl2.status NOT IN (?, ?))', 
          'WHERE sl1.status = ? AND sl1.version = ?'
        ].join(' ');

        db.query(req, query, ['ATTEMPT', 'TRY', 'ATTEMPT', version], function(error, results) {
          if (error) {
            callback(error);
            return;
          }
      
          if (results.length == 0) {
            callback({message: "Hosts is not available"});
            return;
          }
      
          var errors        = [];
          var successStatus = 'OK';

          results.forEach(function(item) {
            if (item.status != successStatus)
              errors.push([item.host, ' - ', item.msg].join(''));
          });

          if (errors.length) {
            callback({message: "Errors: " + errors.join(', '), type: "confirm"});
            return;
          }

          callback(null);
        });
      });
    }
    
    if (params.type == 'reload') {
      child = exec(config.execScriptDir + 'apply.sh reload', function(error, stdout, stderr) {
        if (error) {
          callback({message: stderr, code: stderr});
          return;
        }
        
        callback(null);
      });
    }
  }
}
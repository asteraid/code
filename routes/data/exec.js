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
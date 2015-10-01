var db = require('../../modules/db');

exports.get_ringgroup = function(req, res) {
  var context_name = req.param('context_name');
  var timeout = 0;
  var strategy = '';
  var extension = [];
  var query = "SELECT var_name as name,var_val as value from vConfig WHERE category = '"+context_name+"'";
  
  db.query(req, query, function(err, results, fields) {
    if (err) {
      res.json({success: false, message: err.code});
      return;
    }
    
    for (var i = 0, length = results.length; i < length; i++ ) {
      if (i in results) {
        switch ( results[i].name ){
          case 'timeout' :
            timeout = results[i].value;
            break;
          case 'strategy' :
            strategy = results[i].value;
            break;
          case 'member' :
            extension.push(results[i].value);
            break;
        }
      }
    }
    
    res.json({success: true, timeout: timeout, strategy: strategy, extension: extension });
  });
}


/*exports.save_ringgroup = function(req, res){
  if ( req.session.dbuser && req.session.password ){
    var conf = {};
    conf.user = req.session.dbuser;
    conf.password = req.session.password;
    conf.host = config.db.host;
    conf.database = config.db.database;
    conf.database = config.db.database;
    conf.port = config.db.port;

    var db = mysql.createConnection(conf);
    db.connect(function(err) {
              // connected! (unless `err` is set)
    });
  
    var context_name = req.param('context_name'),
        extension = JSON.parse( req.param('extension') ),
        timeout = req.param('timeout'),
        strategy = req.param('strategy');
        
    var params = [{var_name: "weight", var_val: 0},
    {var_name: "wrapuptime", var_val: 0},
    {var_name: "announce-frequency", var_val: 0},
    {var_name: "maxlen", var_val: 0},
    {var_name: "autofill", var_val: "yes"},
    {var_name: "maxlen", var_val: 0},
    {var_name: "joinempty", var_val: "yes"},
    {var_name: "leavewhenempty", var_val: "no"},
    {var_name: "retry", var_val: 5},
    {var_name: "timeoutpriority", var_val: "app"},
    {var_name: "musicclass", var_val: "default"},
    {var_name: "ringinuse", var_val: "no"}
    ];
    console.log('save_ringgroup');
    var query = "call delete_sysextconf('" + context_name + "', @result);";
        db.query(query, function (err, results, fields) {
                            if ( !err ){
                                db.query("SELECT @result", function (err, results, fields) {
                                    if ( err ) {
                                        console.log(err);
                                    }
                                    var result = results[0]['@result'];
                                    if ( result == 1 ) {
                                        save_conf();
                                    }
                                    else {
                                        res.json({success: false, message: 'Error save RingGroup' });
                                        db.destroy();
                                    }
                                });
                            }
                            else {
                                    res.json({success: false, message: err.code });
                                    db.destroy();
                                }
        });

    var save_conf = function(){
        var query = "call insert_sysextconf('0','queues.conf', '" + context_name + "','timeout','"+timeout+"', @result);";
        console.log(query);
        db.query(query, function (err, results, fields) {
                            if ( !err ){
                                db.query("SELECT @result", function (err, results, fields) {
                                    var result = results[0]['@result'];
                                    if ( result == 1 ) {
                                         var query = "call insert_sysextconf('1','queues.conf', '" + context_name + "','strategy','"+strategy+"', @result);";
                                         db.query(query, function (err, results, fields) {
                                            if ( !err ){
                                                db.query("SELECT @result", function (err, results, fields) {
                                                    var result = results[0]['@result'];
                                                    var var_metric = 2;
                                                    if ( result ) {
                                                        save_param(0,var_metric,function(err,var_metric){
                                                            save_ext(0,var_metric);
                                                        });
                                                    }
                                                });

                                            }

                                         });
                                    } // end result
                                    else {
                                        res.json({success: false, message: 'Error save RingGroup' });
                                        db.destroy();
                                    }
                                });

                            }
                            else {
                                    res.json({success: false, message: err.code });
                                    db.destroy();
                                }


         });
     }
    
     var save_param = function(index,var_metric,callback){
         if ( index < params.length ){
             var query = "call insert_sysextconf('"+var_metric+"','queues.conf', '" + context_name + "','"+params[index].var_name+"','"+params[index].var_val+"', @result);";
                                     db.query(query, function (err, results, fields) {
                                        if ( !err ){
                                            db.query("SELECT @result", function (err, results, fields) {
                                                var result = results[0]['@result'];
                                                var_metric += 1 ;
                                                index += 1;
                                                if ( result ) {
                                                    save_param(index,var_metric,callback);
                                                }
                                                else {
                                                        callback(err,var_metric);
                                                    }

                                            });

                                        }
                                        else {
                                            callback(err,var_metric);
                                        }

                                     });
         }
         else {
                callback('',var_metric);
         }
             
     }    
    
     var save_ext = function(index,var_metric){
         if ( index < extension.length ){
             var query = "call insert_sysextconf('"+var_metric+"','queues.conf', '" + context_name + "','member','"+extension[index]+"', @result);";
                                     db.query(query, function (err, results, fields) {
                                        if ( !err ){
                                            db.query("SELECT @result", function (err, results, fields) {
                                                var result = results[0]['@result'];
                                                var_metric += 1 ;
                                                index += 1;
                                                if ( result ) {
                                                    save_ext(index,var_metric);
                                                }
                                                else {
                                                        res.json({success: false, message: err });
                                                        db.destroy();
                                                    }

                                            });

                                        }
                                        else {
                                            res.json({success: false, message: err });
                                            db.destroy();
                                        }

                                     });
         }
         else {
                res.json({success: true, message: "RingGroup success save!" });
                db.destroy();
         }
             
     }
     
     
   } // end if session
  
}*/

/*exports.del_ringgroup = function(req, res){
  if ( req.session.dbuser && req.session.password ){
    var conf = {};
    conf.user = req.session.dbuser;
    conf.password = req.session.password;
    conf.host = config.db.host;
    conf.database = config.db.database;
    conf.database = config.db.database;
    conf.port = config.db.port;

    var db = mysql.createConnection(conf);
    db.connect(function(err) {
              // connected! (unless `err` is set)
    });
  
    var context_name = req.param('context_name');
    
    var query = "call delete_sysextconf('" + context_name + "', @result);";
        db.query(query, function (err, results, fields) {
                            if ( !err ){
                                 db.query("SELECT @result", function (err, results, fields) {
                                    var result = results[0]['@result'];
                                    if ( result == 1 ) {
                                        res.json( { success: true } );
                                    }
                                    else {
                                        res.json({success: false, message: 'Error delete RingGroup' });
                                    }
                                    db.destroy();
                                });
                            }
                            else {
                                    res.json({success: false, message: err.code });
                                    db.destroy();
                                }
                           

        });
  }
  
}*/
var config    = require('../config.js');
var mysql     = require('mysql');

var getConfig = function(req, sys) {
  var conf = {};
  if (!sys) {
    if (req.session) {
      if (req.session.dbuser && req.session.password)
        conf = {
          host:               config.db.host,
          database:           config.db.database,
          port:               config.db.port,
          user:               req.session.dbuser || '',
          password:           req.session.password || '',
          dateStrings:        'DATETIME',
          multipleStatements: true,
          connectionLimit:    5
        };
    } else
      conf = req;      
  } else
    conf = {
      host:               config.db.host,
      database:           config.db.database,
      port:               config.db.port,
      user:               config.db.user,
      password:           config.db.password,
      dateStrings:        'DATETIME',
      multipleStatements: true,
      connectionLimit:    5
    };
    
  return conf;
}

var checkConnect = function(req, callback) {
  var conf = getConfig(req);
  var connection  = mysql.createConnection(conf);
  
  connection.connect(function(err) {
    callback(err);
  });
}

var query = function(req, sql) {
  var params, callback;
  var configDb = {};
  
  if (typeof(arguments[2]) == 'function') {
    callback = arguments[2];
    params = [];
  } else if (typeof(arguments[3]) == 'function') {
    callback = arguments[3];
    params = arguments[2];
  }

  configDb = getConfig(req);

  var connection  = mysql.createConnection(configDb);

  connection.query(sql, params, function(err, rows, fields) {
    callback(err, rows || [], fields || []);
    
    //console.log("Error:", err);
    //console.log("Running query:", sql, params);
    //console.log("err, rows, fields:", err, rows, fields);
  });

  connection.end();
};

module.exports.query        = query;
module.exports.checkConnect = checkConnect;
module.exports.getConfig    = getConfig;
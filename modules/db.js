//var config    = require('../config.js');
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

/*
  how to use:
    .query(req, query, params, function(error, results, fields) {}); - execute from current user
    .query(query, params, function(error, results, fields) {}); - execute from system user
*/
var query = function () {
    var callback;
    var req;
    var sql;
    var params = [];
    var configDb = {};
    var isSystemUser = false;

    if (typeof(arguments[0]) == 'object') {
        req = arguments[0];
    } else if (typeof(arguments[0]) == 'string') {
        isSystemUser = true;
        sql = arguments[0];
    }

    if (typeof(arguments[1]) == 'string')
        sql = arguments[1];

    if (!isSystemUser) {
        if (typeof(arguments[2]) == 'function') {
            callback = arguments[2];
        } else if (typeof(arguments[3]) == 'function') {
            callback = arguments[3];
            params = arguments[2];
        }
    } else {
        if (typeof(arguments[1]) == 'function') {
            callback = arguments[1];
        } else if (typeof(arguments[2]) == 'function') {
            callback = arguments[2];
            params = arguments[1];
        }
    }

    configDb = getConfig(req, isSystemUser);

    var connection = mysql.createConnection(configDb);

    connection.query(sql, params, function (err, rows, fields) {
        if (sql.toLowerCase().search('call ') === -1)
            callback(err, rows || [], fields || []);
        else
            if (!err && sql.toLowerCase().search('call get_userId') === -1)
                query(req, 'UPDATE config_need_update SET need_update = 1 WHERE id = 1', [], function (error, results) {
                    if (!error){
                        var io = require('../app').io;
                        io.sockets.emit('statusBtnApply', 1);
                    }
                    callback(err, rows || [], fields || []);
                });

    });

    connection.end();
};

/* TODO: need refactor and take out in other module (ex: common.js) */

var getSQL = function(p) {
  this.save_item = function() {
    //default values
    if (p.id === undefined) p.id = 0;
    if (p.parent_id === undefined) p.parent_id = 0;
    if (p.node === undefined) p.node = 'ALL';
    if (p.filename === undefined) p.filename = '';
    if (p.comment === undefined) p.comment = '';
    if (p.out_1 === undefined) p.out_1 = '@result';
    if (p.out_2 === undefined) p.out_2 = '@id_trunk';
    if (p.params === undefined) p.params = '';
    if (p.values === undefined) p.values = '';
    if (p.custom_type === undefined) p.custom_type = 0;
    if (p.commented === undefined) p.commented = 0;
    p.commented == 'yes' ? p.commented = 1 : p.commented = 0;
    //

    for(var key in p) {
        if(p.hasOwnProperty(key)) {
            if (typeof p[key] === 'string')
                if (!p[key].match(/^(@)/))
                    p[key] = "'" + p[key] + "'";
        }
    }
    return "call save_item(" + [p.id, p.parent_id, p.itemtype, p.filename, p.name, p.comment, p.node, p.custom_type, p.commented, p.params, p.values, p.out_1, p.out_2].join(',') + ");"; 
  }
}

/* TODO: deprecated function, but many routes/data/* using it */

var database = function(req, res, sysuser) {
  this.success = false;
  
  var user;
  var password;
  
  if (sysuser) {
    user      = sysuser.user ? sysuser.user : config.db.user;
    password  = sysuser.password ? sysuser.password : config.db.password;
  } else {
    user      = req.session.dbuser;
    password  = req.session.password;
  }

  if (user !== undefined && password !== undefined) {
    this.success = true;
    var conf = {};
    
    conf.user       = user;
    conf.password   = password;
    conf.host       = config.db.host;
    conf.database   = config.db.database;
    conf.port       = config.db.port;
    conf.multipleStatements = true; //Multiple statement queries
    
    if (!this.connect) {
      this.connect = mysql.createConnection(conf);
    }

    this.connect.connect(function(err) {
      // connected! (unless `err` is set)
    });
  } else this.connect = false;
  
  this.destroy = function() {
    if (this.connect)
      this.connect.destroy();
  }
}

/* */

module.exports.query        = query;
module.exports.checkConnect = checkConnect;
module.exports.getConfig    = getConfig;

module.exports.getSQL       = getSQL;
module.exports.database     = database;
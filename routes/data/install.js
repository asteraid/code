exports.create = function (req, res) {
    //--- common functions
    
    function changeDbPassword(user, password, callback) {
        query = 'UPDATE `mysql`.`user` SET `password` = PASSWORD("' + password + '") WHERE User="' + user + '"; FLUSH PRIVILEGES;';
        connection.query(query, function(err, results, fields) {
            if (err) connection.destroy();
            callback(err);
        });
    }
    
    function updateConfigEtc(password, callback) {
        var fs          = require('fs')
        var configFile  = '/etc/odbc.ini';
        var encoding    = 'utf8';

        fs.readFile(configFile, encoding, function (err, data) {
            if (err) callback(err);
            else {
                var data = data.replace(/PASSWORD.*\n/g, 'PASSWORD    = ' + password + '\n');
                fs.writeFile(configFile, data, encoding, function (err) {
                    callback(err);
                });
            }
        });
    }
    
    function checkDbCreate(callback) {
        query = 'SHOW DATABASES';
        connection.query(query, function(err, results, fields) {
            if(!err) {
                var match = checkDbSame(results, [db_config, db_cdr]);
                if(match.length && !overwrite) {
                    err = {fatal: true, match: true, code: '', message: 'Already exists databases: <strong>' + match.join(', ') + '</strong>. Overwrite them?'};
                    connection.destroy();
                }
            }

            callback(err);
        });
    };
    
    function createDb(db_name, filename, callback) {
        if(db_name && filename) {
            query = 'DROP DATABASE IF EXISTS `' + db_name + '`; CREATE DATABASE `' + db_name + '`;';
            connection.query(query, function(err, results, fields) {
                if(!err) {
                    var exec = require('child_process').exec, child;

                    //file or path
                    if(filename.indexOf('/') > -1)
                        full_path = filename;
                    else {
                        var path = require('path');
                        full_path = path.dirname(require.main.filename) + '/dump/' + filename;
                    }
                    
                    cmd = getCmdImport(db_name, full_path, db_params);
                    child = exec(cmd, function(err, stdout, stderr) {
                        callback(stderr);
                    });
                } else callback(err);
            });
        }
    };
    //---

    var db_params   = {},
        overwrite   = (req.param('overwrite') && req.param('overwrite') == 1) ? true : false,
        step        = req.param('step');

    if(step && config.db && !config.db.databse) {
        switch(step) {
            case '1':
                var db_config       = req.param('db_config'),
                    db_cdr          = req.param('db_cdr'),
                    cmd             = '',
                    query           = '';

                db_params.host      = req.param('host');
                db_params.user      = req.param('user');
                db_params.password  = req.param('password');
                db_params.multipleStatements = true;
                
                var connection = mysql.createConnection(db_params);

                checkDbCreate(function(err) {
                    if(!err) {

                        createDb(db_config, 'conf.sql', function(err) {
                            if (err) res.json({success: false, message: err.code});
                            else {
                            
                                createDb(db_cdr, 'a_cdr.sql', function(err) {
                                    if (err) res.json({success: false, message: err.code});
                                    else {
                                        var config_params = {};
                                            config_params.db_host           = db_params.host;
                                            config_params.db_user           = db_params.user;
                                            config_params.db_password       = req.param('password_new') || req.param('password');
                                            config_params.db_name_config    = db_config;
                                            config_params.db_name_cdr       = db_cdr;

                                        changeDbPassword(config_params.db_user, config_params.db_password, function(err) {
                                            if (err) res.json({success: false, message: err.message});
                                            else {
                                                
                                                updateConfigEtc(config_params.db_password, function(err) {
                                                    if (err) res.json({success: false, message: err.message});
                                                    else {
                                                        if (generateConfig(config_params)) {
                                                            execAsteriskStart(function(err) {
                                                                if (!err)
                                                                    res.json({success: true});
                                                                else
                                                                    res.json({success: false, message: 'Error asterisk start'});
                                                            });
                                                        } else
                                                            res.json({success: false, message: 'Error generate config'});
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    } else {
                        if (err.match) res.json(err);
                        else res.json({success: false, message: err.message});
                    }
                });
                
            break;
            
            case '2':
                var login = req.param('login'), password = req.param('password'), query = '';
                var connection = mysql.createConnection(config.db);
                query = 'INSERT INTO `' + config.db.database + '`.`users` SET `id` = 1, `login` = "' + login + '", `password` = md5("' + password + '"), `user_type_id` = 1';
                connection.query(query, function(err, results, fields) {
                    if(!err) res.json({success: true});
                    else res.json({success: false, message: 'Error'});
                    connection.destroy();
                });
            break;
            
            case 'import':
                var db_config           = req.param('db_config');

                    db_params.host      = req.param('host');
                    db_params.user      = req.param('user');
                    db_params.password  = req.param('password');
                    db_params.multipleStatements = true;

                var connection = mysql.createConnection(db_params);
                checkDbCreate(function(err) {
                    if(!err) {
                        if(req.files && req.files.file_config) {
                            var fs = require('fs');
                            //read 30 bytes
                            var stream = fs.createReadStream(req.files.file_config.path, {start: 0, end: 30});
                            
                            stream.on('data', function(data) {
                                var version = 'db_version=' + config.db.version;
                                data = data.toString();

                                //check dump version and version in config
                                if(data.indexOf(version) > -1) {
                                    createDb(db_config, req.files.file_config.path, function(err) {
                                        if (!err) {
                                            var config_params = {};
                                                config_params.db_host           = db_params.host;
                                                config_params.db_user           = db_params.user;
                                                config_params.db_password       = db_params.password;
                                                config_params.db_name_config    = db_config;
                                                
                                            if (generateConfig(config_params))
                                                res.json({success: true});
                                            else
                                                res.json({success: false, message: 'Error generate config'});
                                                
                                            connection.destroy();
                                        } else res.json({success: false, message: err});
                                    });
                                } else res.json({success: false, message: 'Invalid dump file version'});                                
                            });
                        } else {res.json({success: false, message: 'Not found dump file'});}
                    } else {
                        if(err.match) res.json(err);
                        else res.json({success: false, message: err.message});
                    }
                });
            break;
        }
    } else res.json({success: false, message: 'Error'});
};

function checkDbSame(data, compare) {
    var match   = [],
        current = '';

    for(var i = 0; i < data.length; i++) {
        current = data[i].Database;
        if(current == compare[0] || current == compare[1])
            match.push(current);
    }

    return match;
}

/*function generateConfig(params) {
    var mod_config = require('../../modules/config/main.js');

    if(mod_config.generate(params)) {
        //reload config.js
        delete require.cache[require.resolve('../../config.js')];
        config = require('../../config.js');
        return true;
    } else return false;
}*/

function generateConfig(params) {
  var moduleConfig  = require('../../modules/config/main');
  var converter     = require('../../modules/config/converter');
  
  if(moduleConfig.generate(params)) {
    //reload config.js
    //delete require.cache[require.resolve('../../config.js')];
    //config = require('../../config.js');
    global.config = converter.mergeJSConfigs();
    return true;
  } else return false;
}

function getCmdImport(target_db, full_path, db_params) {
    var password = (db_params.password === '' || db_params.password === undefined) ? '' : ' -p' + db_params.password;
    var cmd = 'mysql -u' + db_params.user + password + ' -h' + db_params.host + ' -D' + target_db + ' < ' + full_path;
    return cmd;
}

function execAsteriskStart(callback) {
    /*var exec    = require('child_process').exec, child;
    var cmd     = 'service asterisk start';

    child = exec(cmd, function(err, stdout, stderr) {
        callback(stderr);
    });*/
    callback(null);
}
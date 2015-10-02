var mysql   = require('mysql');
var logger  = require('../modules/logger');

function doAuthentification(req, res, callback) {

    var db = mysql.createConnection(config.db);
    db.connect();

    var ip    = req.ip,
        sid   = req.sessionID,
        paramToken  = req.param('token'),
        user='';

    var query = "CALL get_userIdByToken('"+paramToken+"', @res, @userId)";
    db.query(query, function (err,results,fields) {
        var query = "select @res as res,@userId as user_id";
        db.query( query, function (err,results,fields){
            if(results[0].res) {
                var dbuser  = config.db.user;
                var user_id = results[0].user_id;
                var conf    = {};

                conf.user = dbuser;
                conf.password = config.db.password;
                conf.host = config.db.host;
                conf.database = config.db.database;
                conf.port = config.db.port;

                var query = 'SELECT login FROM users WHERE id = ' + user_id;
                db.query( query, function (err,results,fields){
                    user = results[0].login;

                    //get user modules
                    var query = "SELECT us.module_id, m.href FROM user_settings us JOIN modules m ON m.id = us.module_id WHERE user_id = " + user_id + " AND us.module = 'menu'";
                    db.query( query, function (err, user_modules, fields){
                        //Get user type
                        var query = "SELECT user_type_id FROM users WHERE id = " + user_id;
                        db.query(query, function(err, results, fields){

                            if(!err){

                                var user_type_id = results[0]['user_type_id'];

                                req.session.user = user;
                                req.session.user_id = user_id;
                                req.session.user_type_id = user_type_id;
                                req.session.dbuser = dbuser;
                                req.session.password = conf.password;
                                req.session.user_modules = user_modules;
                                req.session.token = paramToken;

                                logger.login(req, {user: user, success: true});
                                callback( {success: true,
                                    data: { user: user, sid: sid }
                                });
                            }
                            else {
                                logger.login(req, {user: user, success: false});
                                callback({success: false, message: err});
                            }
                            db.destroy();
                        })

                    });
                });
            }
            else
            {
                logger.login(req, {user: user, success: false});
                callback({success: false, mess: '' });
            }
        });
    });
};

function controllerAvaliable(req, moduleHref){

    var result = false;
    for(var iCounter in req.session.user_modules){
        if(req.session.user_modules[iCounter].href === moduleHref){
            result = true;
            break;
        }
    }
    return result;

};

exports.index = function(req, res) {

    var fs          = require('fs'),
        path        = require('path'),
        baseDir     = path.dirname(require.main.filename),
        urlParts    = req.path.split('/').slice(2),
        controller  = (urlParts.length > 0) ? urlParts[0] : 'index',
        action      = (urlParts.length > 1) ? urlParts[1] : 'index',
        token       = req.param('token'),
        db          = mysql.createConnection(config.db),
        sQuery      = 'SELECT IF(begin_date > NOW(), 1, IF((end_date + INTERVAL 1 DAY) < NOW() , 2, IF(active = 0, 3, 0))) AS tokenErrCode, IF(begin_date > NOW(), "Token not active yet", IF((end_date + INTERVAL 1 DAY) < NOW() , "Token expired", IF(active = 0, "Token not active", "Ok"))) AS tokenErrText FROM user_tokens WHERE token = "' + token + '"';

    if (action == '')
        action = 'index';

    fs.existsSync = fs.existsSync || path.existsSync;
    if (!fs.existsSync(path.join(baseDir + '/routes/api/' + controller + '.js'))){

        res.send(404);
        return;

    }

    var apiController = require(path.join(baseDir + '/routes/api/' + controller));
    if (controller === 'index' && action === 'index'){
        apiController[action](req, res);
        return;
    }

    if (!token){
        res.json({succes: false, message:'Token is not detected.'});
        return;
    }

    db.connect();
    db.query(sQuery, function(err, results, fields) {
        if (!err) {
            if (results.length){
                if(!results[0].tokenErrCode == 0){
                    db.destroy();
                    res.json({succes: false, message: results[0].tokenErrText});
                } else {
                    db.destroy();
                    if (!req.session.user || !req.session.token === token){
                        doAuthentification(req, res, function(result) {
                            if(result.success)
                                if(req.session.user_type_id === 1 || controllerAvaliable(req, apiController.moduleHref))
                                    apiController[action](req, res);
                                else
                                    res.json({succes: false, message:'You are not allowed to work with this module.'});
                            else
                                res.json(result);
                        });
                    } else {
                        if(req.session.user_type_id === 1 || controllerAvaliable(req, apiController.moduleHref))
                            apiController[action](req, res);
                        else
                            res.json({succes: false, message:'You are not allowed to work with this module.'});
                    }
                }
            } else {
                db.destroy();
                res.json({succes: false, message:'Token not registered'});
            }
        } else {
            db.destroy();
            res.json({succes: false, message: err});
        };
    });
};

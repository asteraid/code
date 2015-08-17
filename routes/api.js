
var logger = require('../modules/logger');

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

exports.index = function(req, res) {

    var fs          = require('fs'),
        path        = require('path'),
        baseDir     = path.dirname(require.main.filename),
        urlParts    = req.path.split('/').slice(1),
        controller  = (urlParts.length > 2) ? urlParts[1] : 'index',
        action      = (urlParts.length > 3) ? urlParts[2] : 'index',
        token       = req.param('token');

    fs.existsSync = fs.existsSync || path.existsSync;
    if(!fs.existsSync(path.join(baseDir + '/routes/api/' + controller + '.js'))) {

        res.send(404);
        return;

    }
    if (!token){
        res.send(403);
        return;
    }

    var apiController = require(path.join(baseDir + '/routes/api/' + controller));
    if (!req.session.user || !req.session.token === token){
        doAuthentification(req, res, function(result) {
            if(result.success)
                apiController[action](req, res);
            else
                res.json(result);
        });
    } else {
        apiController[action](req, res);
    }
};

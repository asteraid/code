
var logger = require('../../modules/logger');
var db = require('../../modules/db');

exports.login = function (req, res) {
    var query;
    var ip = req.ip;
    var sid = req.sessionID;
    var params = {
        user: req.param('user'),
        pass: req.param('pass')
    };

    query = [
        'CALL get_userId(?, ?, @res, @userId)',
        'SELECT @res AS res, @userId AS user_id'
    ].join(';');

    db.query(query, [params.user, params.pass], function (err, results, fields) {
        if (results[1] && results[1][0] && results[1][0].res) {
            var user_id = results[1][0].user_id;

            //get user modules
            query = [
                'SELECT us.module_id, m.href',
                'FROM user_settings us',
                'JOIN modules m ON m.id = us.module_id',
                'WHERE user_id = ? AND us.module = ?'
            ].join(' ');

            db.query(query, [user_id, 'menu'], function (err, user_modules, fields) {
                //Get user type
                query = 'SELECT user_type_id FROM users WHERE id = ?';
                db.query(query, [user_id], function (err, results, fields) {
                    if (!err) {
                        var user_type_id = results[0]['user_type_id'];
                        req.session.user = params.user;
                        req.session.user_id = user_id;
                        req.session.user_type_id = user_type_id;
                        req.session.dbuser = config.db.user;
                        req.session.password = config.db.password;
                        req.session.user_modules = user_modules;

                        logger.login(req, {user: params.user, success: true});
                        res.jsonp({
                            success: true,
                            data: {
                                user: params.user,
                                sid: sid
                            }
                        });
                    } else {
                        logger.login(req, {user: params.user, success: false});
                        res.jsonp({success: false, message: err});
                    }
                });
            });
        } else {
            logger.login(req, {user: params.user, success: false});
            res.jsonp({success: false, mess: ''});
        }
    });
};

// Close session
exports.logout = function (req, res) {

    if (req.session.user) {

        var user = req.session.user;

        //destroy session
        req.session.destroy(function () {});
        logger.logout(req, {user: user});
        res.redirect('/auth');

    } else
        res.redirect('/auth');

};
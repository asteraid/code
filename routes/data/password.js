exports.check_password = function(req, res) {
    //check_password();
    var password = req.param('password_o');
    var user_id = req.session.user_id;
    var db = new database(req, res);
    if(db.connect) {
        var query = 'SELECT * FROM `users` WHERE `id`= ' + user_id + ' AND `password` = md5("' + password + '")';
        db.connect.query(query, function(err, results, fields) {
            if(!err && results.length == 1) {
                res.json(true);
                db.destroy();
            } else
                res.json('Wrong password');
                db.destroy();
            }
        );
    } else res.json(false);
}

exports.save_password = function(req, res) {
    var password_o = req.param('password_o'),
        password_n1 = req.param('password_n1'),
        user_id = req.session.user_id;

    var db = new database(req, res);
    if(db.connect) {
        var query = 'UPDATE `users` SET `password` = md5("' + password_n1 + '") WHERE `id` = ' + user_id + ' AND `password` = md5("' + password_o + '")';
        db.connect.query(query, function(err, results, fields) {
            if(!err) {
                res.json({success: true, message: 'Password changed successfully'});
                db.destroy();
            } else
                res.json({success: false, message: 'Password isn\'t changed'});
                db.destroy();
            }
        );
    } else res.json({success: false, message: 'Error session'});
}

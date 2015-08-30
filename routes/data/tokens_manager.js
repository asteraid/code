
var db = require('../../modules/db');

exports.listAllTokens = function(req, res) {

    var paramUserId = req.param('id')
        sQuery = 'SELECT id, token, DATE_FORMAT(end_date, "%d.%m.%Y") AS end_date, active, CASE active WHEN 0 THEN "No"  ELSE "Yes"  END AS vActive FROM vUserTokens WHERE user_id = ' + paramUserId;

    db.query(req, 'SHOW TABLES LIKE "user_tokens"', function(err, results) {
        if (err) {
            res.json({success: false, rows: [], message: err.message});
            return;
        }

        if (results.length)
            db.query(req, sQuery, function(err, results) {
                if (err) {
                    res.json({success: false, rows: [], message: err.message });
                    return;
                }

                if (results.length)
                    res.json({success: true, rows: results, message: ''});
                else
                    res.json({success: false, rows: [], message: 'The are no tokens registered!'});
            });
        else
            db.query(req, 'CREATE TABLE user_tokens (id int(11) UNSIGNED NOT NULL AUTO_INCREMENT, ' +
                'user_id int(11) NOT NULL,  token varchar(36) NOT NULL,  begin_date datetime NOT NULL, ' +
                'end_date datetime DEFAULT NULL,  active tinyint(1) NOT NULL,  comment text DEFAULT NULL, ' +
                'PRIMARY KEY (id))  ENGINE = INNODB  AUTO_INCREMENT = 1  CHARACTER SET utf8  COLLATE utf8_general_ci;', function(err, results) {

                if(!err)
                    db.query(req, 'CREATE PROCEDURE get_userIdByToken(IN token VARCHAR(36), OUT result TINYINT, OUT userId INT) ' +
                        'SQL SECURITY INVOKER BEGIN DECLARE EXIT HANDLER FOR SQLEXCEPTION SET result = FALSE; ' +
                        'SELECT user_id FROM user_tokens WHERE user_tokens.token = token INTO userId; ' +
                        'IF userId > 0 THEN SET result = TRUE; ELSE SET result = FALSE; END IF; END', function(err, results) {

                        if(!err)
                            db.query(req, 'CREATE VIEW vUserTokens AS SELECT `ut`.`id` AS `id`, `ut`.`user_id` AS `user_id`, ' +
                                '`u`.`login` AS `login`, `ut`.`token` AS `token`, `ut`.`begin_date` AS `begin_date`, ' +
                                '`ut`.`end_date` AS `end_date`, `ut`.`active` AS `active`, `ut`.`comment` AS `comment` ' +
                                'FROM (`user_tokens` `ut` JOIN `users` `u` ON ((`ut`.`user_id` = `u`.`id`)));', function(err, results) {

                                if(!err)
                                    db.query(req, sQuery, function(err, results) {
                                        if (err) {
                                            res.json({success: false, rows: [], message: err.message });
                                            return;
                                        }

                                        if (results.length)
                                            res.json({success: true, rows: results, message: ''});
                                        else
                                            res.json({success: false, rows: [], message: 'The are no tokens registered!'});
                                    });
                                else
                                    res.json({success: false, message: err.message});
                            });
                        else
                            res.json({success: false, message: err.message});
                    });
                else
                    res.json({success: false, message: err.message});
            });
    });
};

exports.getToken = function(req, res) {

    var paramId = req.param('id'),
        sQuery = 'SELECT id, user_id, token, DATE_FORMAT(begin_date, "%d.%m.%Y") AS begin_date, DATE_FORMAT(end_date, "%d.%m.%Y") AS end_date, active, comment FROM vUserTokens WHERE id = ' + paramId;

    db.query(req, sQuery, function(err, results) {
        if (err) {
            res.json({success: false, rows: [], message: err.message});
            return;
        }

        if (results.length)
            res.json({success: true, rows: results, message: ''});
        else
            res.json({success: false, rows: [], message: 'Token with ID #' + paramId + ' not finded!'});
    });

};

exports.saveToken = function(req, res) {

    var paramId = req.param('id'),
        paramUserId = req.param('user_id'),
        paramToken = req.param('token'),
        paramBeginDate = req.param('begin_date'),
        paramEndDate = req.param('end_date'),
        paramActive = req.param('active'),
        paramComment = req.param('comment'),
        sQuery = '';

    if(paramId == '0'){
        sQuery = 'INSERT INTO user_tokens(user_id, token, begin_date, end_date, active, comment)' +
            ' VALUES (' + paramUserId + ', "' + paramToken + '", STR_TO_DATE("' + paramBeginDate + '", "%d.%m.%Y"), STR_TO_DATE("' + paramEndDate + '", "%d.%m.%Y"), ' + paramActive + ', "' + paramComment + '")';
    } else {
        sQuery = 'UPDATE user_tokens SET user_id = ' + paramUserId + ', token = "' + paramToken + '", begin_date = STR_TO_DATE("' + paramBeginDate + '", "%d.%m.%Y"), end_date = STR_TO_DATE("' + paramEndDate + '", "%d.%m.%Y"), active = ' + paramActive + ', comment = "' + paramComment + '" WHERE id = ' + paramId;
    }

    db.query(req, sQuery, function(err, results) {
        if(!err)
            if(paramId == '0')
                res.json({success: true, insertId: results.insertId});
            else
                res.json({success: true, insertId: paramId});
        else
            res.json({success: false, message: err.message});
    });

};

exports.deleteToken = function(req, res) {

    var paramId = req.param('id'),
        sQuery = 'DELETE FROM user_tokens WHERE id = ' + paramId;

    db.query(req, sQuery, function(err, results) {
        if(!err)
            res.json({success: true, message: 'Token ID #' + paramId + ' successfuly deleted!'});
        else
            res.json({success: false, message: err.message});
    });

};

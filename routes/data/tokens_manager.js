
var db = require('../../modules/db');

exports.listAllUsers = function(req, res) {

    var sQuery = 'SELECT id, login as name FROM users';

    db.query(req, sQuery, function(error, results) {
        if (error) {
            res.json({success: false, rows: [], message: error.code });
            return;
        }

        if (results.length)
            res.json({success: true, rows: results, message: ''});
        else
            res.json({success: false, rows: [], message: 'The are no users registered!'});
    });

};

exports.listAllTokens = function(req, res) {

    var sQuery = 'SELECT id, user, token, DATE_FORMAT(end_date, "%d.%m.%Y") AS end_date, active, CASE active WHEN 0 THEN "No"  ELSE "Yes"  END AS vActive FROM vUserTokens';

    db.query(req, sQuery, function(error, results) {
        if (error) {
            res.json({success: false, rows: [], message: error.code });
            return;
        }

        if (results.length)
            res.json({success: true, rows: results, message: ''});
        else
            res.json({success: false, rows: [], message: 'The are no tokens registered!'});
    });

};

exports.getToken = function(req, res) {

    var paramId = req.param('id'),
        sQuery = 'SELECT id, user_id, token, DATE_FORMAT(begin_date, "%d.%m.%Y") AS begin_date, DATE_FORMAT(end_date, "%d.%m.%Y") AS end_date, active, comment FROM vUserTokens WHERE id = ' + paramId;

    db.query(req, sQuery, function(error, results) {
        if (error) {
            res.json({success: false, rows: [], message: error.code});
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
            res.json({success: false, message: 'Token ID #' + paramId + ' not deleted!'});
    });

};

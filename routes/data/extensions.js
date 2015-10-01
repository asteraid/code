var db = require('../../modules/db');

exports.list = function(req, res) {
  var query = "SELECT `extension`, `ext`, `name`, `extid`, `company`, `template`, `disabled`, `context` FROM `vExtensions`";

  db.query(req, query, function(err, results, fields) {
    if (err) {
      res.json({success: false, message: err.code, rows: []});
      return;
    }
      
    if (results.length > 0)
      res.json({success: true, rows: results, results: results.length});
    else
      res.json({success: false, rows: [], message: 'Not found extensions'});           
  });
}

exports.save_group = function(req, res) {
  var ids       = req.param('ids') ? req.param('ids').split(',') : [];
  var template  = req.param('template');
  var context   = req.param('context');
  var query     = [];
  
  if (ids.length > 0) {
    query.push('START TRANSACTION;');
    
    ids.forEach(function(id) {  
      query.push([
        [
          'UPDATE',
            '`config`',
          'SET',
            '`var_val`', '=', ['"', context, '"'].join(''),
          'WHERE',
            '`item_id`', '=', id,
            'AND',
            '`var_name`', '=', '"context"'
        ].join(' '),
        ';',
        ['DELETE FROM `config_relations` WHERE `item_id` = ', id].join(''),
        ';',
        ['INSERT INTO `config_relations` (`item_id`, `parent_id`) VALUES ', '(', id, ',', template, ')'].join(''),
        ';'
      ].join(''));
    });
    
    query.push('COMMIT;');

    db.query(req, query.join(''), function(error, results) {
      if (error) {
        res.json({success: false, message: error.code});
        return;
      }
      
      res.json({success: true});
    });
  } else
    res.json({success: false, message: 'Data error'});
}

exports.save_ext = function(req, res) {
  var query   = '';
  var params  = {};
  params.ext          = req.param('ext');
  params.ext_name     = req.param('ext_name');
  params.secret       = req.param('secret');
  params.ext_template = req.param('ext_template');
  params.context      = req.param('context');
  params.id_ext       = req.param('id_ext') || 0;
            
  if (params.id_ext == 0) {
    var query = "SELECT `ext` FROM `vExtensions` WHERE `ext` = '" + params.ext + "'";
    
    db.query(req, query, function(error, results) {
      if (error) {
        res.json({success: false, message: error.code});
        return;
      }
      
      if (results.length == 0) {
        saveItem(function(error, object) {
          res.json(object);
        });
      } else res.json({success: false, message: "Number " + params.ext + " already exists!" });
    });
  } else {
    saveItem(function(error, object) {
      res.json(object);
    });
  }

  function saveItem(callback) {
    db.query(req, getSqlCreate() + ' SELECT @result, @id_item;', function(error, results) {
      if (!error) {
        var out = results[1][0];
        if (out['@result']) {
          callback(null, {success: true, id: out['@id_item'] , message: "Internal Number " + params.ext + " saved success!"});
        } else
          callback(1, {success: false, message: "Internal Number isn't saved"})
      } else callback(2, {success: false, message: error.code});
    });
  }
  
  function getSqlCreate() {
    return sql = new getSQL({
        id        : params.id_ext,
        parent_id : params.ext_template,
        itemtype  : "ext",
        filename  : "sip.conf",
        name      : params.ext,
        comment   : params.ext_name,
        params    : "secret;callerid;context",
        values    : params.secret + ';' + params.ext_name + ' <' + params.ext + '>' + ';' + params.context,
        out_2     : '@id_item'
    }).save_item();
  }
}

exports.load_ext = function (req, res) {
  var id = req.param('id');
  var query = "SELECT extension, ext, name as ext_name, extid as id_ext, template_id as ext_template, secret from vExtensions WHERE extid = ?";
        
  db.query(req, query, [id], function(err, results, fields) {
    if (err) {
      res.json({success: false, message: err.code});
      return;
    }
    
    if (results.length>0) {
      var data = results[0];
      query = "SELECT var_val from config WHERE var_name = 'context' and item_id = ? limit 1";
      
      db.query(req, query, id, function(err, results, fields) {
        if (err) {
          res.json({success: false, message: err.code});
          return;
        }

        if (results.length > 0)
          data.context = results[0].var_val;
        else
          data.context = '';

        res.json({success: true, data: data});
      });
    } else
      res.json({success: false, message: 'Not found ext'});
  });
}

exports.delete = function (req, res) {
  var ids  = req.param('id') || [];
  var query = [];
    
  if (ids.length > 0) {
    query.push('START TRANSACTION;');

    ids.forEach(function(id) {
      query.push('CALL delete_item(' + id + ', @result);');
    });

    query.push('COMMIT;');
    
    db.query(req, query.join(''), function(err, results) {
      if (err) {
        res.json({success: false, message: err.code});
        return;
      }

      res.json({success: true, message: "Deleted success!"});
    }); 
  } else
    res.json({success: false, message: 'Data error'});
}
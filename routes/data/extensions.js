exports.list = function (req, res) {
    var db = new database(req, res);
    if(db.connect) {
        var query = "SELECT `extension`, `ext`, `name`, `extid`, `company`, `template`, `disabled`, `context` FROM `vExtensions`";
        db.connect.query(query, function(err, results, fields) {
            if(!err) {
                if (results.length>0) {
                    res.json({success: true, rows: results, results: results.length});
                    db.destroy();
                } else {
                    res.json({success: false, rows: [], message: 'Not found extensions'});
                    db.destroy();
                }
            } else res.json({success: false, rows: [], message: err.code });
        });
    } else res.json({ success: false, rows: [], message: 'Error sessions'});
};

exports.save_group = function(req, res) {
  var ids       = req.param('ids') ? req.param('ids').split(',') : [];
  var template  = req.param('template');
  var context   = req.param('context');
  var query = [];
  
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
    console.log(query);
    var db = new database(req, res);
    if (db.connect) {
      db.connect.query(query.join(''), function (error, results) {
        if (!error) {
          res.json({success: true});
          db.destroy();
        } else
          res.json({success: false, message: error.code});
      });
    } else
      res.json({success: false, message: 'Error session'});
  } else res.json({success: false, message: 'Data error'});
}

exports.save_ext = function(req, res) {
  var db = require('../../modules/db');
  
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
      if (!error) {
        if (results.length == 0) {
          saveItem(function(error, object) {
            res.json(object);
          });
        } else res.json({success: false, message: "Number " + params.ext + " already exists!" });
      } else res.json({success: false, message: error.code });
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
/*exports.save_ext = function (req, res) {
    var db = new database(req, res);
    if(db.connect) {
        var ext = req.param('ext'),
            ext_name = req.param('ext_name'),
            secret = req.param('secret'),
            ext_template = req.param('ext_template'),
            context = req.param('context'),
            action = req.param('action'),
            id_ext = req.param('id_ext');

        if(id_ext === undefined)
            id_ext = 0;
   
        if (id_ext == 0) {
            // проверяем есть ли такой номер у клиента
            var query = "select ext from vExtensions where ext = '"+ext+"'";
            db.connect.query(query,function(err, results, fields) {
                if(!err) {
                    if(results.length == 0) {
                    // create_ext
                        var sql = new getSQL({
                            id: id_ext,
                            parent_id: ext_template,
                            itemtype: "ext",
                            filename: "sip.conf",
                            name: ext,
                            comment: ext_name,
                            params: "secret;callerid;context",
                            values: secret + ';' + ext_name + ' <' + ext + '>' + ';' + context,
                            out_2: '@id_item'
                        });

                        var query = sql.save_item();
                        console.log(query);
                        db.connect.query(query, function(err, results, fields) {
                          //console.log('results1=>', results);
                            if (!err) {
                                db.connect.query("SELECT @result, @id_item", function(err, results, fields) {
                                    var result = results[0]['@result'];
                                    var itemId = results[0]['@id_item'];
                                    //console.info('resuts2=>', results);
                                    if(result) {
                                        res.json({success: true, id: itemId , message: "Internal Number "+ext+" saved success!"});
                                        db.destroy();
                                    } else {
                                        res.json( {success: false,  results: result, message: "Internal Number isn't saved" });
                                        db.destroy();
                                    }
                                });
                            } else res.json({success: false, message: err.code});
                        });            
                    // end create_ext
                    } else {
                        res.json({success: false, message: "Number "+ext+" already exists!" });
                        db.destroy();
                    }
                } else res.json({success: false, message: err.code });
            });
        } else {
            // save_ext
                var sql = new getSQL({
                    id: id_ext,
                    parent_id: ext_template,
                    itemtype: "ext",
                    filename: "sip.conf",
                    name: ext,
                    comment: ext_name,
                    params: "secret;callerid;context",
                    values: secret + ';' + ext_name + ' <' + ext + '>' + ';' + context
                });

                var query = sql.save_item();

                db.connect.query(query, function(err, results, fields) {
                    if(!err) {
                        db.connect.query("SELECT @result", function(err, results, fields) {
                            var result = results[0]['@result'];
                            if(result) {
                                res.json( {success: true,  results: result , message: "Internal Number "+ext+" saved success!" });
                                db.destroy();
                            } else {
                                res.json( {success: false,  results: result, message: "Internal Number isn't saved!" });
                                db.destroy();
                            }
                        });
                    } else res.json({success: false, message: err.code });
                });
             // end save_ext
        }
    } else res.json({ success: false, message: 'Error sessions'});
};*/

exports.load_ext = function (req, res) {
    var db = new database(req, res);
    if(db.connect) {
        var id = req.param('id');
        var query = "SELECT extension, ext, name as ext_name, extid as id_ext, template_id as ext_template, secret from vExtensions WHERE extid='"+id+"'";
        db.connect.query(query, function(err, results, fields) {
            if(!err) {
                if(results.length>0) {
                    var data = results[0];
                    db.connect.query("select var_val from config where var_name = 'context' and item_id = ? limit 1",
                        id, function(err, results, fields) {
                            if(!err) {
                                if ( results.length > 0 ) {
                                    data.context = results[0].var_val;
                                } else {
                                    data.context = '';
                                }
                                res.json({success: true, data: data});
                                db.destroy();
                            } else {
                                res.json({success: false, message: 'Not found ext'});
                                db.destroy();
                            }
                    });
                } else {
                    res.json( {success: false, message: 'Not found ext'});
                    db.destroy();
                }
            } else res.json({success: false, message: err.code });
        });
    } else res.json({ success: false, message: 'Error sesisons'});
};

exports.delete = function (req, res) {
  var db = new database(req, res);
  if (db.connect) {
    var ids  = req.param('id') || [];
    //var ext = req.param('ext');
    
    var query = [];
    
    if (ids.length > 0) {
      query.push('START TRANSACTION;');

      ids.forEach(function(id) {
        query.push('CALL delete_item(' + id + ', @result);');
      });
    
      query.push('COMMIT;');
      
      db.connect.query(query.join(''), function(err, results) {
        if (!err)
          res.json({success: true, message: "Deleted success!"});
        else
          res.json({success: false, message: err.code});
        db.destroy();
      }); 
    } else res.json({success: false, message: 'Data error'});
    
    

     // delete_ext
    /*var query = "call delete_item('"+id+"', @result);";
    db.connect.query(query, function (err, results, fields) {
      if (!err) {
        db.connect.query("SELECT @result", function(err, results, fields) {
            var result = results[0]['@result'];
            if(result) {
                res.json( {success: true,  results: result , message: "Internal Number "+ext+" deleted success!" });
                db.destroy();
            } else {
                res.json( {success: false,  results: result, message: "Internal Number not deleted!" });  
                db.destroy();
            }
        });
      } else res.json({success: false, message: err.code });
    });*/
    // end delete_ext
  } else res.json({success: false, message: 'Error sessions'});
};

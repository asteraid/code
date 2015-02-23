/**
 * Набор методов для работы с классами модулей callflow
 * 
 */

exports.get_module_class = function(req, res){
    var db = new database(req, res),
        query;
    if(db.connect) {
        query = "select id, name, description, macro_name, abbr, iconCls, js_class_name, exten as exten_name from module_class where id > 1 order by name";
        db.connect.query(query, function(err, results, fields) {
           console.log(results);
           if(!err) {
                if (results.length>0) {
                    get_structure(err, results, 0, db.connect, function(err){
                        if (!err) {
                            res.json({success: true, rows: results, results: results.length});
                        } else {
                          console.log('err get structure',err);
                          res.json({success: false, rows: [], message: err.code });  
                        }
                        db.destroy();
                    });
                } else {
                    res.json({success: false, rows: [], message: 'Not found!'});
                    db.destroy();
                }
           }
           else {
               res.json({success: false, rows: [], message: err.code });
               db.destroy();
           }

         });

    } else {
      res.send(403, 'Error access');
    }
}

get_structure = function(err, rows, index, connect, callback) {
    if (!err) {
        if (index < rows.length) {
            query = "select id, field_name, field_type, seq, required, default_value, list_data_view, help_block " +
                    "from class_structure where id_class = ? order by seq";
            connect.query(query, rows[index].id, function(err, results, fields) {
                if (!err) {
                    rows[index].structure = results;
                }
                get_structure(err, rows, index+1, connect, callback);
            });
        } else {
            callback(err);
        }

    } else {
        callback(err);
    }
}


/**
 *  Возвращаем результат представления для полей select2
 */
exports.get_list_view = function(req, res){
    var db = new database(req, res),
        viewName = req.param('view_name');
    if(db.connect) {
        if (viewName) {
            db.connect.query("select * from " + viewName, function(err, results, fields) {
               console.log(results);
               if(!err) {
                   res.json({success: true, data: results, results: results.length});
               }
               else {
                   res.json({success: false, data: [], message: err.code });
               }
                   db.destroy();
             });
        } else {
            res.json({success: false, data: [], message: "Name View is Empty" });
            db.destroy();
        }

    } else {
      res.send(403, 'Error access');
    }
}
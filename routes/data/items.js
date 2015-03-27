exports.list = function (req, res) {
    var db = new database(req, res);
    if(db.connect) {
        var type = req.param('type');
        var id = req.param('id');
        var custom_type = req.param('custom_type') || '';
        var id_class = req.param('id_class');
			
            if(id == undefined) {
                if( custom_type != '' )
                    custom_type = " AND custom_type = '" + custom_type + "'";
                    
                if(type == 'context')
                    var query = "SELECT DISTINCT `id`, `type`, `name`, `metric`, `pattern`, `comment`, `readonly`, `visible` FROM vItems WHERE `type` = '" + type + "' AND `visible` = 1";
                else {
                    if (type == 'callflow')
                        var query = "SELECT DISTINCT `id`, `type`, `name`, `metric`, `pattern`, `comment`, `custom_type`, if(`commented` = 0, 'No', 'Yes') `commented` FROM vItems WHERE `id_class` = " + id_class + " AND `type` = '" + type + "' " + custom_type;
                    else
                        var query = "SELECT DISTINCT `id`, `type`, `name`, `metric`, `pattern`, `comment`, `custom_type`, if(`commented` = 0, 'No', 'Yes') `commented` FROM vItems WHERE `type` = '" + type + "' " + custom_type;
                }
            } else
                var query = "SELECT DISTINCT * FROM vItems WHERE parent_id = " + id + " AND `type` IS NOT NULL";
                // //var query = "SELECT A.id id, A.type type, A.name name, A.metric metric, A.pattern pattern, A.comment comment, B.order `order` FROM vItems A LEFT OUTER JOIN config_relations B ON (A.id = B.item_id) WHERE B.parent_id = " + id + " ORDER BY B.`order` ASC";
            db.connect.query(query, function(err, results, fields) {
               if(!err) {
                if (results.length>0)
                    res.json({success: true, rows: results, results: results.length});
                else
                    res.json({success: false, rows: [], message: 'Not found!'});
               }
               else
                   res.json({success: false, rows: [], message: err.code });
                db.destroy();
            });
   } else res.json({ success: false, rows: [], message: 'Error sessions'});
};

exports.list_category_config = function (req, res) {
    var db = new database(req, res);
    if(db.connect) {
        var filename = req.param('filename')
        
            var query = "SELECT DISTINCT category FROM vConfig WHERE filename = '" + filename + "' ORDER BY category";
                // //var query = "SELECT A.id id, A.type type, A.name name, A.metric metric, A.pattern pattern, A.comment comment, B.order `order` FROM vItems A LEFT OUTER JOIN config_relations B ON (A.id = B.item_id) WHERE B.parent_id = " + id + " ORDER BY B.`order` ASC";
            db.connect.query(query, function(err, results, fields) {
            console.log(results);
               if(!err) {
                if (results.length>0)
                    res.json({success: true, rows: results, results: results.length});
                else
                    res.json({success: false, rows: [], message: 'Not found!'});
               }
               else
                   res.json({success: false, rows: [], message: err.code });
                db.destroy();
            });
   } else res.json({ success: false, rows: [], message: 'Error sessions'});
};

exports.getparents = function(req, res) {
    var db = new database(req, res);
    if(db.connect) {
        var item_id = req.param('item_id');    
        var query = "SELECT DISTINCT `id`, `type`, `name`, `parent_id`, `parent_name` FROM vItems WHERE id IN(" + item_id + ")";
        db.connect.query(query, function(err, results, fields) {
            if(!err) {
                if(results.length>0)
                    res.json({success: true, rows: results, results: results.length});
                else
                    res.json({success: false, rows: [], message: 'Not found!'});
            } else res.json({success: false, rows: [], message: err.code });
            db.destroy();
        });
   } else res.json({ success: false, rows: [], message: 'Error sessions'});
};
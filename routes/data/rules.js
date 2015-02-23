exports.save = function (req, res) {
    var db = new database(req, res);
    if(db.connect) {
        var action = req.param('action'),
            id = req.param('id'),
            context_id = req.param('context_id') || 'NULL',
            name = req.param('name'),
            comment = req.param('comment'),
            mask = req.param('mask');

       //save
       var save_rule = function(){
           var query = "call save_rule("+id+",'"+name+"',"+context_id+",'"+comment+"','"+mask+"', @result, @id_rule);";
           console.log(query);
               db.connect.query(query, function (err, results, fields) {
                    if(!err) {
                        db.connect.query("SELECT @result, @id_rule", function (err, results, fields) {
                            var result = results[0]['@result'];
                            var id_rule = results[0]['@id_rule'];
                            if(result)
                                res.json( {success: true,  results: result , id_rule: id_rule, message: "Rule "+name+" saved success!"});
                            else
                                res.json( {success: false,  results: result, message: "Rule not saved!" });  
                        });
                    }
                    else res.json({success: false, message: err.code });
                   db.destroy;
                });
        }
        //end save
   
        if(action == 'create' || action == 'copy'){
            var query = "SELECT `name` FROM vItems WHERE `name` = '"+name+"' and type in ('rule','context')";
            db.connect.query(query,function(err, results, fields) {
                if(!err) {
                    if(results.length == 0) {
                        save_rule();
                    } else {
                        res.json({success: false, message: "Rule or Context "+name+" alredy exists!" });
                        db.destroy();
                    }
                } else res.json({success: false, message: err.code});
            });
        } else {save_rule();}
        //save_rule();
    } else res.json({ success: false, message: 'Error sessions'});
};

exports.load = function(req, res) {
    var db = new database(req, res);
    if(db.connect) {
        var id = req.param('id');
        var query = "SELECT * FROM vItemsConf WHERE item_id='"+id+"'";
        db.connect.query(query, function (err, results, fields) {
            if(!err) {
                if(results.length>0) {
                    var jsonObject = [];
                    results.forEach(function(item) {
                        var temp = {};
                        temp['name']         = item.name;
                        temp['value']        = item.value;
                        temp['param_name']   = item.param_name;
                        temp['param_value']  = item.param_value;
                        jsonObject.push(temp);
                    });

                    res.json( { success: true, data: jsonObject });
                } else res.json( {success: false, message: 'Not found rule'});
            } else res.json({success: false, message: err.code });
            db.destroy();
        });
   } else res.json({ success: false, message: 'Error sesisons'});
};

exports.is_included = function(req, res) {
    var db = new database(req, res);
    if(db.connect) {
        var id = req.param('rule_id');
        var query = "SELECT COUNT(*) `count` FROM `config_relations` WHERE item_id="+id;
        db.connect.query(query, function (err, results, fields) {
            if(!err) {
                if(results.length>0) {
                    res.json({success: true, count: results[0].count});
                } else res.json({success: false, message: 'Not found rule'});
            } else res.json({success: false, message: err.code});
            db.destroy();
        });
   } else res.json({success: false, message: 'Error sessions'});
};

exports.delete = function (req, res) {
    var db = new database(req, res);
    if(db.connect) {
        var item_id = req.param('item_id'),
            parent_id = req.param('parent_id'),
            name = req.param('name'),
            included = req.param('included');

        if(included == 1)
            var query = "call context_delete_included(" + item_id + ", " + parent_id + ", @result);";
        else
            // delete callflows and configs
            var query = "call delete_rule(" + item_id + ", @result);";
        db.connect.query(query, function (err, results, fields) {
            if(!err) {
                db.connect.query("SELECT @result", function (err, results, fields) {
                    if(!err) {
                        db.connect.query("SELECT @result", function (err, results, fields) {
                            var result = results[0]['@result'];console.info(result);
                            if(result) {
                                res.json( {success: true,  results: result , message: "Rule deleted success!" });
                                db.destroy();
                            } else {
                                res.json( {success: false,  results: result, message: "Rule not deleted!" });
                                db.destroy();
                            }
                        });
                    } else res.json({success: false, message: err.code });
                });
            } else {
                res.json({success: false, message: err.code });
                db.destroy();
            }
        });
    } else res.json({success: false, message: 'Error sessions'});
};

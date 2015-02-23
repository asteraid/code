exports.get_path = function (req, res) {
    var params_in = req.param('ids'),//.split('/'),
        params_out = [],
        type = req.param('type') === undefined ? 'contexts' : req.param('type');

	//определяем в url имя хоста и заменяем его на ''
	var regexp = /^(https|http):\/\/[a-zA-Z0-9:\.-]*\//;
	params_in = params_in.replace(regexp, '').split('/');

    var default_params = {contexts:{path: '/contexts', name: 'Contexts'}, rules:{path: '/rules', name: 'Rules'}};

    for(i = 0; i < params_in.length; i++) {
        temp = params_in[i];
        if(!isNaN(parseInt(temp)))
            params_out.push(temp);
    }

    params_out = params_out.join();

    var db = new database(req, res);
    if(db.connect) {
        var query = "SELECT DISTINCT id, name, comment FROM vItems WHERE id IN (" + params_out + ") ORDER BY Field(id, " + params_out + ")";
        db.connect.query(query, function (err, results, fields) {
            if(!err) {
                if(results.length > 0) {
                    //если больше 1 записи, то это контекст, т. к. рул запрашивается с 1 id
                    if(results.length > 1) type = 'contexts';

                    var path = default_params[type].path;
                    var jsonObject = [{id: 0, name: default_params[type].name, href: path}];
                    var temp = {};

                    results.forEach(function(item) {
                        temp = {};
                        path += '/' + item.id;
                        temp['id']      = item.id;
                        temp['name']    = item.name;
                        temp['href']    = path;
                        jsonObject.push(temp);
                    });
                    res.json({success: true, path: jsonObject});
                    db.destroy();
                } else {
                    res.json({success: true, path: jsonObject});
                    db.destroy();
                }
            } else res.json({success: false, rows: [], message: err.code });
        });
   } else res.json({ success: false, rows: [], message: 'Error sessions'});
};

exports.list = function (req, res) {
    var db = new database(req, res);
    if(db.connect) {
        var query = "SELECT DISTINCT `id`, `name`, `type`, `comment` FROM `vItems` WHERE (`type`='context' OR `type`='rule') AND `visible` = 1 ORDER BY `name` ASC";
        db.connect.query(query, function (err, results, fields) {
            if(!err) {
                if(results.length>0) {
                    res.json( {success: true, rows: results, results: results.length});
                    db.destroy();
                } else {
                    res.json( {success: false, rows: [], message: 'Not found items'});
                    db.destroy();
                }
            } else res.json({success: false, rows: [], message: err.code });
        });
   } else res.json({ success: false, rows: [], message: 'Error sessions'});
};

exports.include = function (req, res) {
    var db = new database(req, res);
    if(db.connect) {
        //var context = req.param('context'),
        var item_id = req.param('item_id'),
            parent_id = req.param('parent_id');

        //var query = "call context_include('" + context + "'," + parent_id + ", @result);";
        var query = "call item_include('" + item_id + "'," + parent_id + ", @result);";
        db.connect.query(query, function (err, results, fields) {
            if(!err){
                db.connect.query("SELECT @result", function (err, results, fields) {
                    var result = results[0]['@result'];
                    if(result) {
                        res.json({success: true,  results: result , message: "Success!"});
                        db.destroy();
                    } else {
                        res.json({success: false,  results: result, message: "Not saved!"});
                        db.destroy();
                    }
                });
            } else res.json({success: false, message: err.code });
        });
    } else res.json({ success: false, rows: [], message: 'Error sessions'});
};


exports.delete_included = function (req, res) {
    var db = new database(req, res);
    if(db.connect) {
        var item_id = req.param('item_id'),
            parent_id = req.param('parent_id');

        var query = "call context_delete_included(" + item_id + "," + parent_id + ", @result);";
        db.connect.query(query, function(err, results, fields) {
            if(!err) {
                db.connect.query("SELECT @result", function (err, results, fields) {
                    var result = results[0]['@result'];
                    if(result) {
                        res.json({success: true,  results: result , message: "Success!"});
                        db.destroy();
                    } else {
                        res.json({success: false,  results: result, message: "Not saved!"});
                        db.destroy();
                    }
                });

            } else res.json({success: false, message: err.code });
        });
    } else res.json({ success: false, rows: [], message: 'Error sessions'});
};

exports.save_context = function (req, res) {
    var db = new database(req, res);
    if(db.connect) {
        var name        = req.param('name');
        var name_old    = req.param('name_old');
        var comment     = req.param('comment');
        var id          = req.param('id');
        var action      = req.param('action');

        if(!name) {
            res.json({success: false, message: "\"Name\" is empty. Please enter the \"Name\"" });
            db.destroy();
            return false;
        }
        // save context
        var save_context = function() {
            // create_context
            var sql = new getSQL({
                id: id,
                itemtype: "context",
                filename: "extensions.conf",
                name: name,
                comment: comment,
                out_2: "@id_context"
            });
            
            if ((name_old !== undefined) && (name != name_old)) {
                var query_update = [
                    'UPDATE `config` SET `var_val` = "' + name + '" WHERE `filename` = "sip.conf" AND `var_name` = "context" AND `var_val` = "' + name_old + '"',
                    'UPDATE `config_user` SET `var_val` = "' + name + '" WHERE `filename` = "sip.conf" AND `var_name` = "context" AND `var_val` = "' + name_old + '"'].join(';');
                    console.log(query_update);
                db.connect.query(query_update, function(err, results, fields) {});
            }

            var query = sql.save_item();

            db.connect.query(query, function(err, results, fields) {
                if(!err) {
                    db.connect.query("SELECT @result, @id_context", function(err, results, fields) {
                        var result = results[0]['@result'];
                        var id_context = results[0]['@id_context'];
                        if(result) {
                            res.json( {success: true,  results: result , id_context: id_context, name: name, message: "Context "+name+" saved success!"});  
                            db.destroy();
                        } else {
                            res.json( {success: false,  results: result, message: "Not saved!" });
                            db.destroy();
                        }
                    });
                } else res.json({success: false, message: err.code });
            });             
            // end create_context
        }   

        if(action == 'create' || action == 'copy') {
        // проверяем есть ли такой контекст у клиента
            var query = "SELECT name FROM vItems WHERE name = '"+name+"' and type in ('rule','context')";
            db.connect.query(query, function(err, results, fields) {
                if(!err) {
                    if(results.length == 0)
                        save_context();
                    else {
                        res.json({success: false, message: "Context or Rule "+name+" already exists!"});
                        db.destroy();
                    }
                } else res.json({success: false, message: err.code});
            });
        } else {save_context();}
    } else res.json({success: false, message: 'Error sessions'});
};

exports.load_context = function (req, res) {
    var db = new database(req, res);
    if(db.connect) {
        var id = req.param('id');
            query = "SELECT * from vItems where id='"+id+"'";

        db.connect.query(query, function (err, results, fields) {
            if(!err) {
                if(results.length>0) {
                    res.json( { success: true, data: results[0] });
                    db.destroy();
                } else {
                    res.json( {success: false, message: 'Not found ext'});
                    db.destroy();
                }
            } else res.json({success: false, message: err.code});
        });
    } else res.json({ success: false, message: 'Error sessions'});
};

exports.order_update = function(req, res) {
	var db = new database(req, res);
	if(db.connect) {
        var contexts =  req.param('contexts');

        var order_update = function(err, index, callback) {
            if (!err) {
                if (index < contexts.length) {
                    var query = "call order_update(?, ?, ?, @result)";
                    q = db.connect.query( query, [contexts[index].item_id, contexts[index].parent_id, contexts[index].order], function (err, results, fields) {
                        order_update(err, index+1, callback);
                    });
                    console.log(q.sql);
                } else {
                    callback();
                }
            } else {
                callback(err);
            }
        }

        order_update(null, 0, function(err) {
            if (!err) {
                res.json({success: true});
			} else {
                res.json({success: false, message: err.code });
            }
            db.destroy();
        });
	} else { 
        res.json({ success: false, message: 'Error sessions'});
    }
};

exports.delete = function(req, res) {
	var db = new database(req, res);
	if(db.connect) {
		var id = req.param('id');

		var query = "call context_delete("+ id +", @result)";
	    db.connect.query(query, function (err, results, fields) {
			if(!err) {
                db.connect.query("SELECT @result", function (err, results, fields) {
                    var result = results[0]['@result'];
                    if(result) {
                        res.json({success: true, message: "Context deleted!"});
                        db.destroy();
                    }
                    else {
                        res.json({success: false, message: "Context isn't deleted! Remove all the items of context." });
                        db.destroy();
                    }
                });
			} else res.json({success: false, message: err.code});
		});
	}
};

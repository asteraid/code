exports.list = function (req, res) {
    var db = new database(req, res);
    if(db.connect) {
        var type = req.param('type');
        var query = "SELECT DISTINCT * FROM vItems WHERE type = '" + type + "'";

        db.connect.query(query, function(err, results, fields) {
            if(!err) {
                if(results.length > 0)
                    res.json( {success: true, rows: results, results: results.length});
                else
                    res.json( {success: false, rows: [], message: 'Not found templates'});
            } else res.json({success: false, message: err.code });
            db.destroy();
        });
    } else res.json({ success: false, message: 'Error sessions'});
};

exports.ext_templates = function (req, res) {
    var db = new database(req, res);
    if(db.connect) {
        var query = "SELECT id, name, company_id, busylevel, allow, dtmfmode, deny, permit from vTemplatesConf";
        db.connect.query(query, function(err, results, fields) {
            if(!err) {
                if(results.length>0)
                    res.json({success: true, rows: results, results: results.length});
                else
                    res.json({success: false, message: 'Not found templates'});
            } else res.json({success: false, message: err.code });
            db.destroy();
        });
    } else res.json({ success: false, message: 'Error sessions'});
};

exports.save = function (req, res) {
    var db = new database(req, res);
    if(db.connect) {

   var name = req.param('name'),
       comment = req.param('comment'),
       id = req.param('id'),
       params = req.param('params'),
       values = req.param('values'),
       action = req.param('action');

   if(!name) {
       res.json({success: false, message: "\"Name\" is empty. Please enter the \"Name\"" });
       db.destroy();
       return false;
   }

   // сохранение шаблона
   var save_template = function(){
       // create_ext
                var sql = new getSQL({
                    id: id,
                    itemtype: "template",
                    filename: "sip.conf",
                    name: name,
                    comment: comment,
                    params: params,
                    values: values,
                    out_2: "@id_tmpl"
                });

                var query = sql.save_item();

                db.connect.query(query, function (err, results, fields) {
                    if ( !err ){
                        db.connect.query("SELECT @result, @id_tmpl", function (err, results, fields) {
                            var result = results[0]['@result'];
                            var id_tmpl = results[0]['@id_tmpl'];
                            if( result ) {
                              res.json( {success: true,  results: result , id_tmpl: id_tmpl, message: "Template "+name+" saved success!" });  
                            }
                            else
                              res.json( {success: false,  results: result, message: "Template not saved!" });  

                            db.destroy();
                        });

                    }
                    else {
                       res.json({success: false, message: err.code });
                       db.destroy();
                        }
                });            
             
             // -- end create_ext
   }
   
   if ( action == 'create' || action == 'copy' ){
       // проверяем есть ли такой шаблон у клиента
       var query = "SELECT name FROM vItems WHERE name = '"+name+"' AND type = 'template'";
       db.connect.query(query,function (err, results, fields) {
          if (!err){
             console.info(results);
             if ( results.length == 0){
                 save_template();
             }
             else {
               res.json({success: false, message: "Template "+name+" already exists!" });
               db.destroy();
               }
          } 
          else {
               res.json({success: false, message: err.code });
               db.destroy();
               }

       });
   }
   else{
      save_template();
   }
       

   }
   else
       res.json({ success: false, message: 'Error sesisons'});
};

exports.load = function (req, res) {
    var db = new database(req, res);
    if(db.connect) {
        var id = req.param('id');
        var query = "SELECT `name`, `expert`, GROUP_CONCAT(`value` SEPARATOR ',') `value` FROM `vItemsConf` WHERE `parent_id` = " + id + " GROUP BY `name`";
        db.connect.query(query, function (err, results, fields) {
           if (!err){
               if (results.length>0) {
                   var jsonObject = [];
                   results.forEach(function(item) {
                       var temp = {};
                       temp['name'] = item.name;
                       temp['value'] = item.value;
                       temp['expert'] = item.expert;
                       jsonObject.push(temp);
                   });
                   res.json({success: true, data: jsonObject});
               } else res.json({success: false, message: 'Not found rule'});
           } else res.json({success: false, message: err.code });
           db.destroy();
        });
   } else res.json({ success: false, message: 'Error sesisons'});
};

exports.delete = function (req, res) {
    var db = new database(req, res);
    if(db.connect) {
        var id = req.param('id'),
        name = req.param('name');
       // delete rule
        var query = "call delete_item('"+id+"', @result);";
        db.connect.query(query, function (err, results, fields) {
            if ( !err ){
                db.connect.query("SELECT @result", function (err, results, fields) {
                    var result = results[0]['@result'];console.info(result);
                    if( result ) {
                      res.json( {success: true,  results: result , message: "Template "+name+" deleted success!" });  
                    }
                    else
                      res.json( {success: false,  results: result, message: "Template not deleted!" });  
                    db.destroy();
                });
            } else {
               res.json({success: false, message: err.code });
               db.destroy();
            }
        });
        // end delete rule
   } else res.json({ success: false, message: 'Error sesisons'});
};
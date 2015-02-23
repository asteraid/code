/* 
 * Класс для работы с callflow
 */
var fs = require('fs');
var separator = "__"; //разделитель типа блока колфлоу

exports.list = function (req, res) {
    if ( req.session.dbuser && req.session.password ){
    var conf = {};
    conf.user = req.session.dbuser;
    conf.password = req.session.password;
    conf.host = config.db.host;
    conf.database = config.db.database;
    conf.database = config.db.database;
    conf.port = config.db.port;

    var db = mysql.createConnection(conf);
    db.connect(function(err) {
              // connected! (unless `err` is set)
    });
    
    //var query = "SELECT id, name, pattern, metric FROM vCallflows ORDER BY metric";
    // корень callflow является rule
    var query = "SELECT id, name, pattern, metric FROM vItems WHERE type='rule' ORDER BY metric";
    db.query(query, function (err, results, fields) {
       if ( !err ){
        if (results.length>0)
            res.json( {success: true, rows: results, results: results.length});
        else
            res.json( {success: false, message: 'Not found callflows'});
       }
       else
           res.json({success: false, message: err.code });
        db.destroy();
    });
   }
   else
       res.json({ success: false, message: 'Error sesisons'});
};

exports.rename = function (req, res) {
    if ( req.session.dbuser && req.session.password ){
    var conf = {};
    conf.user = req.session.dbuser;
    conf.password = req.session.password;
    conf.host = config.db.host;
    conf.database = config.db.database;
    conf.database = config.db.database;
    conf.port = config.db.port;

    var db = mysql.createConnection(conf);
    db.connect(function(err) {
              // connected! (unless `err` is set)
    });

   var name = req.param('name'),
       id = req.param('id');

   if(!name) {
       res.json({success: false, message: "\"Name\" is empty. Please enter the \"Name\"" });
       db.destroy();
       return false;
   }

    var query = "call rename_callflow('"+id+"','"+name+"', @result, @id_callflow);";
    db.query(query, function (err, results, fields) {
        if ( !err ){
            db.query("SELECT @result, @id_callflow", function (err, results, fields) {
                var result = results[0]['@result'];
                if(result) {
                  res.json( {success: true,  results: result, message: "Renamed success!" });  
                }
                else
                  res.json( {success: false,  results: result, message: "Not renamed!" });  

                db.destroy();
            });

        }
        else {
           res.json({success: false, message: err.code });
           db.destroy();
            }
    });
   }
   else
       res.json({ success: false, message: 'Error sesisons'});
};


// получение списка звуковых файлов
exports.get_sounddir = function(req, res){
  if ( req.session.dbuser && req.session.password ){
     var sounddir = config.soundpath;
     if ( sounddir != '' ){
         fs.readdir(sounddir, function(err, files){
             var sound_files = [];
             if ( !err ){
                 next_file(0);
             }
             else
                 res.json({success: false, message: err.code });
             
             function next_file(index){
                 if ( index < files.length ){
                    fs.stat(sounddir+'/'+files[index],function(err, stat){
                        if ( stat.isFile() ) {
                            var match = files[index].match(/(.+)\.{1}([^\.]*)$/);
                            if ( match != null && match[2] == 'wav' )
                            sound_files.push(match[1]);
                        }
                        index += 1;
                        next_file(index);
                    }) 
                 }
                 else
                    res.json({success: true, files: sound_files });
             }
             
         });
     }
     else
        res.json({success: false, message: 'Not found sound dir' });
  }
  
}

// получение звуковыго файла
exports.get_soundfile = function(req, res){
  if ( req.session.dbuser && req.session.password ){
     var sounddir = config.soundpath;
     if ( sounddir != '' ){
        var file_name = req.param('file');

        var stat = fs.stat(sounddir+'/'+file_name+'.wav',function(err, stat){
            if ( !err ){
                   res.writeHead(200, {
                    'Content-Type': 'audio/wav',
                    'Content-Length': stat.size,
                    'Content-Disposition': 'attachment; filename="'+file_name+'.wav"',
                    'Content-Transfer-Encoding': 'binary'
                   });

                   var readStream = fs.createReadStream(sounddir+'/'+file_name+'.wav');
                    // We replaced all the event handlers with a simple call to readStream.pipe()
                   readStream.pipe(res);

            }
            else
                res.send(403, 'Error read file');
        });
        
     }
     else
        res.send(403, 'Sorry! you cant play that.');
     
  }
  else
      res.send(403, 'Sorry! you cant play that.');
}  

// delete callflow
exports.delete_callflow = function(req, res){
  if ( req.session.dbuser && req.session.password ){
    var conf = {};
    conf.user = req.session.dbuser;
    conf.password = req.session.password;
    conf.host = config.db.host;
    conf.database = config.db.database;
    conf.database = config.db.database;
    conf.port = config.db.port;

    var db = mysql.createConnection(conf);
    db.connect(function(err) {
              // connected! (unless `err` is set)
    });
  
    var callflow_id = req.param('id');
    
    // удаляем текущее содержимое callflow
    
    var query = "call delete_callflow_tree('"+callflow_id+"', @result);";
                    db.query(query, function (err, results, fields) {
                        if ( !err ){
                            db.query("SELECT @result", function (err, results, fields) {
                                var query = "call delete_callflow('"+callflow_id+"', @result);";
                                db.query(query, function (err, results, fields) {
                                   if ( !err ){
                                       db.query("SELECT @result", function (err, results, fields) {
                                            var result = results[0]['@result'];
                                            if(result) {
                                                res.json({success: true, message: "Callflow success deleted!" }); 
                                            }
                                            else {
                                                res.json({success: false, message: "Error deleted callflow!" }); 
                                            }
                                                
                                       });
                                   } 
                                   else
                                     res.json({success: false, message: err.code }); 
                                });
                                
                            });
                        }
                        else
                            res.json({success: false, message: err.code });   
                    });

  }
}



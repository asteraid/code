/* 
 * Голосовые сообщение
 */
//var JSFtp = require("jsftp");

exports.list = function(req, res) {
    var db = new database(req, res);
    if(db.connect) {
        var id = req.param('id'),
            dStart = req.param('iDisplayStart'),
            dLength = req.param('iDisplayLength'),
            limit = '',
            query;

        if (dStart && dLength != -1) {
            limit = 'LIMIT ' + dStart + ',' + dLength;
        }

        var query = "SELECT SQL_CALC_FOUND_ROWS date_format(start,'%Y-%m-%d %H:%i:%s') as start,src,dst,duration,uniqueid, \
SUBSTRING( linkedid,1,LENGTH(linkedid) - LENGTH(SUBSTRING_INDEX(linkedid,'-',-1) ) -1 ) as host,voice_message \
FROM " + config.cdr.database + ".cdr WHERE voice_message <> '' AND disposition = 'ANSWERED' order by start desc " + limit + '; SELECT FOUND_ROWS();';
		console.log(query);
        db.connect.query(query, function (err, results, fields) {
            var success = false;
            if(!err) {
                if(results[0].length >0 ) {
                    success = true;
                }
                res.json({  success: success,
                            rows: results[0],
                            iTotalRecords: results[1][0]['FOUND_ROWS()'],
                            iTotalDisplayRecords: results[1][0]['FOUND_ROWS()'],
                            sEcho: req.param('sEcho')
                 });
            }
	    else {
		res.json({success: false, message: err.code });
	    }
            db.destroy();
        });
   } 
   else {
       res.json({ success: false, message: 'Error sesisons'});
   }
};

exports.delete = function(req, res) {
  if (req.session.user) {
    var fs       = require('fs');
    var filename = req.param('filename');
    var filePath = [config.voice_path, filename].join('');
    var query    = [
      'UPDATE ',
        config.cdr.database, '.`cdr`',
      ' SET `voice_message` = "" ',
      'WHERE `voice_message` != "" AND `voice_message` = "', filename, '"'
    ].join('');
    
    var db = new database(req, res);
    if(db.connect) {
      db.connect.query(query, function (err, results, fields) {
        if (!err) {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({success: true, message: 'File deleted success'});
          } else {
            res.json({success: false, message: 'Error: file not exists'});
          }
        } else {
          res.json({success: false, message: err.code});
        }
        db.destroy();
      });
    } else res.json({ success: false, message: 'Error sesisons'});
  }
}

exports.get_voice_file = function(req, res) {
    if (req.session.user) {
        
        var fs          = require('fs');
        /*
        var fileNameSrc     = req.param('filename');
        var clearFileName   = fileNameSrc.split('/').pop();
        var fileNameSrcArr  = fileNameSrc.split('.');
        var fileFormatSrc;
        var filePathSrc;
        var convert         = true;
        */
        var fileName = req.param('filename');
        var fileNameArr = fileName.split('/');
        var file  = {};
          file.src  = {};
            file.src.name   = fileNameArr[fileNameArr.length - 1].split('.')[0];
            file.src.format = fileNameArr[fileNameArr.length - 1].split('.').pop();
            file.src.path   = config.voice_path + fileNameArr.slice(0, -1).join('/');
            
          file.dest = {};
            file.dest.name    = file.src.name + req.session.user;
            file.dest.format  = 'mp3';
            file.dest.path    = '/tmp/' + [file.dest.name, file.dest.format].join('.');
            
        console.log('file => ', file);
        
        
        fs.exists([file.src.path, file.src.name, file.src.name].join(''), function(err) {
          console.log(exists);
          /*if (exists) {
            sendFile(file.src.name, file.src.path, file.src.format)
          } else {
            res.writeHead(404, {"Content-Type": "text/plain"});
            res.write("404 Not Found\n");
            res.end();
          }*/
        });
        
        var sendFile = function(fileName, filePath, fileFormat) {
          var stat        = fs.statSync([filePath, fileFormat].join('.'));
          
          res.writeHead(200, {
              'Content-Type': 'audio/mpeg', 
              'Content-Length': stat.size,
              'Content-Disposition': 'attachment; filename=' + [fileName, fileFormat].join('.')
          });
          
          var readStream = fs.createReadStream([filePath, fileFormat].join('.'));
          
          readStream.on('data', function(data) {
              res.write(data);
          });
      
          readStream.on('end', function() {
              res.end();
              //fs.unlinkSync([filePath, fileFormat].join('.'));
          });
        }
        
        
        /*
        var cmdSox  = ['sox ', filePathSrc, ' -e signed-integer ', filePathDest, '.wav'].join('');
        var cmdLame = ['lame -h ', filePathDest, '.wav', ' -s ', filePathDest, '.', fileFormatDest].join('');
        
        
        var length = fileNameSrcArr.length;
        
        switch (fileNameSrcArr[length - 1]) {
          case 'gsm':
          case 'wav':
            fileFormatSrc = fileNameSrcArr[length - 1];
            fileNameSrc   = fileNameSrcArr.splice(0, length - 1).join('.');
            filePathSrc = config.voice_path + fileNameSrc;
          break;
          case 'mp3':
            filePathSrc   = config.voice_path + fileNameSrc;
            fileFormatSrc = 'mp3';
            convert       = false;
          break;
          default:
            filePathSrc = config.voice_path + fileNameSrc;
            if (fs.existsSync(filePathSrc + '.gsm')) fileFormatSrc = 'gsm';
            else if (fs.existsSync(filePathSrc + '.wav')) fileFormatSrc = 'wav';
          break;
        }
        
        var fileNameDest    = clearFileName + req.session.user;
        var fileFormatDest  = 'mp3';
        var filePathDest    = '/tmp/' + fileNameDest;
            
        filePathSrc     += '.' + fileFormatSrc;
        
        var cmdSox  = ['sox ', filePathSrc, ' -e signed-integer ', filePathDest, '.wav'].join('');
        var cmdLame = ['lame -h ', filePathDest, '.wav', ' -s ', filePathDest, '.', fileFormatDest].join('');

        console.log('fileNameSrc =>', fileNameSrc);
        console.log('filePathSrc => ', filePathSrc);
        console.log('fileFormatSrc => ', fileFormatSrc);
        
        console.log('filePathDest =>', filePathDest);
        console.log('fileFormatDest =>', fileFormatDest);
        
        console.log('convert =>', convert);
        
        if (convert) {
          exec_command(cmdSox, function(err,out) {
            if (!err) {
                exec_command(cmdLame, function(err,out){
                  if (!err) sendFile(fileNameSrc, filePathDest, fileFormatDest, convert);
                  else {
                    res.writeHead(404, {"Content-Type": "text/plain"});
                    res.write("404 Not Found\n");
                    res.end();
                  }
                });
            }
            else {
              res.writeHead(404, {"Content-Type": "text/plain"});
              res.write("404 Not Found\n");
              res.end(); 
            }
          });
        } else {
          sendFile(fileNameSrc, filePathSrc, fileFormatSrc, convert);
        }

        var sendFile = function(fileName, filePath, fileFormat, convert) {
          var stat        = fs.statSync([filePath, fileFormat].join('.'));
          
          res.writeHead(200, {
              'Content-Type': 'audio/mpeg', 
              'Content-Length': stat.size,
              'Content-Disposition': 'attachment; filename=' + [fileName, fileFormat].join('.')
          });
          
          var readStream = fs.createReadStream([filePath, fileFormat].join('.'));
          
          readStream.on('data', function(data) {
              res.write(data);
          });
      
          readStream.on('end', function() {
              res.end();
              
              if (convert)
                fs.unlinkSync([filePath, fileFormat].join('.'));
          });
        } */
    } else res.json({success: false, message: 'Error sessions'});
}

function exec_command(cmd, callback ) {
    var exec = require('child_process').exec, child;
   
    child = exec(cmd, function(error,stdout,stderr) {
        callback(error,stdout);
    });
}

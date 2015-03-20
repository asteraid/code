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
        config.cdr.database,
      ' SET `voice_message` = "" ',
      'WHERE `voice_message` != "" AND `voice_message` = "', filename, '"'
    ].join('');
    
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
  }
}

exports.get_voice_file = function(req, res) {
    if (req.session.user) {
        
        var fs          = require('fs');
        
        var fileNameSrc     = req.param('filename');
        var clearFileName   = fileNameSrc.split('/').pop();
        var fileNameSrcArr  = fileNameSrc.split('.');
        var fileFormatSrc;
        var filePathSrc;
        
        var length = fileNameSrcArr.length;
        
        switch (fileNameSrcArr[length - 1]) {
          case 'gsm':
          case 'wav':
            fileFormatSrc = fileNameSrcArr[length - 1];
            fileNameSrc   = fileNameSrcArr.splice(0, length - 1).join('.');
            filePathSrc = config.voice_path + fileNameSrc;
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

        exec_command(cmdSox, function(err,out) {
          if (!err) {
              exec_command(cmdLame, function(err,out){
                if (!err) sendFile();
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

        var sendFile = function() {
          var stat        = fs.statSync([filePathDest, fileFormatDest].join('.'));
          
          res.writeHead(200, {
              'Content-Type': 'audio/mpeg', 
              'Content-Length': stat.size,
              'Content-Disposition': 'attachment; filename=' + [fileNameSrc, fileFormatDest].join('.')
          });
          
          var readStream = fs.createReadStream([filePathDest, fileFormatDest].join('.'));
          
          readStream.on('data', function(data) {
              res.write(data);
          });
      
          readStream.on('end', function() {
              res.end();
              fs.unlinkSync([filePathDest, fileFormatDest].join('.'));
          });
        }
    } else res.json({success: false, message: 'Error sessions'});
}

function exec_command(cmd, callback ) {
    var exec = require('child_process').exec, child;
   
    child = exec(cmd, function(error,stdout,stderr) {
        callback(error,stdout);
    });
}

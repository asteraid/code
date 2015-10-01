/* 
 * Голосовые сообщение
 */
//var JSFtp = require("jsftp");
var db = require('../../modules/db');

exports.list = function(req, res) {
  var id      = req.param('id');
  var dStart  = req.param('iDisplayStart');
  var dLength = req.param('iDisplayLength');
  var limit   = '';

  if (dStart && dLength != -1)
    limit = 'LIMIT ' + dStart + ',' + dLength;

  var query = [
    "SELECT SQL_CALC_FOUND_ROWS date_format(start,'%Y-%m-%d %H:%i:%s') as start,src,dst,duration,uniqueid,",
    "SUBSTRING( linkedid,1,LENGTH(linkedid) - LENGTH(SUBSTRING_INDEX(linkedid,'-',-1) ) -1 ) as host,voice_message ",
    "FROM " + config.cdr.database + ".cdr WHERE voice_message <> '' AND disposition = 'ANSWERED' order by start desc " + limit + "; SELECT FOUND_ROWS();"
  ].join(' ');
  
  db.query(req, query, function(err, results, fields) {
    if (err) {
      res.json({success: false, message: err.code});
      return;
    }
    
    var success = false;
    
    if (results[0].length > 0)
        success = true;
    
    res.json({
      success: success,
      rows: results[0],
      iTotalRecords: results[1][0]['FOUND_ROWS()'],
      iTotalDisplayRecords: results[1][0]['FOUND_ROWS()'],
      sEcho: req.param('sEcho')
    });
  });
}

exports.delete = function(req, res) {  
  var fs       = require('fs');
  var filename = req.param('filename');
  var host     = req.param('host');
  var filePath = [config.voiceDir, filename].join('');
  var query    = [
    'UPDATE ',
      config.cdr.database, '.`cdr`',
    ' SET `voice_message` = "" ',
    'WHERE `voice_message` != "" AND `voice_message` = "', filename, '"'
  ].join('');

  db.query(req, query, function(err, results, fields) {
    if (err) {
      res.json({success: false, message: err.code});
      return;
    }
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      //TODO: need move path to config
      exec_command(['ssh', host, 'rm -f', '/var/log/asterisk/monitor/', fileName].join(' '), function(error, out) {});
      res.json({success: true, message: 'File deleted success'});
    } else
      res.json({success: false, message: 'Error: file not exists'});
  });
}

exports.get_voice_file = function(req, res) {
  if (req.session.user) {
    var fs          = require('fs');
    var fileName    = req.param('filename');
    var fileNameArr = fileName.split('/');
    var file  = {};
    file.src  = {};
    file.src.name   = fileNameArr[fileNameArr.length - 1].split('.').slice(0, -1).join('.');
    file.src.format = fileNameArr[fileNameArr.length - 1].split('.').pop();
    file.src.path   = config.voiceDir + fileNameArr.slice(0, -1).join('/') + '/';

    file.dest = {};
    file.dest.name    = file.src.name + req.session.user;
    file.dest.format  = 'mp3';
    file.dest.path    = '/tmp/' + [file.dest.name, file.dest.format].join('.');

    fs.exists([file.src.path, file.src.name, '.', file.src.format].join(''), function(exists) {    
      if (exists) {
        sendFile(file.src.name, file.src.path, file.src.format)
      } else {
        res.writeHead(404, {"Content-Type": "text/plain"});
        res.write("File " + file.src.name + "." + file.src.format + " not found\n");
        res.end();
      }
    });
        
    var sendFile = function(fileName, filePath, fileFormat) {
      var stat = fs.statSync(filePath + fileName + '.' + fileFormat);

      res.writeHead(200, {
        'Content-Type': 'audio/mpeg', 
        'Content-Length': stat.size,
        'Content-Disposition': 'attachment; filename=' + [fileName, fileFormat].join('.')
      });

      var readStream = fs.createReadStream(filePath + fileName + '.' + fileFormat);

      readStream.on('data', function(data) {
        res.write(data);
      });
      
      readStream.on('end', function() {
          res.end();
      });
    }
  } else res.json({success: false, message: 'Error session'});
}

function exec_command(cmd, callback ) {
  var exec = require('child_process').exec, child;
 
  child = exec(cmd, function(error, stdout, stderr) {
    callback(error, stdout);
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
            filePathSrc = config.voiceDir + fileNameSrc;
          break;
          case 'mp3':
            filePathSrc   = config.voiceDir + fileNameSrc;
            fileFormatSrc = 'mp3';
            convert       = false;
          break;
          default:
            filePathSrc = config.voiceDir + fileNameSrc;
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
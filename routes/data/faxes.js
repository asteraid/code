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
SUBSTRING( linkedid,1,LENGTH(linkedid) - LENGTH(SUBSTRING_INDEX(linkedid,'-',-1) ) -1 ) as host,fax_path \
FROM " + config.cdr.database + ".cdr WHERE fax_path <> '' order by start desc " + limit + '; SELECT FOUND_ROWS();';
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

exports.get_fax_file = function(req, res) {
    if (req.session.user) {
        
        var fs        = require('fs');
        
        var fileSrc   = req.param('filename');
        var fileDest  = [config.fax_path, fileSrc].join('');
        
        var sendFile = function(file) {
            var stat        = fs.statSync(file);
            
            res.writeHead(200, {
                'Content-Type': 'image/tiff', 
                'Content-Length': stat.size,
                'Content-Disposition': 'attachment; filename=' + file.split('/').pop()
            });
            
            var readStream = fs.createReadStream(file);
            
            readStream.on('data', function(data) {
                res.write(data);
            });
        
            readStream.on('end', function() {
                res.end();
            });
        };

        if (fs.existsSync(fileDest)) {
          sendFile(fileDest);
        } else {
          res.writeHead(404, {"Content-Type": "text/plain"});
          res.write("404 Not Found\n");
          res.end();
        }
    } else res.json({success: false, message: 'Error sessions'});
}

function exec_command(cmd, callback ) {
    var exec = require('child_process').exec, child;
   
    child = exec(cmd, function(error,stdout,stderr) {
        callback(error,stdout);
    });
}

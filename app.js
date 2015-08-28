var converter = require('./modules/config/converter');
global.config = converter.mergeJSConfigs();

var express   = require('express');
var routes    = require('./routes/index');
//var dataStore = require('./routes/data');
var https     = require('https');
var http      = require('http');
var io        = require('socket.io');
var fs        = require('fs');
var hash      = require('./hash_table');
var path      = require('path');
var db        = require('./modules/db');
var scheduler = require('./modules/scheduler');

// Глобальные переменные
  global.cManager = scheduler.init(); //cron manager init or return object cron manager

  scheduler.getJobsList(function(error, results) {
    if (!error && results.length > 0) {
      results.forEach(function(job) {
        scheduler.addJob(job);
      });
    }
  });

/*
config = fs.existsSync('./config.js') ? require('./config.js') : require('./modules/config/config_default.js');

if (fs.existsSync('./config.user.js'))
  require('./config.user.js');

if (fs.existsSync('./config.dev.js'))
  require('./config.dev.js');
*/

//config          = require('./config.js');
//config_default  = require('./modules/config/config_default.js');
operators       = new hash();
mysql           = require('mysql');
database        = function(req, res, sysuser) {
    this.success = false;
    
    var user;
    var password;
    
    if (sysuser) {
      user      = sysuser.user ? sysuser.user : config.db.user;
      password  = sysuser.password ? sysuser.password : config.db.password;
    } else {
      user      = req.session.dbuser;
      password  = req.session.password;
    }

    if(user !== undefined && password !== undefined) {
        this.success = true;
        var conf = {};
        
        conf.user       = user;
        conf.password   = password;
        conf.host       = config.db.host;
        conf.database   = config.db.database;
        conf.port       = config.db.port;
        conf.multipleStatements = true; //Multiple statement queries
        
        if (!this.connect) {
          this.connect = mysql.createConnection(conf);
        }

        this.connect.connect(function(err) {
          // connected! (unless `err` is set)
        });
    } else this.connect = false;
    
    this.destroy = function() {
        if(this.connect)
            this.connect.destroy();
    }
}

getSQL = function(p) {
    this.save_item = function() {
        //default values
        if(p.id === undefined) p.id = 0;
        if(p.parent_id === undefined) p.parent_id = 0;
        if(p.node === undefined) p.node = 'ALL';
        if(p.filename === undefined) p.filename = '';
        if(p.comment === undefined) p.comment = '';
        if(p.out_1 === undefined) p.out_1 = '@result';
        if(p.out_2 === undefined) p.out_2 = '@id_trunk';
        if(p.params === undefined) p.params = '';
        if(p.values === undefined) p.values = '';
        if(p.custom_type === undefined) p.custom_type = 0;
        if(p.commented === undefined) p.commented = 0;
        p.commented == 'yes' ? p.commented = 1 : p.commented = 0;
        //

        for(var key in p) {
            if(p.hasOwnProperty(key)) {
                if(typeof p[key] === 'string')
                    if(!p[key].match(/^(@)/))
                        p[key] = "'" + p[key] + "'";
            }
        }
        //console.log('---------->', p.commented, '<------------');
        return "call save_item(" + [p.id, p.parent_id, p.itemtype, p.filename, p.name, p.comment, p.node, p.custom_type, p.commented, p.params, p.values, p.out_1, p.out_2].join(',') + ");"; 
    }
}

// MemoryStore
var MemoryStore = express.session.MemoryStore
    ,sessionsStore = new MemoryStore();

var opts = {
		  // Specify the key file for the server
		  key: fs.readFileSync('./cert/ccc-key.pem'),
		  // Specify the certificate file
		  cert: fs.readFileSync('./cert/ccc-cert.pem'),
		  rejectUnauthorized: true
	   };

app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 8000);
  app.set('portssl', process.env.PORTSSL || config.webserver.port);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set("jsonp callback", true );
  app.use(express.favicon(__dirname + '/public/favicon.ico', { maxAge: 2592000000 }));
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({
      secret: 'ccc', 
      key: 'ccc.sid',
     // cookie: { maxAge: new Date(Date.now() + 1200000) } , // 20 min
      store: sessionsStore
    }));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(function(req,res){
    res.render('404.jade',{ title: 'MAGUI'
                      , item: req.url.substr(1)
                      , itemUrl: req.url
                      , callflow_items: []
                      , context_items: []
                      , itemId: ''
                      , itemName: ''
                      });
  });
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.all('*', routes.ttt);

var serverssl = https.createServer(opts,app).listen(app.get('portssl'), function(){
	console.log("Express server listening on port " + app.get('portssl'));
});

/*
var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
*/

var parseCookie = require('cookie');
var parseSignedCookie = require('connect').utils.parseSignedCookie;

io = io.listen(serverssl);

io.set('transports', ['xhr-polling', 'jsonp-polling']);
io.set('transportOptions','{"xhr-polling": {timeout: 30000},"jsonp-polling": {timeout: 30000}');

var Session = require('connect').middleware.session.Session;
//socket.io
io.configure(function (){
	  io.set('authorization', function (data, callback) {
		console.log('autorization');
		if (data.headers.cookie) {
			data.cookie = parseCookie.parse(data.headers.cookie,{secure:true});
			data.sessionID = parseSignedCookie(data.cookie['ccc.sid'],'ccc');
                        data.sessionStore = sessionsStore;
			sessionsStore.get(data.sessionID, function(err, session){
                            if (err) {
                                     return callback('Error in session store.', false);
                                } else if (!session) {
                                     return callback('Session not found.', false);
                                }
                            // success! we're authenticated with a known session.
                            data.session = new Session(data, session);
                            console.log(session);
                            return callback(null, true);
                        });
		}
		else{
			console.log('error cookie');
			callback('Session cookie required.', false); // error first callback style
		}
	  });
	});

io.sockets.on('connection', function (socket) {
 console.log('Operator socketId: '+socket.id + ' connected, sessionID: '+socket.handshake.sessionID);
 //console.log('A socket with sessionID ' + socket.handshake.sessionID + ' connected!');
          var hs = socket.handshake;
          // Освежаем сессию
          var intervalFreshID = setInterval(function(){
             console.log('session fresh');
             hs.session.reload( function () { 
            // "touch" it (resetting maxAge and lastAccess)
            // and save it back again.
                     hs.session.touch().save();
             });
          }, 60000);
 	  
 	 // socket.emit('news', { hello: 'world' });
	  socket.on('my other event', function (data) {
		  //console.log('my other event');
		  console.log(data);
		  console.log(socket.id);
	  });
	  
	  socket.on('disconnect', function() {
                   // удаляем сессию ;
                  clearInterval(intervalFreshID);
                   
		  console.log('клиент отключился - удаляем оператора по сессии '+socket.handshake.sessionID);
		  var ind = operators.find_sid(socket.handshake.sessionID);
			if ( ind != -1 ){
				operators.remove(ind);
			}
			else
				console.log('Оператор с такой сессией не найден '+socket.handshake.sessionID);
			console.log(operators.get_hash());
	  });
});
// -- socket.io
//test
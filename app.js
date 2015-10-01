var converter = require('./modules/config/converter');
global.config = converter.mergeJSConfigs();

var express       = require('express');
var MemoryStore   = express.session.MemoryStore;
var sessionsStore = new MemoryStore();

var routes        = require('./routes/index');
var https         = require('https');
var io            = require('socket.io');
var fs            = require('fs');
var path          = require('path');
var db            = require('./modules/db');
var scheduler     = require('./modules/scheduler');
var api           = require('./routes/api');

// Global variables
global.cManager = scheduler.init(); //cron manager init or return object cron manager

scheduler.getJobsList(function(error, results) {
  if (!error && results.length > 0) {
    results.forEach(function(job) {
      scheduler.addJob(job);
    });
  }
});

//mysql     = require('mysql');
//database  = db.database;
getSQL    = db.getSQL;

var opts = {
  key                 : fs.readFileSync('./cert/ccc-key.pem'),
  cert                : fs.readFileSync('./cert/ccc-cert.pem'),
  rejectUnauthorized  : true
};

app = express();

app.configure(function(){
  app.set('portssl', process.env.PORTSSL || config.webserver.port);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set("jsonp callback", true );
  app.use(express.favicon(__dirname + '/public/favicon.ico', {maxAge: 2592000000}));
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({
    secret  : 'ccc', 
    key     : 'ccc.sid',
    store   : sessionsStore
  }));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(function(req,res) {
    res.render('404.jade', {
      title: config.applicationName,
      item: req.url.substr(1), 
      itemUrl: req.url,
      callflow_items: [],
      context_items: [],
      itemId: '',
      itemName: ''
    });
  });

});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.all('/api*', api.index);
app.all('*', routes.index);

var serverssl = https.createServer(opts, app).listen(app.get('portssl'), function() {
	console.log("Express server listening on port " + app.get('portssl'));
});

var parseCookie       = require('cookie');
var parseSignedCookie = require('connect').utils.parseSignedCookie;

io = io.listen(serverssl);

var Session = require('connect').middleware.session.Session;

//socket.io
io.configure(function() {});

exports.io = io;
// -- socket.io
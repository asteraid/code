/*
  scheduler module use global variable cManager to manage jobs
*/

var manager   = require('cron-job-manager');
//var config    = require('../config.js');
var db        = require('./db');

var sConfig = db.getConfig(null, true);

var table = {
  "schedule"  : "schedule",
  "jobs"      : "schedule_job"
};

var init = function() {
  if (global.cManager)
    return global.cManager;
  else
    return new manager();
}

var getJobsList = function(callback) {
  var query = 'SELECT * FROM ' + table.jobs + ' WHERE `enable` = 1';
  db.query(sConfig, query, function(error, results, fields) {
    callback(error, results);
  });
}

var addJob = function(job) {
  var jobName = getJobName(job.id);
  
  if (job.execute != '') {
    global.cManager.add(jobName, job.schedule, function() {
      execute(job.execute, function(error, result) {
        var query = 'INSERT INTO ' + table.schedule + ' (job_id, error) VALUES (?, ?)';
        db.query(sConfig, query, [job.id, error === null ? null : JSON.stringify(error)], function() {});
      });
    });

    startJob(job.id);
  }
}

var startJob = function(id) {
  var jobName = getJobName(id);
  
  global.cManager.start(jobName);
}

var createJob = function(job, callback) {
  if (job) {
    var query = [
      'INSERT INTO',
        table.jobs, '(module, schedule, execute, enable)',
      'VALUES', '(?, ?, ?, ?)'
    ].join(' ');
    
    var values = [job.module, job.schedule, job.execute, job.enable];
    
    db.query(sConfig, query, values, function(error, result) {
      if (!error) {
        job.id = result.insertId;
        addJob(job);
        callback(error, {id: result.insertId});
      } else
        callback(error);
    });
  }
}

var updateJob = function(params, callback) {
  if (params && params.id) {  
    var query = [
      'UPDATE', table.jobs, 'SET schedule = ?', 'WHERE id = ?'
    ].join(' ');

    var values = [params.schedule, params.id];
    
    db.query(sConfig, query, values, onUpdate);
    
    function onUpdate(error) {
      if (!error)
        selectJob();
      else
        callback(error);
    }
    
    function selectJob() {
      var query = ['SELECT * FROM', table.jobs, 'WHERE id = ? LIMIT 1'].join(' ');
      var values = [params.id];
      db.query(sConfig, query, values, onSelectJob);
    }
    
    function onSelectJob(error, results) {
      if (!error) {
        global.cManager.deleteJob(getJobName(params.id));
        addJob(results[0]);
      }
      
      callback(error);
    }
  }
}

function execute(code, callback) {
  eval(code);
}

function getJobName(id) {
  if (id)
    return 'job_' + id;
  else
    return false;
}

module.exports.init         = init;
module.exports.getJobsList  = getJobsList;
module.exports.addJob       = addJob;
module.exports.createJob    = createJob;
module.exports.updateJob    = updateJob;
module.exports.startJob     = startJob;
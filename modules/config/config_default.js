config_default = {
  application_name  : "Plentystars",
  db_client         : {
    host: "localhost",
    user: "root",
    password: '',
    port: 3306,
    db_config: "a_conf",
    db_cdr: "a_cdr"
  },
  webserver         : {
    port: 443,
    ip_allowed: "['0.0.0.0']"
  }
};

module.exports = config_default;
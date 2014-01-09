module.exports = function(config, tags) {
    var _      = require('underscore');
    var loggly = require('loggly');

    var client = loggly.createClient(config);

    //example by http://www.hacksparrow.com/how-to-write-midddleware-for-connect-express-js.html
    //info on sequence: http://runnable.com/UTlPPV-f2W1TAAEf/custom-error-pages-in-express-for-node-js
    //                  http://expressjs.com/guide.html#error-handling
    //some other middleware for logging:
    //  http://fabianosoriani.wordpress.com/2013/04/13/loggly-middleware-for-express-js-server-visibility/
    if (typeof tags === 'string') {
        tags = tags.split(/\s*,\s*/);
    } else if (tags instanceof Array) {
        tags = _.uniq(['application', 'node', 'express', 'http'].concat(tags)); 
    } else {
        tags = ['application', 'node', 'express', 'http'];
    }
    console.log('tags', tags);

    var logger = function (err, req, res, next, type) {
        if (!err && type === 'error')
            return;

        var level;

        if (err || res.statusCode >= 500) { // server internal error or error
            level = 'ERROR';
        } else if (res.statusCode >= 400) { // client error
            level = 'WARN';
        } else { // redirect/success
            level = 'INFO';
        }

        var fields = { //partly from express-bunyan-logger (middleware)
            'level'        : level,
            'location'     : process.argv && process.argv.length && process.argv[1],
            'pid'          : process.pid,
            'host'         : req.host,
            'port'         : req.app.settings.port,
            'path'         : req.path,
            'query'        : req.query,
            'protocol'     : req.protocol,
            'method'       : req.method,
            'status'       : res.statusCode,
            'remoteAddress': req.headers['x-forwarded-for'] || req.connection.remoteAddress ||
                            (req.socket        && req.socket.remoteAddress) || 
                            (req.socket.socket && req.socket.socket.remoteAddresss),
            'user-agent'   : req.header('user-agent'),
            'http-version' : req.httpVersionMajor+'.'+req.httpVersionMinor,
            'sessionID'    : req.sessionID,
            'body'         : req.body && req.body.toString && req.body.toString().substring(0, Math.max(req.body.toString().length, 20)),
            'originalUrl'  : req.originalUrl,
            'referrer'     : req.referrer,
            'headers'      : req.query
        };
       
        client.log(fields, tags);
        next(err);
    };

    return {
        requestLogger : function() {
            return function (req, res, next) {
                console.log('requestLogger');
                logger(null, req, res, next, 'request');
            };
        },

        errorLogger : function() {
            return function (err, req, res, next) {
                console.log('errorLogger');
                logger(err, req, res, next, 'error');
            };
        }
    };

    //ook loggen in textbestand met log4js, winston of bunyan
};
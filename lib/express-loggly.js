module.exports = function(config) {
    var hostn  = require('os').hostname();
    var _      = require('underscore');
    var loggly = require('loggly');

    var client = loggly.createClient(config);

    //example by http://www.hacksparrow.com/how-to-write-midddleware-for-connect-express-js.html
    //info on sequence: http://runnable.com/UTlPPV-f2W1TAAEf/custom-error-pages-in-express-for-node-js
    //                  http://expressjs.com/guide.html#error-handling
    //some other middleware for logging:
    //  http://fabianosoriani.wordpress.com/2013/04/13/loggly-middleware-for-express-js-server-visibility/
    var expressTags = ['application', 'node', 'express', 'http'];
    var adhocTags   = ['application', 'node'];

    if (config.tags instanceof Array) {
        expressTags = _.uniq(expressTags.concat(config.tags)); 
        adhocTags   = _.uniq(adhocTags.concat(  config.tags)); 
    }

    var expressLogger = function (err, req, res, next, type) {
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
            'msg'          : (err ? (typeof err === 'string' ? err : err.message) : type),
            'pid'          : process.pid,
            'hostname'     : hostn,
            'host'         : req.host,
            'path'         : req.path,
            'query'        : Object.keys(req.query).length > 0 ? req.query : null,
            'protocol'     : req.protocol,
            'method'       : req.method,
            'status'       : res.statusCode,
            'remoteAddress': req.headers['x-forwarded-for'] || req.connection.remoteAddress ||
                            (req.socket        && req.socket.remoteAddress) || 
                            (req.socket.socket && req.socket.socket.remoteAddresss),
            'ua'           : req.header('user-agent'),
            'http'         : req.httpVersionMajor+'.'+req.httpVersionMinor,
            'sessionID'    : req.sessionID,
            'body'         : req.body && req.body.toString && req.body.toString().substring(0, Math.max(req.body.toString().length, 20)),
            'originalUrl'  : req.originalUrl,
            'referrer'     : req.referrer
        };

        client.log(fields, expressTags, function(err, result){
            if (err) {
                console.log(err.message);
            } else {
                console.log('Loggly:' + result);
            }
        });
        next(err);
    };

    return {
        //express middle ware
        requestLogger : function() {
            return function (req, res, next) {
                console.log('requestLogger');
                expressLogger(null, req, res, next, 'request');
            };
        },

        errorLogger : function() {
            return function (err, req, res, next) {
                console.log('errorLogger');
                expressLogger(err, req, res, next, 'error');
            };
        },

        //ad-hoc loggers
        info: function(msg) {
            client.log({
                'level'    : 'INFO',
                'msg'      : msg ? (typeof msg === 'string' ? msg : msg.message) : undefined,
                'pid'      : process.pid,
                'hostname' : hostn
            }, adhocTags);
        },
        warn: function(msg) {
            client.log({
                'level'    : 'WARN',
                'msg'      : msg ? (typeof msg === 'string' ? msg : msg.message) : undefined,
                'pid'      : process.pid,
                'hostname' : hostn
            }, adhocTags);
        },
        error: function(msg) {
            client.log({
                'level'    : 'ERROR',
                'msg'      : msg ? (typeof msg === 'string' ? msg : msg.message) : undefined,
                'pid'      : process.pid,
                'hostname' : hostn
            }, adhocTags);
        }
    };
    //ook loggen in textbestand met log4js, winston of bunyan
};
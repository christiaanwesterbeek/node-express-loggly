var loggly = require('loggly');
var config = require('../../../config'); // <!---- here now en nu naar Loggly..

var client = loggly.createClient(config.loggly);

//example by http://www.hacksparrow.com/how-to-write-midddleware-for-connect-express-js.html
//info on sequence: http://runnable.com/UTlPPV-f2W1TAAEf/custom-error-pages-in-express-for-node-js
//                  http://expressjs.com/guide.html#error-handling
//some other middleware for logging:
//  http://fabianosoriani.wordpress.com/2013/04/13/loggly-middleware-for-express-js-server-visibility/
//  

var logger = function (err, req, res, next) {
    console.log('express-loggly middleware function call....', err);
    if (err) {
        console.log('arguments', arguments)
    }
    //console.log(arguments);
    next(err);
}

module.exports.requestLogger = function(opts) {
    return function (req, res, next) {
        console.log('requestLogger')
        logger(null, req, res, next)
    }
};

module.exports.errorLogger = function(opts) {
     return function (err, req, res, next) {
        console.log('errorLogger')
        logger(err, req, res, next)
    }
    
};

    //ook loggen in textbestand met log4js, winston of bunyan

/*

  // Handle 404
  app.use(function(req, res) {
      res.status(400);
     res.render('404.jade', {title: '404: File Not Found'});
  });
  
  // Handle 500
  app.use(function(error, req, res, next) {
      res.status(500);
     res.render('500.jade', {title:'500: Internal Server Error', error: error});
  });

module.exports = function(opts) {
    var logger = module.exports.errorLogger(opts);
    return function(req, res, next) {
        logger(null, req, res, next);
    };
};

module.exports.errorLogger = function(opts) {
    var logger, opts = opts || {};
    return function(err, req, res, next) {
        if(err) console.log(err.stack);
        var app = req.app || res.app,
        status = res.statusCode,
        method = req.method,
        url = req.url || '-',
        referer = req.header('referer') || '-',
        ua = req.header('user-agent'),
        httpVersion = req.httpVersionMajor+'.'+req.httpVersionMinor,
        ip, logFn;


        if(!logger) {
            opts.name = (opts.name || app.settings.shortname || app.settings.name || app.settings.title || 'express');
            opts.serializers = opts.serializers || {};
            opts.serializers.req = opts.serializers.req || bunyan.stdSerializers.req;
            opts.serializers.res = opts.serializers.res || bunyan.stdSerializers.res;
            err && ( opts.serializers.err = opts.serializers.err || bunyan.stdSerializers.err);
            logger = bunyan.createLogger(opts);
        }

        if(err || status >= 500) { // server internal error or error
            logFn = logger.error;
        }else if (status >= 400) { // client error
            logFn = logger.warn;
        }else { // redirect/success
            logFn = logger.info;
        }

        ip = ip || req.ip || req.connection.remoteAddress ||
            (req.socket && req.socket.remoteAddress) || 
            (req.socket.socket && req.socket.socket.remoteAddresss) ||
            '127.0.0.1';

        var meta = {
            'remoteAddress': ip, 
            'method': method,
            'url': url,
            'referer': referer,
            'user-agent': ua,
            'body': req.body && req.body.toString && req.body.toString().substring(0, Math.max(req.body.toString().length, 20)),
            'http-version': httpVersion,
            "statusCode": status,
            'req': req,
            'res': res
        };

        err && (meta.err = err);

        logFn.call(logger, meta, [
            ip, '- -', method, url, 'HTTP/'+httpVersion, status, 
            res.get('Content-Length'), referer, ua.family, ua.major+'.'+ua.minor, ua.os, 
            err ? "error occurs" : ""].join(' '));

        next();
    };
};

*/

'use strict';


let fs = require('fs');
let path = require('path');
let http = require('http');
let url = require('url');

let logtopus = require('logtopus');
let log = logtopus.getLogger('govermentjs');
let superagent = require('superagent');
let Hashes = require('jshashes');
let jshash = new Hashes.SHA256();

class Goverment {
  constructor(conf) {
    this.rewriters = [];

    for (let key of Object.keys(conf.rewrites)) {
      let reg = new RegExp('^' + key.replace(/[\/.]/g, '\\$&'));
      this.rewriters.push({
        reg: reg,
        to: conf.rewrites[key]
      });
    }
  }

  request(ctx, requestUrl) {
    return new Promise(function(resolve, reject) {
      requestUrl = url.parse(requestUrl);

      let opts = {
        protocol: requestUrl.protocol,
        host: requestUrl.hostname,
        port: requestUrl.port,
        method: ctx.method,
        path: requestUrl.path,
        auth: requestUrl.auth || null
      };

      console.log('USE opts', opts);

      let requestHeaders = Object.assign({}, ctx.headers);
      // let requestCookies = Object.assign({}, ctx.cookies);

      if (requestHeaders.host) {
        delete requestHeaders.host;
      }

      if (requestHeaders.contentLength) {
        delete requestHeaders.contentLength;
      }

      opts.headers = requestHeaders;

      log.req('Send proxy call: ' + ctx.method + ' ' + requestUrl);
      log.debug('Request url:', requestUrl);
      log.debug('Request header:', requestHeaders);

      let httpReq = http.request(opts, res => {
        let bodyStream = [];
        res.on('data', chunk => {
          bodyStream.push(chunk);
        });

        res.on('end', () => {
          resolve({
            status: res.statusCode,
            message: res.statusMessage,
            body: bodyStream.join(''),
            // body: res,
            headers: res.headers,
          });
        });

        res.on('error', err => {
          console.log('RES ERROR!!!', err);
        });
      });

      httpReq.on('error', err => {
        console.log('RES ERR', err);
        if (err.code === 'ECONNREFUSED') {
          resolve({
            status: 503,
            body: 'Connection refused'
          });
        }
      });

      httpReq.end();
      return;

      let proxyRequest = superagent[ctx.method.toLowerCase()](url);
      proxyRequest.set(requestHeaders);
      proxyRequest.end(function(err, res) {
        // console.log('END', err, res);
        if (err) {
          return reject(err);
        }

        resolve(res);
      });
    })
  }

  rewrite(ctx) {
    let url = ctx.protocol + '://' + ctx.host + ctx.originalUrl;
    let requestUrl;

    for (let rw of this.rewriters) {
      if (rw.reg.test(url)) {
        return requestUrl = url.replace(rw.reg, rw.to);
      }
    }

    return url;
  }

  checkCache(ctx) {
    let hash = jshash.hex(ctx.originalUrl + ':' + ctx.get('platform') + ':' + ctx.get('clienttype'));
    log.debug('HASH', hash);
    try {
      let cached = require(path.join(__dirname, '../cache/' + hash + '.json'));
      log.debug(`Respond ${ctx.originalUrl} from cache`);
      // let stream = fs.createReadStream(path.join(__dirname, '../cache/' + hash + '.body'));
      let stream = fs.readfileSync(path.join(__dirname, '../cache/' + hash + '.body'), { encoding: 'utf8' });
      cached.body = stream;
      return cached;
    }
    catch (err) {
      return null;
    }
  }

  writeCache(ctx, str, bodyStream) {
    return new Promise(resolve => {
      let hash = jshash.hex(ctx.originalUrl + ':' + ctx.get('platform') + ':' + ctx.get('clienttype'));
      log.debug(`Cache response from ${ctx.originalUrl}`, hash);
      fs.writeFileSync(path.join(__dirname, '../cache/' + hash + '.json'), str);
      let writeable = fs.createWriteStream(path.join(__dirname, '../cache/' + hash + '.body'));
      // bodyStream.pipe(writeable);
      // bodyStream.on('end', () => {
      //   resolve(hash);
      // });
      fs.writeFileSync(path.join(__dirname, '../cache/' + hash + '.body'), bodyStream);
    });
  }
}

module.exports = Goverment;

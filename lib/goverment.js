'use strict';


let fs = require('fs');
let path = require('path');
let http = require('http');
let url = require('url');
let co = require('co');

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

  httpRequest(opts, body) {
    return new Promise((resolve, reject) => {
      let httpReq = http.request(opts, res => {
        log.info('Response', res.statusCode);
        resolve(res);
      });

      httpReq.on('error', () => {
        log.error(err);
        reject(err.message);
      });

      if (body) {
        body.on('data', (chunk) => {
          httpReq.write(chunk);
        });
        body.on('end', () => {
          httpReq.end()
        });

      } else {
        httpReq.end();
      }
    });

  }

  request(ctx, requestUrl) {
    return co(function * () {
      requestUrl = url.parse(requestUrl);

      const opts = {
        protocol: requestUrl.protocol,
        hostname: requestUrl.hostname,
        port: requestUrl.port,
        method: ctx.method,
        path: requestUrl.path,
        auth: requestUrl.auth || null
      };

      console.log('HEADERS', ctx.headers);

      let requestHeaders = Object.assign({}, ctx.headers);
      // let requestCookies = Object.assign({}, ctx.cookies);

      if (requestHeaders.host) {
        delete requestHeaders.host;
      }

      if (requestHeaders.contentLength) {
        delete requestHeaders.contentLength;
      }

      opts.headers = requestHeaders;

      log.req('Send proxy call: ' + ctx.method + ' ' + requestUrl.href);
      log.debug('Request url:', requestUrl);
      log.debug('Request header:', requestHeaders);

      let res = yield this.httpRequest(opts, ctx.req);

      let bodyReadStream = res;

      if (res.statusCode < 400) {
        bodyReadStream = yield this.writeCache(ctx, JSON.stringify({
          status: res.statusCode,
          message: res.statusMessage,
          headers: res.headers
        }), bodyReadStream);
      }

      return {
        status: res.statusCode,
        message: res.statusMessage,
        body: bodyReadStream,
        // body: res,
        headers: res.headers,
      };
    }.bind(this));
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
    if (ctx.method !== 'GET') {
      return null;
    }

    let hash = jshash.hex(ctx.originalUrl + ':' + ctx.get('platform') + ':' + ctx.get('clienttype'));
    log.debug('HASH', hash);
    try {
      let cached = require(path.join(__dirname, '../cache/' + hash + '.json'));
      log.debug(`Respond ${ctx.originalUrl} from cache`);
      let stream = fs.createReadStream(path.join(__dirname, '../cache/' + hash + '.body'));
      // let stream = fs.readfileSync(path.join(__dirname, '../cache/' + hash + '.body'), { encoding: 'utf8' });
      cached.body = stream;
      return cached;
    }
    catch (err) {
      return null;
    }
  }

  writeCache(ctx, str, bodyStream) {
    return new Promise((resolve, reject) => {
      let hash = jshash.hex(ctx.originalUrl + ':' + ctx.get('platform') + ':' + ctx.get('clienttype'));
      log.debug(`Cache response from ${ctx.originalUrl}`, hash);
      fs.writeFileSync(path.join(__dirname, '../cache/' + hash + '.json'), str);
      let writeable = fs.createWriteStream(path.join(__dirname, '../cache/' + hash + '.body'));
      bodyStream.pipe(writeable);
      writeable.on('finish', () => {
        console.log('WRITE FIN');
        let readStream = fs.createReadStream(path.join(__dirname, '../cache/' + hash + '.body'));
        resolve(readStream);
      });

      writeable.on('error', err => reject(err));
    });
  }
}

module.exports = Goverment;

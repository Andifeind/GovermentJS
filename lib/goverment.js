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

    log.debug('NEW', this.rewriters);
  }

  request(ctx, requestUrl) {
    return new Promise(function(resolve, reject) {
      console.log('CALL', requestUrl);
      requestUrl = url.parse(requestUrl);

      console.log('PARSED', requestUrl);

      let opts = {
        protocol: requestUrl.protocol,
        host: requestUrl.host,
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

      log.req('Send proxy call: ' + ctx.method + ' ' + url);
      log.debug('Request url:', url);
      log.debug('Request header:', requestHeaders);

      http.request(opts, (err, res) => {
        console.log('RES ERR', err);
        console.log('RES', res);
      });

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
  }

  checkCache(ctx) {
    let hash = jshash.hex(ctx.originalUrl + ':' + ctx.get('platform') + ':' + ctx.get('clienttype'));
    log.debug('HASH', hash);
    try {
      return require(path.join(__dirname, '../cache/' + hash + '.json'));
    }
    catch (err) {
      return null;
    }
  }

  writeCache(ctx, str) {
    let hash = jshash.hex(ctx.originalUrl + ':' + ctx.get('platform') + ':' + ctx.get('clienttype'));
    log.debug('write cache', hash);
    fs.writeFileSync(path.join(__dirname, '../cache/' + hash + '.json'), str);
  }
}

module.exports = Goverment;

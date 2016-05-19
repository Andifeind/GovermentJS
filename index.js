'use strict';

let logtopus = require('logtopus');
let superconf = require('superconf');
let koa = require('koa');

let conf = superconf('govermentjs');
let log = logtopus.getLogger('govermentjs');
let app = koa();

log.setLevel('debug');
let Goverment = require('./lib/goverment');
let goverment = new Goverment(conf);

app.use(logtopus.koa({
  logLevel: 'debug'
}));

app.use(function *(next) {
  let url = this.protocol + '://' + this.host + this.originalUrl;
  let requestUrl = goverment.rewrite(this, url);

  // Check cache
  let fromCache = goverment.checkCache(this);
  let res;
  let cacheHash;
  if (fromCache) {
    res = fromCache;
  }
  else {
    res = yield goverment.request(this, requestUrl);

    if (res.status < 400) {
      cacheHash = yield goverment.writeCache(this, JSON.stringify({
        status: res.status,
        message: res.message,
        headers: res.headers
      }), res.body);
    }
  }

  this.body = res.body;
  this.message = res.message;
  this.status = res.status;
  // ctx.body
  // ctx.body=
  // ctx.status
  // ctx.status=
  // ctx.message
  // ctx.message=
  // ctx.length=
  // ctx.length
  // ctx.type=
  // ctx.type
  // ctx.headerSent
  // ctx.redirect()
  // ctx.attachment()
  // ctx.set()
  // ctx.append()
  // ctx.remove()
  // ctx.lastModified=
  // ctx.etag=

  let proxyHeader = Object.assign({
    'X-Goverment-Request-Url': requestUrl,
    'X-Goverment-Cache-Hash': cacheHash
  }, res.headers);
  this.set(proxyHeader);
});

app.listen(4444);

app.on('error', function(err){
  log.error('server error', err);
  this.status = 500;
  if (err.statusCode) {
    this.status = err.statusCode
  }

  if (err.statusText) {
    this.body = err.statusText;
  }

});

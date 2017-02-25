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
  }

  this.body = res.body;
  this.message = res.message;
  this.status = res.status;
  let proxyHeader = Object.assign({
    'X-Goverment-Request-Url': requestUrl,
    'X-Goverment-Cache-Hash': cacheHash
  }, res.headers);

  if (proxyHeader['content-length']) {
    delete proxyHeader['content-length'];
  }

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

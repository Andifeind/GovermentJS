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
  if (fromCache) {
    res = fromCache;
  }
  else {
    res = yield goverment.request(this, requestUrl);

    goverment.writeCache(this, JSON.stringify({
      status: res.statusCode,
      message: res.statusText,
      body: res.body,
      headers: res.headers
    }));
  }

  // console.log('RES', res);
  this.body = res.body;
  this.message = res.res.statusText;
  this.status = res.res.statusCode;


  let proxyHeader = Object.assign({}, res.headers);
  this.set(proxyHeader);
});

app.listen(4444);

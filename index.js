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
      text: res.text,
      headers: res.headers
    }));
  }

  this.body = res.text;
  this.message = res.res ? res.res.statusText : res.message;
  this.status = res.res ? res.res.statusCode : res.status;

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

  let proxyHeader = Object.assign({}, res.headers);
  this.set(proxyHeader);
});

app.listen(4444);

'use strict';

let fs = require('fs');
let path = require('path');

let logtopus = require('logtopus');
let superconf = require('superconf');
let koa = require('koa');
let CoreIO = require('coreio');

CoreIO.httpPort = 4545;
CoreIO.staticDir(path.join(__dirname, 'public/'));

let conf = superconf('govermentjs');
let log = logtopus.getLogger('govermentjs');
let app = koa();

log.setLevel('debug');
let Goverment = require('./lib/goverment');
let goverment = new Goverment(conf);

goverment.observe().then((servers) => {
  console.log('Goverment observation started successfully!')
})

/*

const RequestList = CoreIO.createSyncList('requests', {

});

const requestList = new RequestList();

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
  if (false && fromCache) {
    res = fromCache;
  }
  else {
    res = yield goverment.request(this, requestUrl);
  }

  // console.log(res)

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

  // Update request log
  requestList.unshift({
    url,
    status: this.status,
    method: this.method,
    requestId: res.requestId,
    responseTime: res.responseTime
  });

  if (this.body && this.body.readable) {
    let body = ''
    this.body.on('data', (chunk) => body += chunk)
    this.body.on('end', () => {
      fs.appendFileSync(path.join(__dirname + '/logs/request.log'), JSON.stringify({
        time: Date(),
        url,
        status: this.status,
        method: this.method,
        requestId: res.requestId,
        responseTime: res.responseTime,
        body: body
      }) + '\n')
    })
  } else {
    fs.appendFileSync(path.join(__dirname + '/logs/request.log'), JSON.stringify({
      time: Date(),
      url,
      status: this.status,
      method: this.method,
      requestId: res.requestId,
      responseTime: res.responseTime,
      body: this.body
    }) + '\n')

  }
});

app.listen(4444);

app.on('error', function(err) {
  log.error('server error', err);
  this.status = 500;
  if (err.statusCode) {
    this.status = err.statusCode
  }

  if (err.statusText) {
    this.body = err.statusText;
  }
});

CoreIO.htmlPage('/', {
  title: 'GovermentJS log',
  scripts: ['/govermentjs.js'],
  styles: ['/styles/main.css']
});

*/

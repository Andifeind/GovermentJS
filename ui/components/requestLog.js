var FireCMP = require('firecmp');

var RequestLog = function RequestLog() {
  FireCMP.List.call(this);
};

RequestLog.prototype = Object.create(FireCMP.List.prototype);
RequestLog.prototype.constructor = RequestLog;

RequestLog.prototype.item = function(data) {
  return '<li>' +
    '<span class="method">' + data.method + '</span>' +
    '<span class="status">' + data.status + '</span>' +
    '<span class="url">' + data.url + '</span>' +
    '<span class="request-id">' + data.requestId + '</span>' +
    '<span class="response-time">' + data.responseTime + 'ms</span>' +
    '</li>';
};

RequestLog.prototype.init = function() {
  this.listen('click', (ev) => {
    this.showDetails();
  });
}

RequestLog.prototype.showDetails() {

}

module.exports = RequestLog;

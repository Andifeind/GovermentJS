var XQCore = require('xqcore');
var FireCMP = require('firecmp');
var RequestLogCmp = require('./components/requestLog');

var RequestList = XQCore.SyncList.inherit('requests', {

});

var requestLogCmp = new RequestLogCmp();

XQCore.couple({
  cmp: requestLogCmp,
  list: RequestList
});

document.addEventListener('DOMContentLoaded', function() {
  requestLogCmp.appendTo('body');
});

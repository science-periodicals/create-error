var http = require('http');

var codes = Object.keys(http.STATUS_CODES);
/**
 * can be called with:
 * - ()
 * - (err)
 * - (message)
 * - (code)
 * -------
 * - (code, message)
 * - (code, body)
 * - (code, err)
 * -------
 * - (err, resp, body)
 */
module.exports = function createError(arg1, arg2, arg3) {
  var err, code, body;

  if (arguments.length <= 1) {
    if (typeof arg1 === 'number') {
      err = new Error(http.STATUS_CODES[arg1] || '');
      code = arg1;
    } else if (typeof arg1 === 'string' || arg1 instanceof String) {
      var message;
      var re = new RegExp(arg1.replace(/_/g, ' '), 'i');
      for (var i = 0; i < codes.length; i++) {
        if (http.STATUS_CODES[codes[i]].match(re)) {
          code = codes[i];
          message = http.STATUS_CODES[codes[i]];
          break;
        }
      }
      err = new Error(message || arg1);
    } else if (arg1 instanceof Error) {
      err = arg1;
    } else {
      err = new Error();
    }
  }

  if (arguments.length === 2) {
    code = arg1;
    if (
      typeof arg2 === 'string' ||
      arg2 instanceof String ||
      Buffer.isBuffer(arg2)
    ) {
      try {
        body = JSON.parse(arg2);
      } catch (e) {
        err = new Error(arg2);
      }
    } else if (arg2 instanceof Error) {
      err = arg2;
    } else if (typeof arg2 === 'object') {
      body = arg2;
    } else {
      err = new Error();
    }
  }

  if (arguments.length === 3) {
    if (arg1) {
      err = arg1;
    }
    if (arg2) {
      code = arg2.statusCode;
    }
    if (arg3) {
      if (
        typeof arg3 == 'string' ||
        arg3 instanceof String ||
        Buffer.isBuffer(arg3)
      ) {
        try {
          arg3 = JSON.parse(arg3);
        } catch (e) {}
      }
      body = arg3;
    }
  }

  // auto handle: create error if code or body are problematic
  // !! Couchdb can return 200 or 201 with payload like:
  // [{
  //   "id" : "id1",
  //   "error" : "conflict",
  //   "reason" : "Document update conflict."
  // }]
  if (
    !err &&
    ((code && code >= 400) ||
      (body &&
        (body['@type'] === 'Error' ||
          body.error ||
          (Array.isArray(body) &&
            body.some(function(obj) {
              return (
                obj &&
                obj.error &&
                // science.ai data model can have document with an sa:error property => we make sure to exclude such JSON-LD documents
                !obj['@id'] &&
                !obj['@type'] &&
                !obj['@context']
              );
            }))))) // Couchb bulk_docs (statusCode will be 200 or 201 or 202 but still some ops may have failed...
  ) {
    // API / hydra error
    if (code == null && body.statusCode) {
      code = body.statusCode;
    }

    var message;
    var hasConflict;
    if (Array.isArray(body)) {
      var msgs = [];
      body.forEach(function(obj) {
        if (obj && typeof obj.error === 'string') {
          if (obj.error === 'conflict') {
            hasConflict = true;
          }
          var msg = obj.error;
          if (typeof obj.reason === 'string') {
            msg += ': ' + obj.reason;
          }
          if (!~msgs.indexOf(msg)) {
            msgs.push(msg);
          }
        }
      });
      message = msgs.join('; ');
    } else if (typeof body === 'string') {
      message = body;
    } else if (body) {
      if (typeof body.error === 'string' && typeof body.reason === 'string') {
        if (body.error === 'conflict') {
          hasConflict = true;
        }
        message = body.error + ': ' + body.reason;
      } else {
        message = body.error || body.reason || body.description || body.message;
      }
    }
    if (hasConflict && (!code || code < 300)) {
      code = 409;
    }
    err = new Error(typeof message === 'string' ? message : '');
  }

  if (!err) return null;

  if (!('code' in err)) {
    err.code = code == null ? 500 : code;
  }

  if (err.code == 'ENOENT') {
    err.code === 404;
  }

  return err;
};

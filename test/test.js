var assert = require('assert');
var createError = require('../');

describe('createError', function() {
  it('should return an error if called with no args', function() {
    var err = createError();
    assert(err instanceof Error);
  });

  it('should return the original error if passed as first argument', function() {
    var err = new Error('x');
    var _err = createError(err);
    assert.equal(err, _err);
  });

  it('should infer the status code for standard http error message', function() {
    var err = createError('not found');
    assert.equal(err.message, 'Not Found', 'standardize capitalization');
    assert.equal(err.code, 404);
  });

  it('should infer the correct message when called with http status code', function() {
    var err = createError(404);
    assert.equal(err.message, 'Not Found');
  });

  it('should work when called with code, message', function() {
    var err = createError(400, 'message');
    assert(err instanceof Error);
    assert.equal(err.code, 400);
    assert.equal(err.message, 'message');
  });

  it('should work when called with code and API resp body', function() {
    var err = createError(400, {
      '@type': 'Error',
      description: 'description'
    });
    assert(err instanceof Error);
    assert.equal(err.code, 400);
    assert.equal(err.message, 'description');
  });

  it('should work when called with code and API resp unparsed body', function() {
    var err = createError(
      400,
      JSON.stringify({
        '@type': 'Error',
        description: 'description'
      })
    );
    assert(err instanceof Error);
    assert.equal(err.code, 400);
    assert.equal(err.message, 'description');
  });

  it('should create an error from a request response', function() {
    var err = createError(null, { statusCode: 409 }, { reason: 'conflict' });
    assert(err instanceof Error);

    assert.equal(err.message, 'conflict');
    assert.equal(err.code, 409);
  });

  it('should return null if used with 3 args but a resp with a statusCode < 400', function() {
    assert.equal(createError(null, { statusCode: 200 }, 'body'), null);
  });

  it('should correctly handles couchdb returning a 201 with body.error defined', function() {
    var err = createError(null, { statusCode: 201 }, { error: 'forbidden' });
    assert(err instanceof Error);
    assert.equal(err.message, 'forbidden');
    assert.equal(err.code, 201);
  });

  it('should correctly handles couchdb bulk docs response containing errors', function() {
    var body = JSON.stringify([
      {
        id: 'id1',
        error: 'conflict',
        reason: 'Document update conflict.'
      },
      {
        id: 'id2',
        error: 'conflict',
        reason: 'Document update conflict.'
      }
    ]);

    var err = createError(null, { statusCode: 201 }, body);
    assert(err instanceof Error);
    assert.equal(err.message, 'conflict: Document update conflict.');
    assert.equal(err.code, 409, 'code should have been correctly infered');
  });

  it('should correctly handles couchdb bulk docs response containing JSON-LD document with an error property', function() {
    var body = JSON.stringify([
      {
        '@id': 'node:id1',
        error: 'conflict'
      }
    ]);

    var err = createError(null, { statusCode: 200 }, body);
    assert(!err);
  });

  it('should correctly handles cloudant returning an html body', function() {
    var err = createError(
      null,
      { statusCode: 400 },
      '<html><body>400 Bad Request. Your browser sent an invalid request.</body></html>'
    );
    assert(err instanceof Error);
    assert.equal(
      err.message,
      '<html><body>400 Bad Request. Your browser sent an invalid request.</body></html>'
    );
    assert.equal(err.code, 400);
  });
});

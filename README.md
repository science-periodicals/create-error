# @scipe/create-error

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

[![CircleCI](https://circleci.com/gh/science-periodicals/create-error.svg?style=svg&circle-token=2f17bcdffa287be1bb85138596042f0e5f1a3235)](https://circleci.com/gh/science-periodicals/create-error)

Note: this module is auto published to npm on CircleCI. Only run `npm version
patch|minor|major` and let CI do the rest.

## Create an error with a code property

```js
import createError from '@scipe/create-error';

createError();
createError(404);
createError('not found');
createError(404, 'not found');
```

## Automatically handle CouchDB and API responses (from request or XHR)

```js
import createError from '@scipe/create-error';
import request from 'request';

request('http://example.com/couchdb', (err, resp, body) => {
  if (err = createError(err, resp, body)) {
    return callback(err);
  }

  // no error, we can process body
});
```

## License

`@scipe/create-error` is dual-licensed under commercial and open source licenses
([AGPLv3](https://www.gnu.org/licenses/agpl-3.0.en.html)) based on the intended
use case. Contact us to learn which license applies to your use case.

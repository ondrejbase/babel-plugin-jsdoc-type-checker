# babel-plugin-jsdoc-type-checker
Babel plugin for type checking based on JSDoc comments in selected environments.

## Installation
```sh
npm install babel-plugin-jsdoc-type-checker --save-dev
```

## Usage

### CLI

```sh
$ browserify script.js -o bundle.js -t [ babelify --plugins [ babel-plugin-jsdoc-type-checker ] ]
```

### Node

```javascript
var fs = require('fs');
var browserify = require('browserify');
browserify('./script.js')
  .transform('babelify', { plugins: ['babel-plugin-jsdoc-type-checker'] })
  .bundle()
  .pipe(fs.createWriteStream('bundle.js'));
```

## Example

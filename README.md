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

## Options

### `checkerTag`

`string`, defaults to `'type-checked'`

The plugin generates a type checking code only in class methods with a JSDoc
comment block that contain a tag that equals to this option's value. 

### `checkingTemplate`

`string`, defaults to
`
`if (\${condition}) {
	throw new TypeError(\${errorMessage});
}` `

This option determinates how the generated code looks like. Its value is an ES6 template string with some escaped placeholders:
- `\${condition}` is a placeholder for a generated condition,
- `\${errorMessage}` is a placeholder for a generated error message.

### `supportedEnvironments`

`string[]`, defaults to `['dev', 'development', 'test']`

An array of environments in which the plugin generates a type checking code. If `process.env.NODE_ENV` equals to some of these items, the plugin will generate the code.

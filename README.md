# babel-plugin-jsdoc-type-checker
Babel plugin that generates a type checking code based on JSDoc comments in supported environments (configurable by [`supportedEnvironments` option](#supportedenvironments)).

## Example

This ES6 code:

```javascript
/**
 * Class Foo.
 */
class Foo {
  /**
   * Returns the sum of x, y (optional).
   *
   * @type-checked
   * @param {number} x The first number.
   * @param {number} [y=0] The second number.
   * @return {number} The sum of x and y.
   */
  sum(x, y = 0) {
    return x + y;
  }
}
```

Will be transformed to:

```javascript
/**
 * Class Foo.
 */
class Foo {
  /**
   * Returns the sum of x, y (optional).
   *
   * @type-checked
   * @param {number} x The first number.
   * @param {number} [y=0] The second number.
   * @return {number} The sum of x and y.
   */
  sum(x, y = 0) {
    if (typeof x !== 'number') {
      throw new TypeError('Argument x must be a number.');
    }
		
    if (y !== null && y !== undefined && typeof y !== 'number') {
      throw new TypeError('Argument y (optional) must be a number.');
    }

    return x + y;
  }
}
```

It transforms only ES6 class methods that have JSDoc comment blocks with `@type-checked` tag (configurable by [`checkerTag` option](#checkertag)) or are members of a class with a JSDoc comment block containing `@type-checked` tag.

The generated code is configurable by [`checkingTemplate` option](#checkingtemplate). A custom generated code can look like this:

```javascript
/**
 * Class Foo.
 */
class Foo {
  /**
   * Returns the sum of x, y (optional).
   *
   * @type-checked
   * @param {number} x The first number.
   * @param {number} [y=0] The second number.
   * @return {number} The sum of x and y.
   */
  sum(x, y = 0) {
    invariant(!(typeof x !== 'number'), 'Argument x must be a number.');
    invariant(!(y !== null && y !== undefined && typeof y !== 'number'), 'Argument y (optional) must be a number.');
    return x + y;
  }
}
```

This generated code contains [Facebook's `invariant`](https://www.npmjs.com/package/invariant). You could generate a code that like this, if you set `checkingTemplate` option to `` `invariant(!(\${condition}), \${errorMessage});` ``.

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
``
`if (\${condition}) {
	throw new TypeError(\${errorMessage});
}` ``

This option determinates how the generated code looks like. Its value is an ES6 template string with some escaped placeholders:
- `\${condition}` is a placeholder for a generated condition,
- `\${errorMessage}` is a placeholder for a generated error message.

### `supportedEnvironments`

`string[]`, defaults to `['dev', 'development', 'test']`

An array of environments in which the plugin generates a type checking code. If `process.env.NODE_ENV` equals to some of these items, the plugin will generate the code.

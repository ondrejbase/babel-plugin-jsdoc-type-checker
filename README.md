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
   * @typechecked
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
   * @typechecked
   * @param {number} x The first number.
   * @param {number} [y=0] The second number.
   * @return {number} The sum of x and y.
   */
  sum(x, y = 0) {
    if (typeof x !== 'number') {
      throw new TypeError('Foo.sum(x, [y]): Argument x expected to be a number.');
    }
		
    if (y !== null && y !== undefined && typeof y !== 'number') {
      throw new TypeError('Foo.sum(x, [y]): Argument [y] expected to be a number.');
    }

    return x + y;
  }
}
```

It transforms only ES6 class methods that have JSDoc comment blocks with `@typechecked` tag (configurable by [`checkerTag` option](#checkertag)) or are members of a class with a JSDoc comment block containing `@typechecked` tag.

The generated code is configurable by [`checkingTemplate` option](#checkingtemplate). A custom generated code can look like this:

```javascript
/**
 * Class Foo.
 */
class Foo {
  /**
   * Returns the sum of x, y (optional).
   *
   * @typechecked
   * @param {number} x The first number.
   * @param {number} [y=0] The second number.
   * @return {number} The sum of x and y.
   */
  sum(x, y = 0) {
    invariant(!(typeof x !== 'number'), 'Foo.sum(x, [y]): Argument x expected to be a number.');
    invariant(!(y !== null && y !== undefined && typeof y !== 'number'), 'Foo.sum(x, [y]): Argument [y] expected to be a number.');
    return x + y;
  }
}
```

This generated code contains [Facebook's `invariant`](https://www.npmjs.com/package/invariant). You could generate a code that like this, if you set `checkingTemplate` option to `` `invariant(!(\${condition}), '\${className}.\${methodName}(\${paramsList}): Argument \${paramName} expected to be \${expectedType}.');` ``.

It also supports `@typedef` tags.

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

`string`, defaults to `'typechecked'`

The plugin generates a type checking code only in class methods with a JSDoc
comment block that contain a tag that equals to this option's value. 

### `checkingTemplate`

`string`, defaults to
``
`if (\${condition}) {
	throw new TypeError('\${className}.\${methodName}(\${paramsList}): Argument \${paramName} expected to be \${expectedType}.');
}` ``

This option determinates how the generated code looks like. Its value is an ES6 template string with some escaped placeholders:
- `\${className}` is a name of the class, in which we are checking the type,
- `\${condition}` is a placeholder for a generated condition,
- `\${expectedType}` is an expected type of the parameter, that is being checked, 
- `\${methodName}` is a name of the method, in which we are checking the type,
- `\${paramName}` is a name of the parameter, that is being checked (a name of
  the parameter is enclosed into square brackets `[]`, if the parameter is optional)
- `\${paramList}` is a list of the method's parameters,

### `importTemplate`

`string`, defaults to `''`

The plugin generates an import statement automatically if you set this option, but only if an identical import statement is not present in the code.
Example value: `` `import invariant from 'invariant';` ``

### `supportedEnvironments`

`string[]`, defaults to `['dev', 'development', 'test']`

An array of environments in which the plugin generates a type checking code. If `process.env.NODE_ENV` equals to some of these items, the plugin will generate the code.

import { transform } from 'babel-core';
import plugin from '../main';

describe('main', () => {
	const ORIGINAL_ENV = process.env;
	const TRANSFORM_OPTIONS = { plugins: [plugin] };

	function setNodeEnv(env) {
		process.env = Object.assign({}, process.env, { NODE_ENV: env });
	}

	beforeEach(() => {
		setNodeEnv('dev');
	});

	afterEach(() => {
		process.env = ORIGINAL_ENV;
	});

	it('should prepend a type checking to Foo#sum()', () => {
		const { code } = transform(
			`
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
			}`,
			TRANSFORM_OPTIONS
		);
		expect(code).toMatchSnapshot();
	});

	it('should prepend a type checking to Foo#concat()', () => {
		const { code } = transform(
			`
			/**
			 * Class Foo.
			 */
			class Foo {
				/**
				 * Concats strings x and y (optional).
				 *
				 * @type-checked
				 * @param {string} x The first string.
				 * @param {string} [y=''] The second string.
				 * @return {string} The concatenation of x and y.
				 */
				concat(x, y = '') {
					return x + y;
				}
			}`,
			TRANSFORM_OPTIONS
		);
		expect(code).toMatchSnapshot();
	});

	it('should prepend a type checking to Foo#and()', () => {
		const { code } = transform(
			`
			/**
			 * Class Foo.
			 */
			class Foo {
				/**
				 * Computes a logical AND of x and y (optional).
				 *
				 * @type-checked
				 * @param {boolean} x The first boolean value.
				 * @param {boolean=} y The second boolean value.
				 * @return {boolean} The logical and of x and y.
				 */
				and(x, y) {
					return x &&
						(y !== null && y !== undefined ? y : true);
				}
			}`,
			TRANSFORM_OPTIONS
		);
		expect(code).toMatchSnapshot();
	});

	it('should prepend a type checking to Foo#push()', () => {
		const { code } = transform(
			`
			/**
			 * Class Foo.
			 */
			class Foo {
				/**
				 * Adds one or more elements to the end of an array and returns
				 * the new length of the array.
				 *
				 * @type-checked
				 * @param {Array} arr The array to be extended.
				 * @param {...*} [elements] The elements to add to the end of
				 *        the array.
				 * @return {number} The new length property of the array.
				 */
				push(arr, ...elements) {
					return arr.push(elements);
				}
			}`,
			TRANSFORM_OPTIONS
		);
		expect(code).toMatchSnapshot();
	});

	it('should prepend a type checking to Foo#toString()', () => {
		const { code } = transform(
			`
			/**
			 * Class Foo.
			 */
			class Foo {
				/**
				 * Returns a string representing the object.
				 *
				 * @type-checked
				 * @param {object} obj The object to be represented as
				 *        a string.
				 * @return {string} A string representing the object.
				 */
				toString(obj) {
					return obj.toString();
				}
			}`,
			TRANSFORM_OPTIONS
		);
		expect(code).toMatchSnapshot();
	});

	it('should prepend a type checking to Foo#processUserInput()', () => {
		const { code } = transform(
			`
			/**
			 * Class Foo.
			 */
			class Foo {
				/**
				 * Waits for a user input and then calls a callback.
				 *
				 * @type-checked
				 * @param {function} callback A callback which is called with
				 *        a user input as an argument.
				 */
				processUserInput(callback) {
					var name = prompt('Please enter your name.');
  					callback(name);
				}
			}`,
			TRANSFORM_OPTIONS
		);
		expect(code).toMatchSnapshot();
	});

	it('should prepend a type checking to Foo#size() and Foo#size2()', () => {
		const { code } = transform(
			`
			/**
			 * Class Foo.
			 */
			class Foo {
				/**
				 * Counts properties of the object.
				 *
				 * @type-checked
				 * @param {!object=} obj The object.
				 * @return {number} A count of the object's properties.
				 */
				size(obj) {
					return Object.keys(obj).length;
				}

				/**
				 * Counts properties of the object.
				 *
				 * @type-checked
				 * @param {?object=} obj The object or null.
				 * @return {number} A count of the object's properties.
				 */
				size2(obj) {
					return Object.keys(obj || {}).length;
				}
			}`,
			TRANSFORM_OPTIONS
		);
		expect(code).toMatchSnapshot();
	});

	it('should prepend a type checking to Foo#sumArray() and Foo#sumArray2()', () => {
		const { code } = transform(
			`
			/**
			 * Class Foo.
			 */
			class Foo {
				/**
				 * Returns a sum of all numbers stored in the array.
				 *
				 * @type-checked
				 * @param {Array.<number>} arr An array of numbers.
				 * @return {number} The sum of all numbers.
				 */
				sumArray(arr) {
					return arr.reduce((total, x) => total + x, 0);
				}

				/**
				 * Returns a sum of all numbers stored in inner arrays.
				 *
				 * @type-checked
				 * @param {Array.<Array.<number>>} [arr] An array of arrays of
				 *        numbers.
				 * @return {number} The sum of all numbers.
				 */
				sumArray2(arr) {
					return (arr || []).reduce(
						(total, innerArr) => total + innerArr.reduce(
							(total, x) => total + x,
							0
						),
						0
					);
				}
			}`,
			TRANSFORM_OPTIONS
		);
		expect(code).toMatchSnapshot();
	});

	it('should prepend a type checking to Foo#joinArray() and Foo#joinArray2()', () => {
		const { code } = transform(
			`
			/**
			 * Class Foo.
			 */
			class Foo {
				/**
				 * Joins the elements of an array into a string, and returns the
				 * string.
				 *
				 * @type-checked
				 * @param {string[]} arr An array of strings.
				 * @return {string} [separator=','] The separator to be used.
				 * @return {string} A String, representing the array values,
				 *         separated by the specified separator.
				 */
				joinArray(arr, separator = ',') {
					return arr.join(separator);
				}

				/**
				 * Joins the elements of an array into a string, and returns the
				 * string.
				 *
				 * @type-checked
				 * @param {Array<string>=} arr An array of strings.
				 * @return {string} [separator=','] The separator to be used.
				 * @return {string} A String, representing the array values,
				 *         separated by the specified separator.
				 */
				joinArray2(arr, separator = ',') {
					return (arr || []).join(separator);
				}				
			}`,
			TRANSFORM_OPTIONS
		);
		expect(code).toMatchSnapshot();
	});

	it('should prepend a type checking to Foo#negate() and Foo#negate2()', () => {
		const { code } = transform(
			`
			/**
			 * Class Foo.
			 */
			class Foo {
				/**
				 * Negates the given value.
				 *
				 * @type-checked
				 * @param {(boolean|number|string)} value A value.
				 * @return {boolean} The logically negated value.
				 */
				negate(value) {
					return !value;
				}

				/**
				 * Negates the given value.
				 *
				 * @type-checked
				 * @param {!(boolean|number|string)=} value A value.
				 * @return {boolean} The logically negated value.
				 */
				negate2(value) {
					return !value;
				}				
			}`,
			TRANSFORM_OPTIONS
		);
		expect(code).toMatchSnapshot();
	});

	it('should prepend a type checking to Foo#sumObj() and Foo#sumObj2()', () => {
		const { code } = transform(
			`
			/**
			 * Class Foo.
			 */
			class Foo {
				/**
				 * Returns a sum of all numbers stored in the object.
				 *
				 * @type-checked
				 * @param {Object.<string, number>} obj An object with numbers
				 *        as property values.
				 * @return {number} The sum of all numbers.
				 */
				sumObj(obj) {
					return Object.keys(obj).reduce(
						(total, key) => total + obj[key],
						0
					);
				}

				/**
				 * Returns a sum of all numbers stored in the object.
				 *
				 * @type-checked
				 * @param {Object<string, number>=} obj An object with numbers
				 *        as property values.
				 * @return {number} The sum of all numbers.
				 */
				sumObj2(obj) {
					return Object.keys(obj).reduce(
						(total, key) => total + obj[key],
						0
					);
				}
			}`,
			TRANSFORM_OPTIONS
		);
		expect(code).toMatchSnapshot();
	});

	it('should prepend a type checking to Foo#toCAB() and Foo#toCAB2()', () => {
		const { code } = transform(
			`
			/**
			 * Class Foo.
			 */
			class Foo {
				/**
				 * Returns a string representation of the object with c value
				 * first, a value second and b value third.
				 *
				 * @type-checked
				 * @param {{a: number, b: string, c}} obj An object with a, b
				 *        and c properties.
				 * @return {string} A string representation of the object in
				 *         format 'cab'.
				 */
				toCAB(obj) {
					const { a, b, c } = obj;

					return String(c) + a + b;
				}

				/**
				 * Returns a string representation of the object with c value
				 * first, a value second and b value third.
				 *
				 * @type-checked
				 * @param {{a: !number, b: ?string, c}=} obj An object with a, b
				 *        and c properties.
				 * @return {string} A string representation of the object in
				 *         format 'cab'.
				 */
				toCAB2(obj) {
					const { a, b, c } = obj || {};

					return String(c) + a + b;
				}
			}`,
			TRANSFORM_OPTIONS
		);
		expect(code).toMatchSnapshot();
	});

	it('should prepend a type checking to Foo#toCBAD() and Foo#toCBAD2', () => {
		const { code } = transform(
			`
			/**
			 * Class Foo.
			 */
			class Foo {
				/**
				 * Returns a string representation of the object with c value
				 * first, b value second, a value third and d value fourth.
				 *
				 * @type-checked
				 * @param {Object} obj An object with a, b and c properties.
				 * @param {number} obj.a Property a.
				 * @param {string} [obj.b] Property b.
				 * @param {*} obj.c Property c.
				 * @param {string} d Value d.
				 * @return {string} A string representation of the object in
				 *         format 'cbad'.
				 */
				toCBAD(obj, d) {
					const { a, b, c } = obj;

					return String(c) + b + a + d;
				}

				/**
				 * Returns a string representation of the object with c value
				 * first, b value second, a value third and d value fourth.
				 *
				 * @type-checked
				 * @param {Object=} obj An object with a and inner properties.
				 * @param {number=} obj.a Property a.
				 * @param {Object=} obj.inner An inner object with b and c
				 *        properties.
				 * @param {?string} obj.inner.b Property b.
				 * @param {*} obj.inner.c Property c.
				 * @param {string} d Value d.
				 * @return {string} A string representation of the object in
				 *         format 'cbad'.
				 */
				toCBAD2(obj, d) {
					const { a, inner } = obj || {};
					const { b, c } = inner || {};

					return String(c) + b + a + d;
				}
			}`,
			TRANSFORM_OPTIONS
		);
		expect(code).toMatchSnapshot();
	});
});

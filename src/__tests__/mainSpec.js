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

	it('should', () => {
		const { code } = transform(
			`
			/**
			 * Class Foo.
			 */
			class Foo {
				/**
				 * Adds up two numbers.
				 *
				 * @param {number} x A first number.
				 * @param {number} y A second number.
				 * @return The sum.
				 */
				addUp(x, y) {
					return x + y;
				}
			}`,
			TRANSFORM_OPTIONS
		);
		expect(code).toMatchSnapshot();
	});
});

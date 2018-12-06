/**
 * TypeChecker class generates type checking code based on JSDoc comments in
 * selected environments.
 */
class TypeChecker {
	/**
	 * Gets the plugin object itself.
	 *
	 * @see https://github.com/thejameskyle/babel-handbook/blob/master/translations/en/plugin-handbook.md#toc-writing-your-first-babel-plugin
	 * @param {object} babel The current `babel` object.
	 * @return {object} The plugin object.
	 */
	getPluginObject({ types: t }) {
		if (!t) {
			this._error(
				new TypeError(
					'The first argument must be the current babel object.'
				)
			);

			return {};
		}

		return {
			visitor: {
				ClassDeclaration: path => {
					const { node } = path;
					//console.log(node);
				},
				ClassMethod: path => {
					const { node } = path;
					const { leadingComments } = node;

					if (!leadingComments) {
						return;
					}

					const lastCommentBlock = leadingComments.reduce(
						(accumulator, comment) => {
							if (comment.type === 'CommentBlock') {
								accumulator = comment.value;
							}

							return accumulator;
						}
					);
					console.log(lastCommentBlock);
				}
			}
		};
	}

	/**
	 * Checks if this plugin should generate a type checking code.
	 *
	 * @param {string} [environment=process.env.NODE_ENV] The environment.
	 * @return {boolean} `true` when it should generate a type checking code,
	 *         otherwise `false`.
	 */
	_shouldGenerateTypeChecking(environment = process.env.NODE_ENV) {
		if (!environment || typeof environment !== 'string') {
			this._error(
				new TypeError('Argument environment must be a string.')
			);

			return false;
		}

		return ['dev', 'test'].includes(environment);
	}

	/**
	 * Outputs an error message.
	 *
	 * @param {...*} message An error message.
	 */
	_error(message) {
		console.error(...message);
	}
}

export const checker = new TypeChecker();
export default checker.getPluginObject.bind(checker);

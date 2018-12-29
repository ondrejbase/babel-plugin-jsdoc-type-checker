import codeGenerator from './codeGenerator';
import Comment from './Comment';
import Options from './Options';

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
			throw new TypeError(
				'The first argument must be the current babel object.'
			);
		}

		return {
			visitor: {
				ClassDeclaration: path => {
					const { node } = path;
					//console.log(node);
				},
				ClassMethod: (path, state) => {
					const options = new Options(state.opts);
					const { node } = path;
					const { leadingComments } = node;

					if (
						!options.shouldGenerateTypeCheckingCode() ||
						!leadingComments
					) {
						return;
					}

					let properComment;
					[...leadingComments].reverse().some(commentBlock => {
						if (commentBlock.type === 'CommentBlock') {
							const comment = new Comment(
								`/*${commentBlock.value}*/`
							);
							if (comment.hasTag('type-checked')) {
								properComment = comment;

								return true;
							}
						}
					});

					if (!properComment) {
						return;
					}

					const generatedNodes = codeGenerator.generateNodes(
						options.checkingTemplate,
						properComment
					);

					if (generatedNodes) {
						node.body.body.unshift(...generatedNodes);
					}
				}
			}
		};
	}
}

export const checker = new TypeChecker();
export default checker.getPluginObject.bind(checker);

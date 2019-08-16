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
				ClassMethod: (path, state) => {
					const options = new Options(state.opts);

					if (!options.shouldGenerateTypeCheckingCode()) {
						return;
					}

					const { node: classNode } =
						path.findParent(
							({ node }) =>
								node && node.type === 'ClassDeclaration'
						) || {};
					let properClassComment;

					if (classNode) {
						properClassComment = this._findProperComment(
							classNode,
							options
						);
					}

					const { node } = path;
					const properComment = this._findProperComment(
						node,
						options,
						!properClassComment
					);

					if (!properComment) {
						return;
					}

					const generatedNodes = codeGenerator.generateNodes(
						options.checkingTemplate,
						properComment,
						path
					);

					if (generatedNodes) {
						node.body.body.unshift(...generatedNodes);

						if (options.importTemplate) {
							const importNodes = codeGenerator.generateImport(
								options.importTemplate
							);

							if (
								!importNodes ||
								!importNodes[0] ||
								this._findIdenticalImport(path, importNodes[0])
							) {
								return;
							}

							path.hub.file.ast.program.body.unshift(
								...importNodes
							);
						}
					}
				}
			}
		};
	}

	_findProperComment(node, options, mustHaveCheckerTag = true) {
		const { leadingComments } = node || {};

		if (!leadingComments) {
			return null;
		}

		let properComment = null;
		[...leadingComments].reverse().some(commentBlock => {
			if (commentBlock.type === 'CommentBlock') {
				const comment = new Comment(`/*${commentBlock.value}*/`);

				if (!mustHaveCheckerTag || comment.hasTag(options.checkerTag)) {
					properComment = comment;

					return true;
				}
			}
		});

		return properComment;
	}

	_findIdenticalImport(path, importNode) {
		if (!importNode || importNode.type !== 'ImportDeclaration') {
			return false;
		}

		return importNode.specifiers.some(specifier => {
			const localName = specifier.local.name;

			return path.hub.file.ast.program.body.some(
				node =>
					node.type === 'ImportDeclaration' &&
					node.specifiers.some(
						specifier => specifier.local.name === localName
					)
			);
		});
	}
}

export const checker = new TypeChecker();
export default checker.getPluginObject.bind(checker);

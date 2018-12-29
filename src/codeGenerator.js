import { parse } from '@babel/parser';
import fillTemplate from 'es6-dynamic-template';
import Comment from './Comment';

class CodeGenerator {
	generateNodes(template, comment) {
		const code = this.generateCode(template, comment);

		if (!code) {
			return null;
		}

		const ast = parse(code, {
			allowAwaitOutsideFunction: true,
			allowReturnOutsideFunction: true
		});

		if (
			ast &&
			ast.program &&
			ast.program.body &&
			ast.program.body.length > 0
		) {
			return ast.program.body;
		} else {
			return null;
		}
	}

	generateCode(template, comment) {
		if (!template || typeof template !== 'string') {
			throw new TypeError('Argument template must be a string.');
		}

		if (!comment || !(comment instanceof Comment)) {
			throw new TypeError(
				'Argument comment must be an instanceof Comment.'
			);
		}

		const params = comment.getParams();

		if (!params) {
			return null;
		}

		const codeFragments = [];
		params.forEach((param, index) => {
			const { conditions, errorMessages } =
				this._getConditionsAndMessagesByParam(param, index) || {};

			if (
				!conditions ||
				!errorMessages ||
				conditions.length !== errorMessages.length
			) {
				return;
			}

			conditions.forEach((condition, index) => {
				codeFragments.push(
					fillTemplate(template, {
						condition,
						errorMessage: errorMessages[index]
					})
				);
			});
		});

		return codeFragments.join('\n');
	}

	_getConditionsAndMessagesByParam(param, index) {
		let { name, type, optional } = param;
		let conditions = [];
		let errorMessages = [];
		let nullable = false;
		let notNullable = false;

		/* The param has been defined as optional with equals sign at the end
		 * of the param type. For example: @param {number=} x The X.
		 */
		if (
			type.type === 'OPTIONAL' &&
			type.meta &&
			type.meta.syntax === 'SUFFIX_EQUALS_SIGN' &&
			type.value
		) {
			type = type.value;
			optional = true;
		}

		/* The param has been defined as nullable with a question mark at the
		 * beginning of the param type. For example: @param {?number} x The X.
		 */
		if (
			type.type === 'NULLABLE' &&
			type.meta &&
			type.meta.syntax === 'PREFIX_QUESTION_MARK' &&
			type.value
		) {
			type = type.value;
			nullable = true;
		}

		/* The param has been defined as not nullable with an asterisk at the
		 * beginning of the param type. For example: @param {!number} x The X.
		 */
		if (
			type.type === 'NOT_NULLABLE' &&
			type.meta &&
			type.meta.syntax === 'PREFIX_BANG' &&
			type.value
		) {
			type = type.value;
			notNullable = true;
		}

		// A type is written between ().
		if (type.type === 'PARENTHESIS' && type.value) {
			type = type.value;
		}

		if (type.type === 'NAME') {
			const typeName = type.name.toLowerCase();
			const conditionPrefix = optional
				? `${name} !== null && ${name} !== undefined &&`
				: '';
			const conditionSuffix = nullable
				? `&& ${name} !== null`
				: notNullable
				? `|| ${name} === null`
				: '';

			switch (typeName) {
				case 'number':
					conditions.push(
						conditionPrefix +
							`typeof ${name} !== 'number'` +
							conditionSuffix
					);
					errorMessages.push(
						`Argument ${name}${
							optional ? ' (optional)' : ''
						} must be a number.`
					);
					break;
				case 'string':
					conditions.push(
						conditionPrefix +
							`typeof ${name} !== 'string'` +
							conditionSuffix
					);
					errorMessages.push(
						`Argument ${name}${
							optional ? ' (optional)' : ''
						} must be a string.`
					);
					break;
				case 'boolean':
					conditions.push(
						conditionPrefix +
							`typeof ${name} !== 'boolean'` +
							conditionSuffix
					);
					errorMessages.push(
						`Argument ${name}${
							optional ? ' (optional)' : ''
						} must be a boolean.`
					);
					break;
				case 'array':
					conditions.push(
						conditionPrefix +
							`Object.prototype.toString` +
							`.call(${name}) !== '[object Array]'` +
							conditionSuffix
					);
					errorMessages.push(
						`Argument ${name}${
							optional ? ' (optional)' : ''
						} must be an array.`
					);
					break;
				case 'object':
					conditions.push(
						conditionPrefix +
							`Object.prototype.toString` +
							`.call(${name}) !== '[object Object]'` +
							conditionSuffix
					);
					errorMessages.push(
						`Argument ${name}${
							optional ? ' (optional)' : ''
						} must be an object.`
					);
					break;
				default:
					return null;
			}
		} else if (
			type.type === 'GENERIC' &&
			type.subject &&
			type.subject.type === 'NAME'
		) {
			const typeName = type.subject.name.toLowerCase();

			switch (typeName) {
				case 'array': {
					const {
						conditions: arrayConditions,
						errorMessages: arrayErrorMessages
					} = this._getConditionsAndMessagesByParam(
						Object.assign({}, param, { type: type.subject })
					);

					if (arrayConditions && arrayErrorMessages) {
						conditions = conditions.concat(arrayConditions);
						errorMessages = errorMessages.concat(
							arrayErrorMessages
						);
					}

					if (!type.objects || !type.objects.length) {
						break;
					}

					let {
						conditions: itemConditions,
						errorMessages: itemErrorMessages
					} = this._getConditionsAndMessagesByParam({
						type: type.objects[0],
						optional: false,
						name: `${name}[0]`
					});

					if (itemConditions && itemErrorMessages) {
						itemConditions = itemConditions.map(
							condition =>
								`Object.prototype.toString` +
								`.call(${name}) === '[object Array]' &&` +
								`${name}.length > 0 && (${condition})`
						);
						conditions = conditions.concat(itemConditions);
						errorMessages = errorMessages.concat(itemErrorMessages);
					}

					break;
				}
				default:
					return null;
			}
		} else if (
			type.type === 'UNION' &&
			type.meta &&
			type.meta.syntax === 'PIPE' &&
			type.left &&
			type.right
		) {
			const {
				conditions: leftConditions,
				errorMessages: leftErrorMessages
			} = this._getConditionsAndMessagesByParam(
				Object.assign({}, param, { type: type.left })
			);
			const {
				conditions: rightConditions,
				errorMessages: rightErrorMessages
			} = this._getConditionsAndMessagesByParam(
				Object.assign({}, param, { type: type.right })
			);

			if (
				leftConditions &&
				leftErrorMessages &&
				rightConditions &&
				rightErrorMessages
			) {
				const maxConditionsCount = Math.max(
					leftConditions.length,
					rightConditions.length
				);

				for (let i = 0; i < maxConditionsCount; i++) {
					const leftCondition = leftConditions[i] || null;
					const leftErrorMessage = leftErrorMessages[i] || null;
					const rightCondition = rightConditions[i] || null;
					const rightErrorMessage = rightErrorMessages[i] || null;

					if (
						leftCondition &&
						leftErrorMessage &&
						rightCondition &&
						rightErrorMessage
					) {
						conditions.push(
							`(${leftCondition}) && (${rightCondition})`
						);
						errorMessages.push(
							`${leftErrorMessage} OR ${rightErrorMessage}`
						);
					} else if (leftCondition && leftErrorMessage) {
						conditions.push(leftCondition);
						errorMessages.push(rightCondition);
					} else if (rightCondition && rightErrorMessage) {
						conditions.push(rightCondition);
						errorMessages.push(rightErrorMessage);
					}
				}
			} else if (leftConditions && leftErrorMessages) {
				conditions.push(...leftConditions);
				errorMessages.push(...leftErrorMessages);
			} else if (rightConditions && rightErrorMessages) {
				conditions.push(...rightConditions);
				errorMessages.push(...rightErrorMessages);
			}
		}

		return { conditions, errorMessages };
	}
}

export default new CodeGenerator();

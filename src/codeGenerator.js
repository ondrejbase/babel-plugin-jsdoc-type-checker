import { parse } from '@babel/parser';
import fillTemplate from 'es6-dynamic-template';
import Comment from './Comment';

class CodeGenerator {
	generateNodes(template, comment, path) {
		const code = this.generateCode(template, comment, path);

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

	generateCode(template, comment, path) {
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
		this._joinObjectsWithProperties(params).forEach((param, index) => {
			const { conditions, errorMessages } =
				this._getConditionsAndMessagesByParam(param, index, path) || {};

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
						errorMessage: `'${errorMessages[index].replace(
							/'/g,
							"\\'"
						)}'`
					})
				);
			});
		});

		return codeFragments.join('\n');
	}

	_getConditionsAndMessagesByParam(param, index, path, typeFlags = {}) {
		let { name, optional } = param;
		let flags = Object.assign(
			{ nullable: false, notNullable: false, optional: false },
			typeFlags
		);
		const { type, flags: separatedFlags } = this._separateTypeAndFlags(
			param.type
		);
		Object.assign(flags, separatedFlags);

		let conditions = [];
		let errorMessages = [];

		if (type.type === 'NAME') {
			optional = optional || flags.optional;

			const typeName = type.name.toLowerCase();
			const conditionPrefix = optional
				? `${name} !== null && ${name} !== undefined &&`
				: '';
			const conditionSuffix = flags.nullable
				? `&& ${name} !== null`
				: flags.notNullable
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
				case 'function':
					conditions.push(
						conditionPrefix +
							`typeof ${name} !== 'function'` +
							conditionSuffix
					);
					errorMessages.push(
						`Argument ${name}${
							optional ? ' (optional)' : ''
						} must be a function.`
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
				default: {
					const typedef = this._findTypedef(typeName, path);

					if (typedef) {
						const typedefType = this._getTypedefType(typedef);

						if (typedefType) {
							let entries;

							if (this._isObjectType(typedefType)) {
								const props = typedef
									.findTags(['property', 'prop'])
									.map(Comment.parseTagType);
								entries = this._getObjectProperties(
									props,
									name,
									false
								).entries;
							}

							if (entries && entries.length > 0) {
								const {
									flags: typedefFlags
								} = this._separateTypeAndFlags(typedefType);

								return this._getConditionsAndMessagesByParam(
									Object.assign({}, param, {
										type: {
											type: 'RECORD',
											entries
										}
									}),
									index,
									path,
									Object.assign({}, flags, typedefFlags)
								);
							} else {
								return this._getConditionsAndMessagesByParam(
									Object.assign({}, param, {
										type: typedefType
									}),
									index,
									path,
									flags
								);
							}
						}
					}

					return null;
				}
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
					} = this._getConditionsAndMessagesForArray(
						param,
						index,
						path,
						flags,
						type
					);
					conditions.push(...arrayConditions);
					errorMessages.push(...arrayErrorMessages);

					break;
				}
				case 'object': {
					const {
						conditions: objectConditions,
						errorMessages: objectErrorMessages
					} = this._getConditionsAndMessagesForObject(
						param,
						index,
						path,
						flags,
						type
					);
					conditions.push(...objectConditions);
					errorMessages.push(...objectErrorMessages);

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
				conditions: unionConditions,
				errorMessages: unionErrorMessages
			} = this._getConditionsAndMessagesForUnion(
				param,
				index,
				path,
				flags,
				type
			);
			conditions.push(...unionConditions);
			errorMessages.push(...unionErrorMessages);
		} else if (type.type === 'RECORD' && type.entries) {
			const {
				conditions: recordConditions,
				errorMessages: recordErrorMessages
			} = this._getConditionsAndMessagesForRecord(
				param,
				index,
				path,
				flags,
				type
			);
			conditions.push(...recordConditions);
			errorMessages.push(...recordErrorMessages);
		} else if (
			type.type === 'VARIADIC' &&
			type.meta &&
			type.meta.syntax === 'PREFIX_DOTS' &&
			type.value
		) {
			const {
				conditions: variadicConditions,
				errorMessages: variadicErrorMessages
			} = this._getConditionsAndMessagesForVariadic(
				param,
				index,
				path,
				flags,
				type
			);
			conditions.push(...variadicConditions);
			errorMessages.push(...variadicErrorMessages);
		}

		return { conditions, errorMessages };
	}

	_getConditionsAndMessagesForArray(param, index, path, typeFlags, type) {
		const { name } = param;
		const conditions = [];
		const errorMessages = [];

		const {
			conditions: arrayConditions,
			errorMessages: arrayErrorMessages
		} = this._getConditionsAndMessagesByParam(
			Object.assign({}, param, { type: type.subject }),
			index,
			path,
			typeFlags
		);

		if (arrayConditions && arrayErrorMessages) {
			conditions.push(...arrayConditions);
			errorMessages.push(...arrayErrorMessages);
		}

		if (!type.objects || !type.objects.length) {
			return { conditions, errorMessages };
		}

		let {
			conditions: itemConditions,
			errorMessages: itemErrorMessages
		} = this._getConditionsAndMessagesByParam(
			{
				type: type.objects[0],
				optional: false,
				name: `${name}[0]`
			},
			0,
			path
		);

		if (itemConditions && itemErrorMessages) {
			itemConditions = itemConditions.map(
				condition =>
					`Object.prototype.toString` +
					`.call(${name}) === '[object Array]' &&` +
					`${name}.length > 0 && (${condition})`
			);
			conditions.push(...itemConditions);
			errorMessages.push(...itemErrorMessages);
		}

		return { conditions, errorMessages };
	}

	_getConditionsAndMessagesForObject(param, index, path, typeFlags, type) {
		const { name } = param;
		const conditions = [];
		const errorMessages = [];

		const {
			conditions: objectConditions,
			errorMessages: objectErrorMessages
		} = this._getConditionsAndMessagesByParam(
			Object.assign({}, param, { type: type.subject }),
			index,
			path,
			typeFlags
		);

		if (objectConditions && objectErrorMessages) {
			conditions.push(...objectConditions);
			errorMessages.push(...objectErrorMessages);
		}

		if (!type.objects || !type.objects.length) {
			return { conditions, errorMessages };
		}

		const objectsCount = type.objects.length;
		const keyName = `Object.keys(${name})[0]`;

		if (objectsCount === 2) {
			let {
				conditions: keyConditions,
				errorMessages: keyErrorMessages
			} = this._getConditionsAndMessagesByParam(
				{
					type: type.objects[0],
					optional: false,
					name: keyName
				},
				0,
				path
			);

			if (keyConditions && keyErrorMessages) {
				keyConditions = keyConditions.map(
					condition =>
						`Object.prototype.toString` +
						`.call(${name}) === '[object Object]' && ` +
						`Object.keys && ${keyName} && ` +
						`(${condition})`
				);
				conditions.push(...keyConditions);
				errorMessages.push(...keyErrorMessages);
			}
		}

		if (objectsCount === 1 || objectsCount === 2) {
			const valueName = `${name}[${keyName}]`;
			let {
				conditions: valueConditions,
				errorMessages: valueErrorMessages
			} = this._getConditionsAndMessagesByParam(
				{
					type: type.objects[objectsCount - 1],
					optional: false,
					name: valueName
				},
				0,
				path
			);

			if (valueConditions && valueErrorMessages) {
				valueConditions = valueConditions.map(
					condition =>
						`Object.prototype.toString` +
						`.call(${name}) === '[object Object]' && ` +
						`Object.keys && ${keyName} && ` +
						`${valueName} && (${condition})`
				);
				conditions.push(...valueConditions);
				errorMessages.push(...valueErrorMessages);
			}
		}

		return { conditions, errorMessages };
	}

	_getConditionsAndMessagesForUnion(param, index, path, typeFlags, type) {
		const conditions = [];
		const errorMessages = [];

		const {
			conditions: leftConditions,
			errorMessages: leftErrorMessages
		} = this._getConditionsAndMessagesByParam(
			Object.assign({}, param, { type: type.left }),
			index,
			path,
			typeFlags
		);
		const {
			conditions: rightConditions,
			errorMessages: rightErrorMessages
		} = this._getConditionsAndMessagesByParam(
			Object.assign({}, param, { type: type.right }),
			index,
			path,
			typeFlags
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

		return { conditions, errorMessages };
	}

	_getConditionsAndMessagesForRecord(param, index, path, typeFlags, type) {
		const { name } = param;
		const conditions = [];
		const errorMessages = [];

		const {
			conditions: objectConditions,
			errorMessages: objectErrorMessages
		} = this._getConditionsAndMessagesByParam(
			Object.assign({}, param, {
				type: { type: 'NAME', name: 'object' }
			}),
			index,
			path,
			typeFlags
		);

		if (objectConditions && objectErrorMessages) {
			conditions.push(...objectConditions);
			errorMessages.push(...objectErrorMessages);
		}

		type.entries.forEach(entry => {
			if (entry.type !== 'RECORD_ENTRY' || !entry.key || !entry.value) {
				return;
			}

			let {
				conditions: entryConditions,
				errorMessages: entryErrorMessages
			} = this._getConditionsAndMessagesByParam(
				{
					type: entry.value,
					optional: entry.optional || false,
					name: `${name}['${entry.key}']`
				},
				0,
				path
			);

			if (!entryConditions || !entryErrorMessages) {
				return;
			}

			entryConditions = entryConditions.map(
				condition =>
					`Object.prototype.toString` +
					`.call(${name}) === '[object Object]' && ` +
					`('${entry.key}' in ${name}) && (${condition})`
			);

			conditions.push(...entryConditions);
			errorMessages.push(...entryErrorMessages);
		});

		return { conditions, errorMessages };
	}

	_getConditionsAndMessagesForVariadic(param, index, path, typeFlags, type) {
		const conditions = [];
		const errorMessages = [];

		const {
			conditions: restConditions,
			errorMessages: restErrorMessages
		} = this._getConditionsAndMessagesByParam(
			Object.assign({}, param, {
				type: type.value,
				name: `Array.prototype.slice.call(arguments, ${index})[0]`
			}),
			index,
			path,
			typeFlags
		);

		if (restConditions && restErrorMessages) {
			conditions.push(...restConditions);
			errorMessages.push(...restErrorMessages);
		}

		return { conditions, errorMessages };
	}

	_separateTypeAndFlags(type) {
		let t = type;
		const flags = {};

		/* The type has been defined as optional with equals sign at the end of
		 * the type. For example: @param {number=} x The X.
		 */
		if (
			t.type === 'OPTIONAL' &&
			t.meta &&
			t.meta.syntax === 'SUFFIX_EQUALS_SIGN' &&
			t.value
		) {
			t = t.value;
			flags.optional = true;
		}

		/* The type has been defined as nullable with a question mark at the
		 * beginning of the type. For example: @param {?number} x The X.
		 */
		if (
			t.type === 'NULLABLE' &&
			t.meta &&
			t.meta.syntax === 'PREFIX_QUESTION_MARK' &&
			t.value
		) {
			t = t.value;
			flags.nullable = true;
		}

		/* The type has been defined as not nullable with an asterisk at the
		 * beginning of the param type. For example: @param {!number} x The X.
		 */
		if (
			t.type === 'NOT_NULLABLE' &&
			t.meta &&
			t.meta.syntax === 'PREFIX_BANG' &&
			t.value
		) {
			t = t.value;
			flags.notNullable = true;
		}

		// A type is written between ().
		if (t.type === 'PARENTHESIS' && t.value) {
			t = t.value;
		}

		return { type: t, flags };
	}

	_addFlagsToType(flags, type) {
		const { flags: f, type: t } = this._separateTypeAndFlags(type);
		const { notNullable, nullable, optional } = Object.assign({}, f, flags);
		let resultType = t;

		if (notNullable) {
			resultType = {
				type: 'NOT_NULLABLE',
				meta: {
					syntax: 'PREFIX_BANG'
				},
				value: resultType
			};
		}

		if (nullable) {
			resultType = {
				type: 'NULLABLE',
				meta: {
					syntax: 'PREFIX_QUESTION_MARK'
				},
				value: resultType
			};
		}

		if (optional) {
			resultType = {
				type: 'OPTIONAL',
				meta: {
					syntax: 'SUFFIX_EQUALS_SIGN'
				},
				value: resultType
			};
		}

		return resultType;
	}

	_joinObjectsWithProperties(params) {
		const propertyNames = [];
		const rootRecords = params
			.filter(
				({ name, type }) =>
					!name.includes('.') && this._isObjectType(type)
			)
			.map(param => {
				const { name, type } = param;
				const { flags } = this._separateTypeAndFlags(type);
				const { entries, names } = this._getObjectProperties(
					params,
					name
				);

				if (entries.length > 0) {
					propertyNames.push(...names);

					return Object.assign({}, param, {
						type: this._addFlagsToType(flags, {
							type: 'RECORD',
							entries
						})
					});
				}

				return param;
			});

		return params
			.filter(({ name }) => !propertyNames.includes(name))
			.map(param => {
				const record = rootRecords.find(
					record => record.name === param.name
				);

				if (record) {
					return record;
				} else {
					return param;
				}
			});
	}

	_getObjectProperties(params, objName, filterByName = true) {
		let properties;

		if (filterByName) {
			properties = params.filter(
				({ name }) =>
					name.indexOf(`${objName}.`) === 0 &&
					!name.replace(`${objName}.`, '').includes('.')
			);
		} else {
			properties = params;
		}

		const names = [];
		const entries = properties.map(param => {
			const { name, type } = param;
			const key = name.replace(`${objName}.`, '');
			const isObject = this._isObjectType(type);
			const { flags } = this._separateTypeAndFlags(type);
			let innerEntries;
			names.push(name);

			if (isObject) {
				const {
					entries,
					names: innerNames
				} = this._getObjectProperties(params, name);
				innerEntries = entries;
				names.push(...innerNames);
			}

			return Object.assign({}, param, {
				type: 'RECORD_ENTRY',
				key,
				value:
					innerEntries && innerEntries.length > 0
						? this._addFlagsToType(flags, {
								type: 'RECORD',
								entries: innerEntries
						  })
						: type
			});
		});

		return { entries, names };
	}

	_isObjectType(type) {
		const { type: t } = this._separateTypeAndFlags(type);

		return (
			(t.type === 'NAME' && t.name.toLowerCase() === 'object') ||
			(t.type === 'GENERIC' &&
				t.subject &&
				t.subject.type === 'NAME' &&
				t.subject.name.toLowerCase() === 'object')
		);
	}

	_findTypedef(typeName, path) {
		let properComment = null;
		path.hub.file.ast.comments.some(commentBlock => {
			if (commentBlock.type !== 'CommentBlock') {
				return false;
			}

			const comment = new Comment(`/*${commentBlock.value}*/`);
			const [typedefTag] = comment.findTags('typedef');

			if (
				typedefTag &&
				typedefTag.name &&
				typedefTag.name.toLowerCase() === typeName
			) {
				properComment = comment;

				return true;
			}
		});

		return properComment;
	}

	_getTypedefType(typedef) {
		const [typedefTag] = typedef.findTags('typedef');
		const { type } = Comment.parseTagType(typedefTag);

		return type;
	}
}

export default new CodeGenerator();

const CHECKER_TAG = 'typechecked';
const CHECKING_TEMPLATE = `
	if (\${condition}) {
		throw new TypeError('\${className}.\${methodName}(\${paramsList}): Argument \${paramName} expected to be \${expectedType}.');
	}`;
const IMPORT_TEMPLATE = '';
const SUPPORTED_ENVIRONMENTS = ['dev', 'development', 'test'];

export default class Options {
	constructor(pluginOptions) {
		const {
			checkerTag = CHECKER_TAG,
			checkingTemplate = CHECKING_TEMPLATE,
			importTemplate = IMPORT_TEMPLATE,
			supportedEnvironments = SUPPORTED_ENVIRONMENTS
		} = pluginOptions || {};

		if (!checkerTag || typeof checkerTag !== 'string') {
			throw new TypeError('Option checkerTag must be a string.');
		}

		if (!checkingTemplate || typeof checkingTemplate !== 'string') {
			throw new TypeError('Option checkingTemplate must be a string.');
		}

		if (importTemplate && typeof importTemplate !== 'string') {
			throw new TypeError('Option importTemplate must be a string.');
		}

		if (!supportedEnvironments || !Array.isArray(supportedEnvironments)) {
			throw new TypeError(
				'Option supportedEnvironments must be an array.'
			);
		}

		this.checkerTag = checkerTag;
		this.checkingTemplate = checkingTemplate;
		this.importTemplate = importTemplate || null;
		this.supportedEnvironments = supportedEnvironments;
	}

	/**
	 * Checks if this plugin should generate a type checking code.
	 *
	 * @param {string} [environment=process.env.NODE_ENV || 'dev']
	 *        An environment.
	 * @return {boolean} `true` when it should generate a type checking code,
	 *         otherwise `false`.
	 */
	shouldGenerateTypeCheckingCode(
		environment = process.env.NODE_ENV || 'dev'
	) {
		if (!environment || typeof environment !== 'string') {
			throw new TypeError('Argument environment must be a string.');
		}

		return this.supportedEnvironments.includes(environment);
	}
}

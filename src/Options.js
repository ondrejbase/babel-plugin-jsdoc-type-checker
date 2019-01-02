const CHECKER_TAG = 'type-checked';
const CHECKING_TEMPLATE = `
	if (\${condition}) {
		throw new TypeError(\${errorMessage});
	}`;
const SUPPORTED_ENVIRONMENTS = ['dev', 'test'];

export default class Options {
	constructor(pluginOptions) {
		const {
			checkerTag = CHECKER_TAG,
			checkingTemplate = CHECKING_TEMPLATE,
			supportedEnvironments = SUPPORTED_ENVIRONMENTS
		} = pluginOptions || {};

		if (!checkerTag || typeof checkerTag !== 'string') {
			throw new TypeError('Option checkerTag must be a string.');
		}

		if (!checkingTemplate || typeof checkingTemplate !== 'string') {
			throw new TypeError('Option checkingTemplate must be a string.');
		}

		if (!supportedEnvironments || !Array.isArray(supportedEnvironments)) {
			throw new TypeError(
				'Option supportedEnvironments must be an array.'
			);
		}

		this.checkerTag = checkerTag;
		this.checkingTemplate = checkingTemplate;
		this.supportedEnvironments = supportedEnvironments;
	}

	/**
	 * Checks if this plugin should generate a type checking code.
	 *
	 * @param {string} [environment=process.env.NODE_ENV] The environment.
	 * @return {boolean} `true` when it should generate a type checking code,
	 *         otherwise `false`.
	 */
	shouldGenerateTypeCheckingCode(environment = process.env.NODE_ENV) {
		if (!environment || typeof environment !== 'string') {
			throw new TypeError('Argument environment must be a string.');
		}

		return this.supportedEnvironments.includes(environment);
	}
}

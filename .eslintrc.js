module.exports = {
	'extends': ['last', 'prettier/react', 'plugin:react/recommended'],
	'rules': {
		'prettier/prettier': [
			'error', {
				singleQuote: true,
				printWidth: 80,
				semi: true,
				useTabs: true,
				tabWidth: 4,
				jsxBracketSameLine: true
			}
		],

		'no-console': ['error', {
			allow: ['warn', 'error']
		}],

		'react/prop-types': 0
	},
	'plugins': [
		'jest',
		'react',
		'prettier',
		'jasmine'
	],
	'settings': {
		'ecmascript': 6,
		'jsx': true
	},
	'parserOptions': {
		'sourceType': 'module',
		'ecmaVersion': 6,
		'ecmaFeatures': {
			'jsx': true
		}
	},
	'env': {
		'browser': true,
		'node': true,
		'es6': true,
		'jasmine': true,
		'jest/globals': true
	},
	'globals': {
		'$Debug': true
	}
};

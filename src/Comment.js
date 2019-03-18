import parse from 'comment-parser';
import { parse as parseType } from 'jsdoctypeparser';
import { taggedTemplateExpression } from '@babel/types';

export default class Comment {
	static parseTagType(tag) {
		const { type } = tag;

		if (!type) {
			return tag;
		} else {
			return {
				...tag,
				type: parseType(type)
			};
		}
	}

	constructor(commentString) {
		this.commentString = commentString;
		[this._parsed] = parse(commentString);
	}

	findTags(name) {
		const { tags } = this._parsed || {};
		const tagNames = Array.isArray(name) ? name : [name];

		if (tags) {
			return tags.filter(tag => tagNames.indexOf(tag && tag.tag) >= 0);
		} else {
			return [];
		}
	}

	getParams() {
		return this.findTags('param').map(Comment.parseTagType);
	}

	hasTag(name) {
		return this.findTags(name).length > 0;
	}
}

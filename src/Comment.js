import parse from 'comment-parser';
import { parse as parseType } from 'jsdoctypeparser';

export default class Comment {
	constructor(commentString) {
		this.commentString = commentString;
		[this._parsed] = parse(commentString);
	}

	findTags(name) {
		const { tags } = this._parsed || {};

		if (tags) {
			return tags.filter(tag => (tag && tag.tag) === name);
		} else {
			return [];
		}
	}

	getParams() {
		return this.findTags('param').map(param => ({
			...param,
			type: parseType(param.type)
		}));
	}

	hasTag(name) {
		return this.findTags(name).length > 0;
	}
}

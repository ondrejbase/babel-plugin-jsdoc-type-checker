export default class Comment {
	constructor(commentString) {
		this.commentString = commentString;
		this._parsed = this._parseJSDoc(commentString);

		Object.freeze(this);
	}

	_parseJSDoc(commentString) {
		return commentString;
	}
}

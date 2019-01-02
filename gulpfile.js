const gulp = require('gulp');
const babel = require('gulp-babel');

const transformJs = () =>
	gulp
		.src('./src/*.js')
		.pipe(
			babel({
				plugins: ['transform-es2015-modules-commonjs']
			})
		)
		.pipe(gulp.dest('./dist'));

gulp.task('build', transformJs);

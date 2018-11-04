const gulp = require('gulp'),
  sass = require('gulp-sass'),
  browserSync = require('browser-sync').create(),
  imagemin = require('gulp-imagemin'),
  imageminMozjpeg = require('imagemin-mozjpeg'),
  imageminGuetzli = require('imagemin-guetzli'),
  imageminWebp = require('imagemin-webp'),
  htmlmin = require('gulp-htmlmin'),
  removeEmptyLines = require('gulp-remove-empty-lines'),
  del = require('del'),
  concat = require('gulp-concat'),
  sourcemaps = require('gulp-sourcemaps'),
  cache = require('gulp-cache'),
  gcmq = require('gulp-group-css-media-queries'),
  plumber = require('gulp-plumber'),
  uglify = require('gulp-uglify'),
  order = require("gulp-order"),
  rename = require('gulp-rename'),
  htmlhint = require("gulp-htmlhint"),
  inject = require('gulp-inject'),
  runSequence = require('run-sequence'),
  rebaseUrls = require('gulp-css-rebase-urls'),
  postcss = require('gulp-postcss'),
  sassGlob = require('gulp-sass-glob'),
  cssnano = require('cssnano'),
  postcssFallback = require('postcss-color-rgba-fallback'),
  postcssFlexBugsFixes = require('postcss-flexbugs-fixes'),
  autoprefixer = require('autoprefixer');

// Server connect
gulp.task('browserSync', function () {
  browserSync.init({
    server: './src',
    injectChanges: true,
    notify: false,
    open: false
  });
});

gulp.task('clean', function () {
  del.sync([
    './dist/*'
  ], { force: true });
});

gulp.task('default', ['clean', 'js', 'sass', 'html'], function () {
  gulp.start('watch');
});

// html
gulp.task('html', function () {
  return gulp.src('./src/*.html')
    .pipe(htmlhint())
    .pipe(htmlhint.reporter())
    .pipe(gulp.dest('./src'))
    .pipe(browserSync.stream());
});

// inject
gulp.task('inject', function () {
  const sources = gulp.src(['./src/js/main.js', './src/css/style.css']);

  return gulp.src('./src/*.html')
    .pipe(inject(sources, { relative: true }))
    .pipe(gulp.dest('./src'))
});

// sass
gulp.task('sass', function () {
  const plugins = [
    postcssFlexBugsFixes(),
    postcssFallback(),
    autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }),
    cssnano()
  ];

  return gulp.src('./src/scss/style.scss')
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sassGlob())
    .pipe(sass({
      outputStyle: 'expanded'
    }).on('error', sass.logError))
    .pipe(gcmq())
    .pipe(postcss(plugins))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./src/css'))
    .pipe(browserSync.stream());
});

// js
gulp.task('js', function () {
  return gulp.src(['!./src/js/main.js', './src/js/**/*.js'])
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(order([
      'libs/*.js',
      'plugins/*.js',
      'components/*.js'
    ]))
    .pipe(concat('main.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./src/js'))
    .pipe(browserSync.stream());
});

// img
gulp.task('img', function () {
  return gulp.src('./src/img/**/*.+(png|jpg|jpeg|svg)')
    .pipe(imagemin([{
      interlaced: true,
      progressive: true,
      svgoPlugins: [{ removeViewBox: false }]
    }, imageminMozjpeg({
      quality: 85
    }), imageminGuetzli({
      quality: 85
    }), imageminWebp({
      quality: 60,
      lossless: true
    })]))
    .pipe(gulp.dest('./dist/img'));
});

// fonts
gulp.task('fonts', function () {
  return gulp.src(['./src/fonts/**/*.+(woff|woff2|ttf|eot)'])
    .pipe(gulp.dest('./dist/fonts'));
});

// build
gulp.task('build', ['clean', 'sass', 'js', 'img', 'fonts'], function () {
  runSequence('copy:build', 'css:build', 'js:build', 'html:build', function () {
    const sources = gulp.src(['./dist/js/main.min.js', './dist/css/style.min.css'], { read: false });

    return gulp.src('./dist/*.html')
      .pipe(inject(sources, { relative: true }))
      .pipe(htmlmin({
        sortClassName: true,
        sortAttributes: true,
        caseSensitive: true,
        removeComments: true,
        collapseWhitespace: true
      }))
      .pipe(removeEmptyLines())
      .pipe(gulp.dest('./dist'));
  });
});

gulp.task('copy:build', function () {
  return gulp.src(['!./src/*.html', './src/*.*'])
    .pipe(gulp.dest('./dist'));
});

gulp.task('css:build', function () {
  return gulp.src(['./src/css/style.css'])
    .pipe(rebaseUrls({ root: './css' }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('./dist/css'));
});

gulp.task('js:build', function () {
  return gulp.src('./src/js/main.js')
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('./dist/js'));
});

gulp.task('html:build', function () {
  return gulp.src('./src/*.html')
    .pipe(gulp.dest('./dist'));
});

// watch
gulp.task('watch', ['browserSync', 'inject'], function () {
  gulp.watch('./src/*.html', ['html'])
    .on('change', browserSync.reload);

  gulp.watch(['./src/scss/**/*.scss'], ['sass'])
    .on('change', browserSync.reload);

  gulp.watch('./src/js/**/*.js', ['js'])
    .on('change', browserSync.reload);

  gulp.watch('./src/fonts/**/*.+(woff|woff2|ttf|eot)')
    .on('change', browserSync.reload);

  gulp.watch('./src/img/**/*.+(png|jpg|jpeg|svg)')
    .on('change', browserSync.reload);
});

gulp.task('clearCache', function () {
  return cache.clearAll();
})
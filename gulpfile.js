'use strict';

const {
    src,
    dest,
    series,
    parallel,
    watch
} = require('gulp');
const delCore = require('del');
const path = require('path');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const csso = require('gulp-csso');
const gcmq = require('gulp-group-css-media-queries');
const del = require('del');
const htmlmin = require('gulp-htmlmin');
const imagemin = require('gulp-imagemin');
const plumber = require('gulp-plumber');
const babel = require('gulp-babel');
const uglify = require('gulp-terser');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const server = require('browser-sync').create();
const stipcomments = require('gulp-strip-css-comments');
function html() {
    return src('src/*.html')
        .pipe(htmlmin({
            collapseWhitespace: true
        }))
        .pipe(dest('build'))
        .pipe(server.stream());
}

function styles() {
    return src('src/sass/main.sass')
        .pipe(plumber())
        .pipe(sass())
        .pipe(postcss([autoprefixer('last 2 version')]))
        .pipe(gcmq())
        .pipe(csso())
        .pipe(stipcomments())
        .pipe(rename('styles.min.css'))
        .pipe(dest('build/css'))
        .pipe(server.stream());
}

function scripts() {
    return src('src/js/**/*.js')
        .pipe(plumber())
        .pipe(uglify())
        .pipe(rename({
            extname: '.min.js'
        }))
        .pipe(dest('build/js'))
        .pipe(server.stream());
}


function images() {
    return src(['src/img/**/*.{png,jpg,jpeg,svg}'])
        .pipe(
            imagemin([
                imagemin.jpegtran({
                    progressive: true
                }),
                imagemin.optipng({
                    optimizationLevel: 3
                }),
                imagemin.svgo({
                    plugins: [{
                        removeViewBox: false
                    }, {
                        cleanupIDs: false
                    }],
                }),
            ]),
        )
        .pipe(dest('build/img'))
        .pipe(server.stream());
}

function fonts() {
    return src('src/fonts/**/*').pipe(dest('build/fonts'))
    .pipe(server.stream());
}

function clean() {
    return del('./build');
}

function watcher(done) {
    watch('src/**/*.html').on('change', series(html, server.reload)).on('unlink', (filepath)=>{handleDeleting(filepath)});
    watch('src/sass/**/*.sass').on('change', series(styles, server.reload)).on('unlink', (filepath)=>{handleDeleting(filepath)});
    watch('src/js/**/*.js').on('change', series(scripts, server.reload)).on('unlink', (filepath)=>{handleDeleting(filepath, true)});
    watch('src/img/**/*.{png,jpg,jpeg,svg}').on('change', series(images, server.reload)).on('unlink', (filepath)=>{handleDeleting(filepath)});
    watch('src/fonts/**/*').on('change', series(fonts, server.reload)).on('unlink', (filepath)=>{handleDeleting(filepath)})
    done();
}
function handleDeleting(filepath, min){
    let filePathFromSrc = path.relative(path.resolve('src'), filepath);
    if(min){
        filePathFromSrc = filePathFromSrc.replace('.', '.min.')
    }
    // Concatenating the 'build' absolute path used by gulp.dest in the scripts task
    let destFilePath = path.resolve('build', filePathFromSrc);
    delCore.sync(destFilePath);
}
function serve() {
    return server.init({
        server: 'build',
        notify: true,
        open: true,
        cors: true,
        ui: false,
        logPrefix: 'devserver',
        host: 'localhost',
        port: 8080,
    });
}



const build = series(
    clean,
    parallel(images, fonts, html, styles, scripts),
);

const start = series(build, watcher, serve);

exports.build = build;
exports.start = start;
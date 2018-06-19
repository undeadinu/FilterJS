'use strict';

const notifier = require('node-notifier'),
      path = require('path'),
      gulp = require('gulp'),
      concat = require('gulp-concat'),
      gap = require('gulp-append-prepend'),
      sourcemaps = require('gulp-sourcemaps'),
      stylus = require('gulp-stylus'),
      riot = require('gulp-riot'),
      pug = require('gulp-pug'),
      svgstore = require('gulp-svgstore'),
      typescript = require('gulp-typescript'),
      NwBuilder = require('nw-builder');

var tsProject = typescript.createProject('./tsconfig.json');

const makeErrorObj = (title, err) => ({
    title,
    message: err.toString(),
    icon: path.join(__dirname, 'error.png'),
    sound: true,
    wait: true
});

const fileChangeNotifier = p => {
    notifier.notify({
        title: `Updating ${path.basename(p)}`,
        message: `${p}`,
        icon: path.join(__dirname, 'cat.png'),
        sound: false,
        wait: false
    });
};

const compileStylus = () =>
    gulp.src('./src/styl/index.styl')
    .pipe(sourcemaps.init())
    .pipe(stylus({
        compress: true
    }))
    .pipe(concat('bundle.css'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./app/'));

const compilePug = () => 
    gulp.src('./src/pug/*.pug')
    .pipe(sourcemaps.init())
    .pipe(pug({
        pretty: false
    }))
    .on('error', err => {
        notifier.notify(makeErrorObj('Pug failure', err));
        console.error('[pug error]', err);
    })
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./app/'));

const compileTypescript = () =>
    gulp.src('./src/js/**/*.ts', {
        base: './src/js/'
    })
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(tsProject())
    .pipe(gulp.dest('./app/js'))
    .pipe(sourcemaps.write('./app/js'))
    .on('error', err => {
        notifier.notify(makeErrorObj('TypeScript error', err));
        console.error('[tscript error]', err);
    })
    .on('change', fileChangeNotifier);

const compileRiot = () =>
    gulp.src('./src/riotTags/**')
    .pipe(riot({
        compact: false,
        template: 'pug'
    }))
    .pipe(concat('riot.js'))
    .pipe(gap.prependFile('./eslintfix.js'))
    .pipe(gulp.dest('./app/js'));

const copyScripts = gulp.series([gulp.parallel([compileRiot, compileTypescript]), () =>
    gulp.src('./src/js/**/*.js', {
        base: './src/js/'
    })
    .pipe(gulp.dest('./app/js'))
]);

const makeSprites = () =>
    gulp.src('./src/icons/*.svg')
    .pipe(svgstore())
    .pipe(gulp.dest('./app/img'));

const watchScripts = () => {
    gulp.watch('./src/js/**/*', gulp.series(copyScripts))
    .on('error', err => {
        notifier.notify(makeErrorObj('General scripts error', err));
        console.error('[scripts error]', err);
    })
    .on('change', fileChangeNotifier);
};
const watchRiot = () => {
    gulp.watch('./src/riotTags/**/*', gulp.series(copyScripts))
    .on('error', err => {
        notifier.notify(makeErrorObj('Riot failure', err));
        console.error('[pug error]', err);
    })
    .on('change', fileChangeNotifier);
};
const watchStylus = () => {
    gulp.watch('./src/styl/**/*', compileStylus)
    .on('error', err => {
        notifier.notify(makeErrorObj('Stylus failure', err));
        console.error('[styl error]', err);
    })
    .on('change', fileChangeNotifier);
};
const watchPug = () => {
    gulp.watch('./src/pug/*.pug', compilePug)
    .on('change', fileChangeNotifier)
    .on('error', err => {
        notifier.notify(makeErrorObj('Pug failure', err));
        console.error('[pug error]', err);
    });
};
const watchIcons = () => {
    gulp.watch('./src/icons/**/*', makeSprites);
};
const watch = () => {
    watchScripts();
    watchStylus();
    watchPug();
    watchRiot();
    watchIcons();
};

const build = gulp.parallel([compilePug, compileStylus, copyScripts, makeSprites]);

const defaultTask = gulp.series(build, done => {
    watch();
    var nw = new NwBuilder({
        files: './app/**',
        version: '0.31.2',
        platforms: ['osx64', 'win32', 'win64', 'linux32', 'linux64'],
        flavor: 'sdk'
    });
    nw.run()
    .then(done)
    .catch(function (error) {
        console.error(error);
    });
});
const release = gulp.series([build, done => {
    var nw = new NwBuilder({
        files: './app/**',
        platforms: ['osx64', 'win32', 'win64', 'linux32', 'linux64'],
        version: '0.31.2',
        flavor: 'normal',
        buildType: 'versioned'
    });
    nw.build().then(done)
    .catch(function (error) {
        console.error(error);
    });
}]);

exports.compilePug = compilePug;
exports.compileRiot = compileRiot;
exports.compileStylus = compileStylus;
exports.compileTypescript = compileTypescript;
exports.watch = watch;
exports.watchPug = watchPug;
exports.watchRiot = watchRiot;
exports.watchStylus = watchStylus;

gulp.task('release', release);
gulp.task('default', defaultTask);

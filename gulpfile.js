'use strict'

// Load plugins
var gulp = require('gulp')
var eslint = require('gulp-eslint')
var del = require('del')
var standardize = require('gulp-standardize')
var babel = require('gulp-babel')
var spawn = require('child_process').spawn

// set paths
var source = ['src/**/*.js']
var dest = ''

gulp.task('lint', () => {
  return gulp.src(source)
  .pipe(standardize())
  .pipe(standardize.reporter('snazzy'))
  .pipe(standardize.reporter('fail'))
  .pipe(eslint({
    envs: ['node'],
    extends: 'eslint:recommended',
    es6: true,
    ecmaFeatures: {
      modules: true,
      classes: true
    }
  }))
  .pipe(eslint.format())
})

gulp.task('build', () => {
  return gulp.src(source)
  .pipe(babel({
    presets: ['es2015']
  }))
  .pipe(gulp.dest(dest))
})

gulp.task('test', ['build'], cb => {
  var task = spawn('/bin/sh', ['-c', 'tap -Rspec test/**/*.js'], { stdio: 'inherit' })
  task.on('error', cb)
  task.on('exit', (code, signal) => {
    if (code === 0) {
      cb()
    } else {
      cb(new Error(`Code: ${code}`))
    }
  })
})

// Clean
gulp.task('clean', cb => {
  del(['bin', 'lib', 'test'], cb)
})

// Default task
gulp.task('default', ['lint'], () => {
  gulp.start('build')
})

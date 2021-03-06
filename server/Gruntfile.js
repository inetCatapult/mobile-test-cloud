'use strict';
var _ = require('lodash');

module.exports = function (grunt) {
	var coverage = 85; //set minimum threshold
	var sourceFiles = ['*.js', 'lib/**/*.js'];
	var testFiles = ['test/**/*.js'];
	var allFiles = sourceFiles.concat(testFiles);

	var defaultJsHintOptions = grunt.file.readJSON('./.jshintrc');
	var testJsHintOptions = _.extend(
		grunt.file.readJSON('./.jshintrc'),
		defaultJsHintOptions
	);

	grunt.initConfig({
		jscs: {
			src: allFiles,
			options: {
				config: '.jscsrc',
				force: true
			}
		},

		jshint: {
			src: sourceFiles,
			options: defaultJsHintOptions,
			test: {
				options: testJsHintOptions,
				files: {
					test: testFiles
				}
			}
		},

		/* jshint camelcase: false */
		mocha_istanbul: {
			/* jshint camelcase: true */
			coverage: {
				src: 'test/specs'
			},
			options: {
				coverage: true,
				reporter: 'spec',
				check: {
					lines: coverage,
					statements: coverage
				},
				reportFormats: ['lcov', 'text'],
				print: 'detail'
			}
		},

		clean: [ 'coverage', 'test/temp' ]
	});

	//Enable this later!
	/*	if (process.env.CI){
			grunt.event.on('coverage', function (lcov, done) {
				require('coveralls').handleInput(lcov, function (err) {
					if (err) {
						return done(err);
					}
					done();
				});
			});
		}
	*/

	grunt.registerTask('setupEnvironment', [], function () {
		function ensureEnvironmentVariable (name, defaultValue) {
			process.env[name] = process.env[name] || defaultValue;
		}

		ensureEnvironmentVariable('NODE_ENV', 'test');

	});

	// Load plugins
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-jscs');
	grunt.loadNpmTasks('grunt-mocha-istanbul');
	//Enable this later!
	//grunt.registerTask('test', [ 'mocha_istanbul:coverage' ]);
	grunt.registerTask('test', [ 'mocha_istanbul' ]);

	// Register tasks
	grunt.registerTask('lint', 'Check for common code problems.', ['jshint']);
	grunt.registerTask('style', 'Check for style conformity.', ['jscs']);
	grunt.registerTask('default', ['setupEnvironment', 'clean', 'lint', 'style', 'test']);
};
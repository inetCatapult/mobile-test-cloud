var config = require('./config.js');
var clone   = require('clone');
var Joi = require('joi');
var Promise = require('bluebird');
var glob = Promise.promisifyAll(require('glob'));
var fs = Promise.promisifyAll(require('fs-extra'));
var path = require('path');
var sprintf = require('sprintf-js').sprintf;
var logger  = require('./logging.js').winstonLogger;

/*module.exports.launchiOSEmulator = function (osVersion, device) {};
module.exports.launchAndroidEmulator = function (osVersion, device) {};
*/
/**
 * Checks the discovered test config against schema
 * @param  {[JSON]} testConfig [out test config]
 * @return {[Boolean]}            [true if matches, false if not]
 */
module.exports.validateTestConfig = function (testConfig) {
	var reqSchema = Joi.object().keys({
		os: Joi.string().regex(/(android)|(ios)|(Android)|(iOS)/),
//		devices: Joi.array(),
//		emulators: Joi.array(),
		testDirectory: Joi.string(),
		installCommand: Joi.string(),
		testCommand: Joi.string(),
		appName: Joi.string()
	});
	var result = Joi.validate(testConfig, reqSchema);
	if (result.error === null) {
		return true;
	}
	else {
		return false;
	}
};

/**
 * Digs through the repo and finds the mobile test cloud config
 * @param  {[JSON]} testInfo [Our Test Config]
 * @return {[Promise]}          [description]
 */
module.exports.locateTestConfig = function (testInfo) {
	logger.debug('Searching repo for mobile test cloud config');
	var options = {
		cwd: testInfo.local.repo
	};
	var file;
	var match = '**/' + config.testConfigFileName;
	return glob.globAsync(match, options)
		.then(function (resultsArray) {
			if (resultsArray.length !== 1) {
				logger.error('Test Config not found, or too many configs found!');
				throw new Error('Test config not valid, or too many configs found!');
			}
			file = path.join(testInfo.local.repo, resultsArray[0]);
			return fs.readFileAsync(file, 'utf8');
		})
		.then(JSON.parse)
		.then(function (testConfig) {
			if (!module.exports.validateTestConfig(testConfig)){
				logger.error('Test Config not valid!');
				throw new Error('Test Config not valid!');
			}
			logger.silly(sprintf('Found Test Config: %s', file));
			testInfo.testConfig = clone(testConfig);
			//Need to add test for this line.
			testInfo.testConfig.os = testInfo.testConfig.os.toLowerCase();
			testInfo.local.tests = path.join(testInfo.local.repo, testInfo.testConfig.testDirectory);
			testInfo.s3.appLocation = path.join(testInfo.s3.appLocation, testInfo.testConfig.appName);
			return testInfo;
		});
};

/**
 * Deletes the repository directory
 * @return {[Promise]} [The result from deleting the directory]
 */
module.exports.cleanupRepos = function () {
	logger.info(sprintf('Deleting: %s', config.directories.repos));
	return fs.removeAsync(config.directories.repos);
};

/**
 * Deletes the tests directory
 * @return {[Promise]} [The result from deleting the directory]
 */
module.exports.cleanupTests = function () {
	logger.info(sprintf('Deleting: %s', config.directories.tests));
	return fs.removeAsync(config.directories.tests);
};

/**
 * Deletes the tests directory
 * @return {[Promise]} [The result from deleting the directory]
 */
module.exports.cleanupApps = function () {
	logger.info(sprintf('Deleting: %s', config.directories.apps));
	return fs.removeAsync(config.directories.apps);
};


/**
 * Deletes the tests and repos directory
 * @return {[Promise]} [The result from deleting the directories]
 */
module.exports.cleanup = function () {
	logger.info('Removing folders for cleanup!');
	return module.exports.cleanupRepos()
		.then(module.exports.cleanupTests)
		.then(module.exports.cleanupApps);
};

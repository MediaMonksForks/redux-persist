'use strict';

exports.__esModule = true;
exports.recordNonFatalError = undefined;

var _reactNative = require('react-native');

var _reactNativeFabric = require('react-native-fabric');

var _reactNativeFabric2 = _interopRequireDefault(_reactNativeFabric);

var _lodash = require('lodash');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var recordNonFatalError = function recordNonFatalError(description, error) {
  var Crashlytics = _reactNativeFabric2.default.Crashlytics;

  var stringError = (0, _lodash.toString)(description) + ': ' + (0, _lodash.toString)(error);
  if (_reactNative.Platform.OS === 'ios') {
    Crashlytics.recordError(stringError);
  } else {
    Crashlytics.logException(stringError);
  }
};

exports.recordNonFatalError = recordNonFatalError;
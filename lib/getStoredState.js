'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = getStoredState;

var _constants = require('./constants');

var _reactNative = require('react-native');

var _asyncLocalStorage = require('./defaults/asyncLocalStorage');

var _asyncLocalStorage2 = _interopRequireDefault(_asyncLocalStorage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import { recordNonFatalError } from "./crashlytics";

function getStoredState(deviceID, config, onComplete) {
  var storage = config.storage || (0, _asyncLocalStorage2.default)('local');
  var deserializer = config.serialize === false ? function (data) {
    return data;
  } : defaultDeserializer;
  var blacklist = config.blacklist || [];
  var whitelist = config.whitelist || false;
  var transforms = config.transforms || [];
  var keyPrefix = config.keyPrefix !== undefined ? config.keyPrefix : _constants.KEY_PREFIX;

  // fallback getAllKeys to `keys` if present (LocalForage compatability)
  if (storage.keys && !storage.getAllKeys) storage = _extends({}, storage, { getAllKeys: storage.keys });

  var restoredState = {};
  var completionCount = 0;
  // let retryCount = 0;

  function run() {
    storage.getAllKeys(function (err, allKeys) {
      if (err) {
        // Alert.alert('redux-persist/getStoredState: Error in storage.getAllKeys');
        console.log('redux-persist/getStoredState: Error in storage.getAllKeys');
        // recordNonFatalError('Persist Error', deviceID + ' redux-persist/getStoredState: Error in' +
        //   ' storage.getAllKeys ' + err.toString());
        complete(err);
      }

      var persistKeys = allKeys.filter(function (key) {
        return key.indexOf(keyPrefix) === 0;
      }).map(function (key) {
        return key.slice(keyPrefix.length);
      });
      var keysToRestore = persistKeys.filter(passWhitelistBlacklist);

      // recordNonFatalError('Persist Error', deviceID + ' redux-persist/allkeys: ' + allKeys + ' ' + keysToRestore.length + ' ' + (typeof err !== 'undefined').toString());
      console.log('Persist Error', deviceID + ' redux-persist/allkeys: ' + allKeys + ' ' + keysToRestore.length + ' ' + (typeof err !== 'undefined').toString());

      // if (keysToRestore !== 0 && keysToRestore.length < whitelist.length) {
      //   // recordNonFatalError('Persist Error', deviceID + ' redux-persist/allkeys Error: less keys' +
      //   //   ' found than expected ' + keysToRestore.length + ' retryCount ' + retryCount);
      //   console.log('Persist Error', deviceID + ' redux-persist/allkeys Error: less keys' +
      //     ' found than expected ' + keysToRestore.length + ' retryCount ' + retryCount);
      //
      //   retryCount++;
      //
      //   if(retryCount < 10) {
      //     setTimeout(() => {
      //       run();
      //     }, 1000);
      //     return;
      //   }
      // }

      var restoreCount = keysToRestore.length;
      if (restoreCount === 0) complete(null, restoredState);
      keysToRestore.forEach(function (key) {
        storage.getItem(createStorageKey(key), function (err, serialized) {
          if (err) {
            // Alert.alert('redux-persist/getStoredState: Error restoring data for key:' + key);
            console.warn('redux-persist/getStoredState: Error restoring data for key:', key, err);
            // recordNonFatalError('Persist Error', deviceID + ' redux-persist/getStoredState: Error' +
            //   ' restoring' +
            //   ' data for key:' + key + ' ' + err.toString());
          } else restoredState[key] = rehydrate(key, serialized);
          completionCount += 1;
          if (completionCount === restoreCount) complete(null, restoredState);
        });
      });
    });
  }

  run();

  function rehydrate(key, serialized) {
    var state = null;

    try {
      var data = deserializer(serialized);
      state = transforms.reduceRight(function (subState, transformer) {
        return transformer.out(subState, key);
      }, data);
    } catch (err) {
      console.log('redux-persist/getStoredState: Error in rehydrate restoring data for key:', key, err);
      // Alert.alert('redux-persist/getStoredState: Error in rehydrate restoring data for key:' + key);
      // recordNonFatalError('Persist Error', deviceID + ' redux-persist/getStoredState: Error in' +
      // ' rehydrate' +
      //   ' restoring data for key:' + key + ' ' + (err || '').toString());
    }

    return state;
  }

  function complete(err, restoredState) {
    onComplete(err, restoredState);
  }

  function passWhitelistBlacklist(key) {
    if (whitelist && whitelist.indexOf(key) === -1) return false;
    if (blacklist.indexOf(key) !== -1) return false;
    return true;
  }

  function createStorageKey(key) {
    return '' + keyPrefix + key;
  }

  if (typeof onComplete !== 'function' && !!Promise) {
    return new Promise(function (resolve, reject) {
      onComplete = function onComplete(err, restoredState) {
        if (err) reject(err);else resolve(restoredState);
      };
    });
  }
}

function defaultDeserializer(serial) {
  return JSON.parse(serial);
}
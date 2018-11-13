import { KEY_PREFIX } from './constants'
import {Alert} from 'react-native';

import createAsyncLocalStorage from './defaults/asyncLocalStorage'
// import { recordNonFatalError } from "./crashlytics";

export default function getStoredState (deviceID, config, onComplete) {
  let storage = config.storage || createAsyncLocalStorage('local')
  const deserializer = config.serialize === false ? (data) => data : defaultDeserializer
  const blacklist = config.blacklist || []
  const whitelist = config.whitelist || false
  const transforms = config.transforms || []
  const keyPrefix = config.keyPrefix !== undefined ? config.keyPrefix : KEY_PREFIX

  // fallback getAllKeys to `keys` if present (LocalForage compatability)
  if (storage.keys && !storage.getAllKeys) storage = {...storage, getAllKeys: storage.keys}

  let restoredState = {}
  let completionCount = 0
  // let retryCount = 0;

  function run() {
    storage.getAllKeys((err, allKeys) => {
      if (err) {
        Alert.alert('redux-persist/getStoredState: Error in storage.getAllKeys ' + (err || '').toString());
        console.log('redux-persist/getStoredState: Error in storage.getAllKeys');
        recordNonFatalError('Persist Error', deviceID + ' redux-persist/getStoredState: Error in' +
          ' storage.getAllKeys ' + err.toString());
        complete(err)
      }

      console.log(whitelist);
      console.log(keyPrefix);

      let persistKeys = allKeys.filter((key) => key.indexOf(keyPrefix) === 0).map((key) => key.slice(keyPrefix.length))
      let keysToRestore = persistKeys.filter(passWhitelistBlacklist)

      console.log(keysToRestore);

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

      let restoreCount = keysToRestore.length
      if (restoreCount === 0) complete(null, restoredState)
      keysToRestore.forEach((key) => {
        storage.getItem(createStorageKey(key), (err, serialized) => {
          if (err) {
            Alert.alert('redux-persist/getStoredState: Error restoring data for key:' + key + ' ' + (err || '').toString());
            console.warn('redux-persist/getStoredState: Error restoring data for key:', key, err);
            recordNonFatalError('Persist Error', deviceID + ' redux-persist/getStoredState: Error' +
              ' restoring' +
              ' data for key:' + key + ' ' + err.toString());
          }
          else restoredState[key] = rehydrate(key, serialized)
          completionCount += 1
          if (completionCount === restoreCount) complete(null, restoredState)
        })
      })
    });
  }

  run();

  function rehydrate (key, serialized) {
    let state = null

    try {
      let data = deserializer(serialized)
      state = transforms.reduceRight((subState, transformer) => {
        return transformer.out(subState, key)
      }, data)
    } catch (err) {
      console.log('redux-persist/getStoredState: Error in rehydrate restoring data for key:', key, err);
      Alert.alert('redux-persist/getStoredState: Error in rehydrate restoring data for key:' + key + ' ' + (err || '').toString());
      recordNonFatalError('Persist Error', deviceID + ' redux-persist/getStoredState: Error in' +
      ' rehydrate' +
        ' restoring data for key:' + key + ' ' + (err || '').toString());
    }

    return state
  }

  function complete (err, restoredState) {
    onComplete(err, restoredState)
  }

  function passWhitelistBlacklist (key) {
    if (whitelist && whitelist.indexOf(key) === -1) return false
    if (blacklist.indexOf(key) !== -1) return false
    return true
  }

  function createStorageKey (key) {
    return `${keyPrefix}${key}`
  }

  if (typeof onComplete !== 'function' && !!Promise) {
    return new Promise((resolve, reject) => {
      onComplete = (err, restoredState) => {
        if (err) reject(err)
        else resolve(restoredState)
      }
    })
  }
}

function defaultDeserializer (serial) {
  return JSON.parse(serial)
}

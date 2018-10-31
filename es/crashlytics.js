import { Platform } from 'react-native';
import Fabric from 'react-native-fabric';
import { toString } from 'lodash-es';

var recordNonFatalError = function recordNonFatalError(description, error) {
  var Crashlytics = Fabric.Crashlytics;

  var stringError = toString(description) + ': ' + toString(error);
  if (Platform.OS === 'ios') {
    Crashlytics.recordError(stringError);
  } else {
    Crashlytics.logException(stringError);
  }
};

export { recordNonFatalError };
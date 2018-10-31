import { Platform } from 'react-native';
import Fabric from 'react-native-fabric';
import { toString } from 'lodash';

const recordNonFatalError = (description, error) => {
  const { Crashlytics } = Fabric;
  const stringError =  toString(description) + ': ' + toString(error);
  if (Platform.OS === 'ios') {
    Crashlytics.recordError(stringError);
  } else {
    Crashlytics.logException(stringError);
  }
};

export { recordNonFatalError };

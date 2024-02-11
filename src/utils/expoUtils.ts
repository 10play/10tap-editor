export const isExpo = () => {
  let isRunningOnExpo = false;

  // Attempt to require the Expo Constants module
  try {
    const ExpoConstants = require('expo-constants');
    if (ExpoConstants) {
      isRunningOnExpo = true;
    }
  } catch (e) {
    // If the require call throws an error, we're not in an Expo environment
    isRunningOnExpo = false;
  }
  return isRunningOnExpo;
};

import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

var isNative = Capacitor.isNativePlatform();
if (isNative) {
  try {
    document.documentElement.classList.add('is-native-app');
    document.documentElement.setAttribute('data-native', 'true');
    if (document.body) {
      document.body.classList.add('is-native-app');
      document.body.setAttribute('data-native', 'true');
    } else {
      document.addEventListener('DOMContentLoaded', function () {
        if (document.body) {
          document.body.classList.add('is-native-app');
          document.body.setAttribute('data-native', 'true');
        }
      });
    }
  } catch (e) {}
}

window.MedLadderNative = {
  isNative: isNative,
  App,
  Browser
};


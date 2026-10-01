import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

window.MedLadderNative = {
  isNative: Capacitor.isNativePlatform(),
  App,
  Browser
};

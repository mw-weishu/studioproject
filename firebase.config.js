import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import 'firebase/compat/storage';

import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getMessaging, getToken } from 'firebase/messaging';
import { Platform } from 'react-native';

// web app's Firebase configuration
// web allows for cross-platform compatibility
const firebaseConfig = {
  apiKey: "AIzaSyAPn0zqhWOl7sNtQyvw6Mbn8SXxGxCMPFo",
  authDomain: "expo-routime.firebaseapp.com",
  projectId: "expo-routime",
  storageBucket: "expo-routime.firebasestorage.app",
  messagingSenderId: "1062592796578",
  appId: "1:1062592796578:web:d652855860684fe79c44fb",
  measurementId: "G-E0QZBWNCQ7"
};

function requestPermission() {
    console.log('Requesting permission...');
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        // Get registration token. Initially this makes a network call, once retrieved
        // subsequent calls to getToken will return from cache.
        const messaging = getMessaging();
        getToken(messaging, { vapidKey: "YOUR-VAPID-KEY" })
          .then((currentToken) => {
            if (currentToken) {
              console.log('Current registration token: ', currentToken);
              // Send the token to your server and update the UI if necessary
              // ...
            } else {
              // Show permission request UI
              console.log('No registration token available. Request permission to generate one.');
              // ...
            }
          }).catch((err) => {
            console.log('An error occurred while retrieving token. ', err);
            // ...
          });
      }
    });
}

// const requestPermissions = async () => {
//   const { status } = await Notifications.requestPermissionsAsync();
//   if (status !== 'granted') {
//     alert('Permission for notifications was denied');
//   } else {
//     alert('Permission for notifications was granted');
//   }
// };

let app;
if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);

    if (Platform.OS === 'web' && typeof Notification !== 'undefined') {
        requestPermission();
    }

    if (Platform.OS === 'android' || Platform.OS === 'ios') {
        initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
        });

        // requestPermissions();
    }
} else {
    app = firebase.app();
}
  
const database = firebase.database();
const storage = firebase.storage();

// Gemini API endpoint - you'll need to enable the Generative Language API
const GEMINI_API_KEY = 'AIzaSyD5gVv4PHvgdZYr2EbHCQ7X1oznXp6IoLo'; // Or use a separate Gemini API key
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

export { database, firebase, GEMINI_API_KEY, GEMINI_API_URL, storage }; //access auth, storage, etc. from firebase object


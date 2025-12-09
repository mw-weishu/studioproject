import { observable } from '@legendapp/state'

import { configureObservablePersistence, persistObservable, } from '@legendapp/state/persist'
import { ObservablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

export const Appearance$ = observable({
    current: 'dark',
})

if (Platform.OS === 'web') {
    Appearance$.current.set('dark');
}

const configurePersistence = async() => {
    try {
        configureObservablePersistence({
        pluginLocal: ObservablePersistAsyncStorage,
        localOptions: {
          asyncStorage: {
            AsyncStorage,
          },
        },
      });
    } catch (error) {
      console.error("Error configuring persistence:", error);
    }
}; 

const persistAppearance = async() => {
    try {
        persistObservable(Appearance$, {
            local: `Appearance-{...}`, // implement userID and remote???
        });
    } catch (error) {
      console.error("Error persisting Appearance:", error);
    }
}

configurePersistence();
persistAppearance();
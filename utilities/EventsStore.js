import { observable } from '@legendapp/state';

import { configureObservablePersistence, persistObservable, } from '@legendapp/state/persist';
import { ObservablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
import { ObservablePersistFirebase } from "@legendapp/state/persist-plugins/firebase";
import AsyncStorage from '@react-native-async-storage/async-storage';

import { firebase } from '../firebase.config';

// import { scheduleMultipleNotifications } from './Notifications';
// import { selectedRoutineData$ } from './Routines';
// import { selectedScheduleData$ } from './Schedules';
// import { userProfile$ } from './UserProfile';

// Function to configure persistence
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

export const lastUserId$ = observable('');
export const lastUserHandle$ = observable('');

export const public$ = observable({
  [firebase.auth().currentUser?.uid]: {
    events: {},
    repeatingEvents: {},
    schedules: [],
  },
});

export const private$ = observable({
  [firebase.auth().currentUser?.uid]: {
    events: {},
    repeatingEvents: {},
    schedules: [],
    savedEvents: [],
  },
});

export const PastState$ = observable({});
export const RepeatPastState$ = observable({});

// Backward-compatible aliases that dynamically access current user's data
// These allow existing code to continue working without refactoring all at once
export const events$ = new Proxy({}, {
  get(target, prop) {
    const userId = getCurrentUserId();
    if (!userId) return prop === 'get' ? () => ({}) : observable({});
    if (prop === 'get') {
      return () => private$[userId]?.events?.get() || {};
    }
    // Return the specific dateKey observable
    return private$[userId]?.events?.[prop] || observable({});
  }
});

export const repeatingEvents$ = new Proxy({}, {
  get(target, prop) {
    const userId = getCurrentUserId();
    if (!userId) return prop === 'get' ? () => ({}) : observable({});
    if (prop === 'get') {
      return () => private$[userId]?.repeatingEvents?.get() || {};
    }
    // Return the specific repeatKey observable
    return private$[userId]?.repeatingEvents?.[prop] || observable({});
  }
});

export const schedules$ = {
  schedules: {
    get: () => {
      const userId = getCurrentUserId();
      if (!userId) return [];
      return private$[userId]?.schedules?.get() || [];
    },
    set: (value) => {
      const userId = getCurrentUserId();
      if (!userId) return;
      private$[userId]?.schedules?.set(value);
    }
  }
};

export const savedEvents$ = {
  events: {
    get: () => {
      const userId = getCurrentUserId();
      if (!userId) return [];
      return private$[userId]?.savedEvents?.get() || [];
    },
    set: (value) => {
      const userId = getCurrentUserId();
      if (!userId) return;
      private$[userId]?.savedEvents?.set(value);
    }
  }
};

export const publicEvents$ = new Proxy({}, {
  get(target, prop) {
    const userId = getCurrentUserId();
    if (!userId) return prop === 'get' ? () => ({}) : observable({});
    if (prop === 'get') {
      return () => public$[userId]?.events?.get() || {};
    }
    // Return the specific dateKey observable
    return public$[userId]?.events?.[prop] || observable({});
  }
});

export const publicRepeatingEvents$ = new Proxy({}, {
  get(target, prop) {
    const userId = getCurrentUserId();
    if (!userId) return prop === 'get' ? () => ({}) : observable({});
    if (prop === 'get') {
      return () => public$[userId]?.repeatingEvents?.get() || {};
    }
    // Return the specific repeatKey observable
    return public$[userId]?.repeatingEvents?.[prop] || observable({});
  }
});

export const publicSchedules$ = {
  schedules: {
    get: () => {
      const userId = getCurrentUserId();
      if (!userId) return [];
      return public$[userId]?.schedules?.get() || [];
    },
    set: (value) => {
      const userId = getCurrentUserId();
      if (!userId) return;
      public$[userId]?.schedules?.set(value);
    }
  }
};

export const persistEvents = async (userId) => {
  try {
    //public
    // persistObservable(userProfile$[firebase.auth().currentUser?.uid], {
    //   pluginLocal: ObservablePersistAsyncStorage,
    //   local: `/profile/${firebase.auth().currentUser?.uid}/`, // Local storage key (unique to the user)
    //   pluginRemote: ObservablePersistFirebase,
    //   remote: {
    //     onSaveError: (err) => console.error(err),
    //     firebase: {
    //       refPath: () => `/profiles/${firebase.auth().currentUser?.uid}/`,
    //       requireAuth: true,
    //     },
    //   },
    // });
    persistObservable(public$[firebase.auth().currentUser?.uid], {
      pluginLocal: ObservablePersistAsyncStorage,
      local: `/public/${firebase.auth().currentUser?.uid}/`,
      pluginRemote: ObservablePersistFirebase,
      remote: {
        onSaveError: (err) => console.error(err),
        firebase: {
          refPath: () => `/sharedContent/${firebase.auth().currentUser?.uid}/`,
          requireAuth: true,
        },
      },
    });
    //private
    persistObservable(private$[firebase.auth().currentUser?.uid], {
      pluginLocal: ObservablePersistAsyncStorage,
      local: `/private/${firebase.auth().currentUser?.uid}/`,
      pluginRemote: ObservablePersistFirebase,
      remote: {
        onSaveError: (err) => console.error(err),
        firebase: {
          refPath: () => `/users/${firebase.auth().currentUser?.uid}/`,
          requireAuth: true,
        },
      },
    });
    persistObservable(PastState$, {
      pluginLocal: ObservablePersistAsyncStorage,
      local: `/${userId}/pastState`, // Local storage key (unique to the user)
    });
    persistObservable(RepeatPastState$, {
      pluginLocal: ObservablePersistAsyncStorage,
      local: `/${userId}/repeatPastState`, // Local storage key (unique to the user)
    });
  } catch (error) {
    console.error("Error persisting observable:", error);
  }
};

// Listen for authentication state changes
firebase.auth().onAuthStateChanged(async (user) => {
  if (user) {
    await configurePersistence();
    await persistEvents(user.uid);

    // Ensure reverse handle mapping exists for rules access checks
    // try {
    //   const handle = await getHandleForUser(user.uid);
    //   if (handle) {
    //     await firebase.database().ref(`/userHandles/${user.uid}`).set(handle.toLowerCase());
    //   }
    // } catch (e) {
    //   console.warn('Could not set userHandles mapping:', e);
    // }

    // let handle = null;
    // try {
    //   handle = await getHandleForUser(user.uid);
    // } catch (e) {
    //   console.warn('Could not resolve handle for user:', e);
    // }
    // if (handle) {
    //   console.log('Persisting events for user:', user.uid, 'with handle:', handle);
    //   await persistEvents(user.uid, handle);
    // } else {
    //   console.warn('No handle found for user, skipping persistence setup');
    // }
  } else {
    // Clear ALL local storage for the previous user to prevent cross-contamination
    // try {
    //   await AsyncStorage.multiRemove([
    //     'events',
    //     'repeatingEvents',
    //     'savedEvents',
    //     'schedules',
    //     'pastState',
    //     'repeatPastState',
    //     'publicEvents',
    //     'publicRepeatingEvents',
    //     'publicSchedules',
    //   ]);
      
    //   // Also clear any handle-specific profile storage
    //   const allKeys = await AsyncStorage.getAllKeys();
    //   const profileKeys = allKeys.filter(key => key.endsWith('-profile'));
    //   if (profileKeys.length > 0) {
    //     await AsyncStorage.multiRemove(profileKeys);
    //   }
    // } catch (e) {
    //   console.error('Error clearing local storage on sign out:', e);
    // }
    
    // Clear observables when no user is logged in
    // events$.set({});
    // repeatingEvents$.set({});
    // savedEvents$.set({
    //   events: [],
    //   blocks: [],
    //   routines: [],
    // });
    // schedules$.set({
    //   schedules: [],
    // });
    // publicEvents$.set({});
    // publicRepeatingEvents$.set({});
    // publicSchedules$.schedules.set([]);
    // userProfile$.set(undefined);
  }
});

// Function to format the date key
export const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

export const formatRepeatKey = (ruleObject) => {
  switch (ruleObject.rule) {
    case 'regular':
      const keyString1 = 'every' + ruleObject.regular.number + ruleObject.regular.unit[0];
      return keyString1;
    case 'weekdays':
      let keyString2 = 'weekdays';
      for (const day in ruleObject.weekdays) {
        if (ruleObject.weekdays[day].active) {
          keyString2 = keyString2 + ruleObject.weekdays[day].i;
        }
      }
      return keyString2;
  }
}

// Load persisted JSON directly from AsyncStorage for a set of keys and apply to observables.
// This is used as a fallback when remote persistence (Firebase) is not reachable.
// Read persisted JSON directly from AsyncStorage for a set of keys and return it
// without mutating observables. This allows callers to use local data for
// read-only initialization (e.g. scheduling) without triggering writes that
// could overwrite newer remote state when the device reconnects.
// Helper to get current userId
const getCurrentUserId = () => {
  return firebase.auth().currentUser?.uid;
};

export const getLocalPersistedState = async () => {
  const keys = {
    events: `events`,
    repeatingEvents: `repeatingEvents`,
    savedEvents: `savedEvents`,
    schedules: `schedules`,
    pastState: `pastState`,
    repeatPastState: `repeatPastState`,
    publicEvents: `publicEvents`,
    publicRepeatingEvents: `publicRepeatingEvents`,
    publicSchedules: `publicSchedules`,
  };

  const result = {};
  try {
    for (const [name, key] of Object.entries(keys)) {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) {
        result[name] = null;
        continue;
      }
      try {
        result[name] = JSON.parse(raw);
      } catch (err) {
        console.warn(`Failed to parse persisted key ${key}:`, err);
        result[name] = null;
      }
    }
  } catch (err) {
    console.warn('Error reading local persisted state:', err);
    return null;
  }

  return result;
};

export const getEventByID = (id) => {
  const userId = getCurrentUserId();
  if (!userId) return null;
  const dateKey = id.split('-')[0];
  const eventsForDate = private$[userId]?.events?.[dateKey]?.get() || [];
  const event = eventsForDate.find(item => item.id === id);
  return event;
}

// Function to add an event
export const saveEvent = async(event) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  const dateKey = formatDateKey(event.startDate);
  
  // Ensure the userId path exists
  if (!private$[userId].get()) {
    private$[userId].set({ events: {}, repeatingEvents: {}, schedules: [], savedEvents: [] });
  }
  if (!private$[userId].events.get()) {
    private$[userId].events.set({});
  }
  
  const eventsForDate = private$[userId].events[dateKey].get() || [];
  eventsForDate.push(event);

  // Delete the dateKey property
  private$[userId].events[dateKey].set(undefined);

  // Set the new eventsForDate value
  private$[userId].events[dateKey].set(eventsForDate);
};

// Function to remove an event
export const deleteEvent = async(event) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  console.log('Deleting event:', event);
  const eventID = event.id;
  const dateKey = eventID.split('-')[0]; // Extract the dateKey from the event ID
  const eventsForDate = private$[userId]?.events?.[dateKey]?.get() || [];
  const updatedEventsForDate = eventsForDate.filter(item => item.id !== event.id);
  
  // Delete the dateKey property
  private$[userId].events[dateKey].set(undefined);

  // Set the new eventsForDate value
  private$[userId].events[dateKey].set(updatedEventsForDate);
};

// Function to update an event
export const modifyEvent = async(updatedEvent) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  const dateKey = formatDateKey(updatedEvent.startDate);
  const eventsForDate = private$[userId]?.events?.[dateKey]?.get() || [];
  const updatedEventsForDate = eventsForDate.map(item => {
    if (item.id === updatedEvent.id) {
      return updatedEvent;
    }
    return item;
  });

  // Delete the dateKey property
  private$[userId].events[dateKey].set(undefined);

  // Set the new eventsForDate value
  private$[userId].events[dateKey].set(updatedEventsForDate);
};

export const getRepeatingEventByID = (id) => {
  const userId = getCurrentUserId();
  if (!userId) return null;
  console.log(id);
  const repeatKey = id.split('-')[0];
  console.log(repeatKey);
  const eventsForRepeatRule = private$[userId]?.repeatingEvents?.[repeatKey]?.get() || [];
  const event = eventsForRepeatRule.find(item => item.id === id);
  console.log('retuning event: ', event);
  return event;
}

export const saveRepeatingEvent = async(event) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  console.log('event:', event);
  const repeatKey = event.repeatKey;
  
  // Ensure the userId path exists
  if (!private$[userId].get()) {
    private$[userId].set({ events: {}, repeatingEvents: {}, schedules: [], savedEvents: [] });
  }
  if (!private$[userId].repeatingEvents.get()) {
    private$[userId].repeatingEvents.set({});
  }
  
  const events = private$[userId].repeatingEvents[repeatKey].get() || [];
  console.log('events:', events);
  events.push(event);
  private$[userId].repeatingEvents[repeatKey].set(undefined);
  private$[userId].repeatingEvents[repeatKey].set(events);
  console.log('repeatingEvents:', private$[userId].repeatingEvents.get());
}

// export const modifyRepeatingEvent = async(updatedEvent) => {
//   // also in work when deleting the event in one or few days
//   const repeatKey = formatRepeatKey(updatedEvent.repeatRule);
//   console.log('repeatKey:', repeatKey);
//   const events = repeatingEvents$[repeatKey].get();
//   const updatedEvents = events.map(item => {
//     if (item.id === updatedEvent.id) {
//       return updatedEvent;
//     }
//     return item;
//   });

//   repeatingEvents$[repeatKey].set(undefined);
//   repeatingEvents$[repeatKey].set(updatedEvents);
// }

export const deleteRepeatingEvent = async(event) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  const repeatKey = event.repeatKey;
  const events = private$[userId]?.repeatingEvents?.[repeatKey]?.get() || [];
  const updatedEvents = events.filter(item => item.id !== event.id);

  private$[userId].repeatingEvents[repeatKey].set(undefined);
  private$[userId].repeatingEvents[repeatKey].set(updatedEvents);
}

export const addToSavedEvents = async(event) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  
  // Ensure the userId path exists
  if (!private$[userId].get()) {
    private$[userId].set({ events: {}, repeatingEvents: {}, schedules: [], savedEvents: [] });
  }
  
  const savedEvents = private$[userId].savedEvents.get() || [];
  savedEvents.push(event);
  private$[userId].savedEvents.set(undefined);
  private$[userId].savedEvents.set(savedEvents);
};

export const modifySavedEvent = async(updatedEvent) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  const savedEvents = private$[userId]?.savedEvents?.get() || [];
  const updatedSavedEvents = savedEvents.map(item => {
    if (item.id === updatedEvent.id) {
      return updatedEvent;
    }
    return item;
  });

  private$[userId].savedEvents.set(undefined);
  private$[userId].savedEvents.set(updatedSavedEvents);
}

export const deleteSavedEvent = async(event) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  const savedEvents = private$[userId]?.savedEvents?.get() || [];
  const updatedSavedEvents = savedEvents.filter(item => item.id !== event.id);

  private$[userId].savedEvents.set(undefined);
  private$[userId].savedEvents.set(updatedSavedEvents);
}

// export const applySavedEvent = async(event, date) => {
//   const userId = getCurrentUserId();
//   if (!userId) return;
//   const newDate = new Date(date);
//   const newDateKey = formatDateKey(newDate);
  
//   // Ensure the userId path exists
//   if (!private$[userId].get()) {
//     private$[userId].set({ events: {}, repeatingEvents: {}, schedules: [], savedEvents: [] });
//   }
//   if (!private$[userId].events.get()) {
//     private$[userId].events.set({});
//   }
  
//   const eventsForDate = private$[userId].events[newDateKey].get() || [];
//   const startDate = new Date(newDate);
//   const eventstartDate = new Date(event.startDate);
//   startDate.setHours(eventstartDate.getHours());
//   startDate.setMinutes(eventstartDate.getMinutes());
//   const endDate = new Date(newDate);
//   const eventendDate = new Date(event.endDate);
//   endDate.setHours(eventendDate.getHours());
//   endDate.setMinutes(eventendDate.getMinutes());
//   // respect midnight
//   if(endDate.getHours() == 0 && endDate.getMinutes() == 0){
//     endDate.setDate(endDate.getDate() + 1);
//   }
//   const newEvent = {
//     ...event,
//     id: getEventID(startDate),
//     description: event.description || "",
//     eventType: 'pager',
//     repeatKey: 'none',
//     // this prevents first startDate/endDate Date persistence
//     startDate: startDate,
//     endDate: endDate,
//     modified: new Date(),
//   };
//   eventsForDate.push(newEvent);
//   private$[userId].events[newDateKey].set(undefined);
//   private$[userId].events[newDateKey].set(eventsForDate);

//   scheduleMultipleNotifications();
// }

// export const addToSavedRoutines = async(routine) => {
//   const savedRoutines = savedEvents$.routines.get() || [];
//   savedRoutines.push(routine);
//   savedEvents$.routines.set(undefined);
//   savedEvents$.routines.set(savedRoutines);
// }

// export const modifySavedRoutine = async(updatedRoutine) => {
//   const savedRoutines = savedEvents$.routines.get() || [];
//   const updatedSavedRoutines = savedRoutines.map(item => {
//     if (item.id === updatedRoutine.id) {
//       return updatedRoutine;
//     }
//     return item;
//   });

//   savedEvents$.routines.set(undefined);
//   savedEvents$.routines.set(updatedSavedRoutines);
// }

// export const deleteSavedRoutine = async(routine) => {
//   const savedRoutines = savedEvents$.routines.get() || [];

//   const updatedSavedRoutines = savedRoutines.filter(item => {
//     return item.id !== routine.id;
//   });

//   savedEvents$.routines.set(undefined);
//   savedEvents$.routines.set(updatedSavedRoutines);
// }

// export const applySavedRoutine = async(routine, date) => {
//   for (const day in routine.days) {
//     const eventsForDay = routine.days[day];
//     const newDate = new Date(date);
//     newDate.setDate(newDate.getDate() + (day - 1));
//     const newDateKey = formatDateKey(newDate);
//     const eventsForDate = events$[newDateKey].get() || [];
    
//     var i = 0;
//     eventsForDay.forEach(event => {
//       const startDate = new Date(newDate);
//       const eventstartDate = new Date(event.startDate);
//       startDate.setHours(eventstartDate.getHours());
//       startDate.setMinutes(eventstartDate.getMinutes());
//       const endDate = new Date(newDate);
//       const eventendDate = new Date(event.endDate);
//       endDate.setHours(eventendDate.getHours());
//       endDate.setMinutes(eventendDate.getMinutes());
//       // respect midnight
//       if(endDate.getHours() == 0 && endDate.getMinutes() == 0){
//         endDate.setDate(endDate.getDate() + 1);
//       }
//       const newEvent = {
//         ...event,
//         id: getAppliedRoutineEventID(newDate, i),
//         description: event.description || "",
//         startDate: startDate,
//         endDate: endDate,
//         modified: new Date(),
//       };
//       eventsForDate.push(newEvent);

//       scheduleSingleNotification(newEvent.id, newEvent.title, newEvent.description, newEvent.startDate, newEvent.endDate, newEvent.modified);
//       i++;
//     });
//     events$[newDateKey].set(undefined);
//     events$[newDateKey].set(eventsForDate);
//   }
// }

export const addToPublicEvents = async(event) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  const dateKey = formatDateKey(event.startDate);
  
  // Ensure the userId path exists
  if (!public$[userId].get()) {
    public$[userId].set({ events: {}, repeatingEvents: {}, schedules: [] });
  }
  if (!public$[userId].events.get()) {
    public$[userId].events.set({});
  }
  
  const eventsForDate = public$[userId].events[dateKey].get() || [];
  const publicEvent = {
    ...event,
    id: event.id + '-public',
    eventType: 'public',
  }
  eventsForDate.push(publicEvent);
  public$[userId].events[dateKey].set(undefined);
  public$[userId].events[dateKey].set(eventsForDate);
};

export const deletePublicEvent = async(event) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  const eventID = event.id;
  const dateKey = eventID.split('-')[0]; // Extract the dateKey from the event ID
  const eventsForDate = public$[userId]?.events?.[dateKey]?.get() || [];
  const updatedEventsForDate = eventsForDate.filter(item => item.id !== event.id);
  public$[userId].events[dateKey].set(undefined);
  public$[userId].events[dateKey].set(updatedEventsForDate);
};

// export const modifyPublicEvent = async(updatedEvent) => {
//   const dateKey = formatDateKey(updatedEvent.startDate);
//   const eventsForDate = publicEvents$[dateKey].get() || [];
//   const updatedEventsForDate = eventsForDate.map(item => {
//     if (item.id === updatedEvent.id) {
//       return updatedEvent;
//     }
//     return item;
//   });
//   publicEvents$[dateKey].set(undefined);
//   publicEvents$[dateKey].set(updatedEventsForDate);
// };

export const addToPublicRepeatingEvents = async(event) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  const repeatKey = event.repeatKey;
  
  // Ensure the userId path exists
  if (!public$[userId].get()) {
    public$[userId].set({ events: {}, repeatingEvents: {}, schedules: [] });
  }
  if (!public$[userId].repeatingEvents.get()) {
    public$[userId].repeatingEvents.set({});
  }
  
  const events = public$[userId].repeatingEvents[repeatKey].get() || [];
  events.push(event);
  public$[userId].repeatingEvents[repeatKey].set(undefined);
  public$[userId].repeatingEvents[repeatKey].set(events);
};

export const deletePublicRepeatingEvent = async(event) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  const repeatKey = event.repeatKey;
  const events = public$[userId]?.repeatingEvents?.[repeatKey]?.get() || [];
  const updatedEvents = events.filter(item => item.id !== event.id);
  public$[userId].repeatingEvents[repeatKey].set(undefined);
  public$[userId].repeatingEvents[repeatKey].set(updatedEvents);
};

export const addToSchedules = async(schedule) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  
  // Ensure the userId path exists
  if (!private$[userId].get()) {
    private$[userId].set({ events: {}, repeatingEvents: {}, schedules: [], savedEvents: [] });
  }
  
  const schedules = private$[userId].schedules.get() || [];
  schedules.push(schedule);
  private$[userId].schedules.set(undefined);
  private$[userId].schedules.set(schedules);
}

export const modifySchedule = async(updatedSchedule) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  const schedules = private$[userId]?.schedules?.get() || [];
  const updatedSchedules = schedules.map(item => {
    if (item.id === updatedSchedule.id) {
      return updatedSchedule;
    }
    return item;
  });

  private$[userId].schedules.set(undefined);
  private$[userId].schedules.set(updatedSchedules);
}

export const deleteSchedule = async(schedule) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  const schedules = private$[userId]?.schedules?.get() || [];

  const updatedSchedules = schedules.filter(item => {
    return item.id !== schedule.id;
  });

  private$[userId].schedules.set(undefined);
  private$[userId].schedules.set(updatedSchedules);
}

export const addToPublicSchedules = async(schedule) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  
  // Ensure the userId path exists
  if (!public$[userId].get()) {
    public$[userId].set({ events: {}, repeatingEvents: {}, schedules: [] });
  }
  
  const schedules = public$[userId].schedules.get() || [];
  schedules.push(schedule);
  public$[userId].schedules.set(undefined);
  public$[userId].schedules.set(schedules);
};

export const modifyPublicSchedule = async(updatedSchedule) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  const schedules = public$[userId]?.schedules?.get() || [];
  const updatedSchedules = schedules.map(item => {
    if (item.id === updatedSchedule.id) {
      return updatedSchedule;
    }
    return item;
  });

  public$[userId].schedules.set(undefined);
  public$[userId].schedules.set(updatedSchedules);
};

export const deletePublicSchedule = async(schedule) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  const schedules = public$[userId]?.schedules?.get() || [];
  const updatedSchedules = schedules.filter(item => item.id !== schedule.id);
  public$[userId].schedules.set(undefined);
  public$[userId].schedules.set(updatedSchedules);
};

const getAppliedRoutineEventID = (date, reIndex) => {
  const userId = getCurrentUserId();
  if (!userId) return '0-0';
  const dateKey = formatDateKey(date);
  const eventsForDate = private$[userId]?.events?.[dateKey]?.get() || [];
  const usedIndices = new Set();

  for (let i = 0; i < eventsForDate.length; i++) {
    const eventIdParts = eventsForDate[i].id.split('-');
    const index = parseInt(eventIdParts[1], 10);
    usedIndices.add(index);
  }

  let newIndex = 0;
  while (usedIndices.has(newIndex) || newIndex < reIndex) {
    newIndex++;
  }

  const newEventID = `${dateKey}-${newIndex}`;
  return newEventID;
}

export const getEventID = (date) => {
  const userId = getCurrentUserId();
  if (!userId) return '0-0';
  const dateKey = formatDateKey(date);
  const eventsForDate = private$[userId]?.events?.[dateKey]?.get() || [];
  const usedIndices = new Set();

  for (let i = 0; i < eventsForDate.length; i++) {
    const eventIdParts = eventsForDate[i].id.split('-');
    const index = parseInt(eventIdParts[1], 10);
    usedIndices.add(index);
  }

  let newIndex = 0;
  while (usedIndices.has(newIndex)) {
    newIndex++;
  }

  const newEventID = `${dateKey}-${newIndex}`;
  return newEventID;
};

export const getRepeatingEventID = (repeatKey) => {
  const userId = getCurrentUserId();
  if (!userId) return 'E1D-1';
  const events = private$[userId]?.repeatingEvents?.[repeatKey]?.get() || [];
  const usedIndices = new Set();

  for (let i = 0; i < events.length; i++) {
    const eventIdParts = events[i].id.split('-');
    const index = parseInt(eventIdParts[1], 10);
    usedIndices.add(index);
  }

  let newIndex = 1;
  while (usedIndices.has(newIndex)) {
    newIndex++;
  }

  let repeatString;
  if (repeatKey.startsWith('every')) {
    // e.g. 'E1D' or 'E1M' or 'E1Y'
    repeatString = 'E' + repeatKey.slice(5, -1) + repeatKey.slice(-1).toString().toUpperCase();
  } else if (repeatKey.startsWith('weekdays')) {
    repeatString = 'W' + repeatKey.slice(8);
  }

  const newEventID = `${repeatString}-${newIndex}`;
  return newEventID;
}

export const getSavedEventID = () => {
  const userId = getCurrentUserId();
  if (!userId) return 'e1';
  const savedEvents = private$[userId]?.savedEvents?.get() || [];
  const usedIndices = new Set();

  for (let i = 0; i < savedEvents.length; i++) {
    const eventIdParts = savedEvents[i].id.split('e')
    const index = parseInt(eventIdParts[1], 10);
    usedIndices.add(index);
  }
  let newIndex = 1;
  while (usedIndices.has(newIndex)) {
    newIndex++;
  }
  const newSavedEventID = `e${newIndex}`;
  return newSavedEventID;
}

export const getRoutineID = () => {
  const savedRoutines = savedEvents$.routines.get() || [];
  const usedIndices = new Set();

  for (let i = 0; i < savedRoutines.length; i++) {
    const routineIdParts = savedRoutines[i].id.split('r')
    const index = parseInt(routineIdParts[1], 10);
    usedIndices.add(index);
  }
  let newIndex = 1;
  while (usedIndices.has(newIndex)) {
    newIndex++;
  }
  const newRoutineID = `r${newIndex}`;
  return newRoutineID;
}

// export const getRoutineEventID = (routineId, day) => {
//   const days = selectedRoutineData$.get().days[day];
//   const usedIndices = new Set();
//   for (let i = 0; i < days.length; i++) {
//     const eventIdParts = days[i].id.split('-');
//     const index = parseInt(eventIdParts[1], 10);
//     usedIndices.add(index);
//   }
//   let newIndex = 1;
//   while (usedIndices.has(newIndex)) {
//     newIndex++;
//   }
//   const newRoutineEventID = `${routineId}d${day}-${newIndex}`;
//   return newRoutineEventID;
// } 

export const getScheduleID = () => {
  const userId = getCurrentUserId();
  if (!userId) return 's1';
  const schedules = private$[userId]?.schedules?.get() || [];
  const usedIndices = new Set();

  for (let i = 0; i < schedules.length; i++) {
    const scheduleIdParts = schedules[i].id.split('s')
    const index = parseInt(scheduleIdParts[1], 10);
    usedIndices.add(index);
  }
  let newIndex = 1;
  while (usedIndices.has(newIndex)) {
    newIndex++;
  }
  const newScheduleID = `s${newIndex}`;
  return newScheduleID;
}

// export const getScheduleEventID = (scheduleId , day) => {
//   const days = selectedScheduleData$.get().days[day];
//   const usedIndices = new Set();

//   for (let i = 0; i < days.length; i++) {
//     const eventIdParts = days[i].id.split('-');
//     const index = parseInt(eventIdParts[1], 10);
//     usedIndices.add(index);
//   }
//   let newIndex = 1;
//   while (usedIndices.has(newIndex)) {
//     newIndex++;
//   }
//   const newScheduleEventID = `${scheduleId}d${day}-${newIndex}`;
//   return newScheduleEventID;
// }


// Getting Repeating Events
export const filterRepeatingEvents = (dateKey) => {
  const userId = getCurrentUserId();
  if (!userId || !dateKey || dateKey.length !== 8) {
    console.error("Invalid dateKey or no user:", dateKey);
    return [];
  }

  const year = parseInt(dateKey.slice(0, 4), 10);
  const month = parseInt(dateKey.slice(4, 6), 10) - 1; // Months are 0-based in JavaScript Date
  const day = parseInt(dateKey.slice(6, 8), 10);
  const date = new Date(year, month, day, 0, 0, 0, 0);

  const adjustEventTime = (event) => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    const adjustedstartDate = new Date(date);
    adjustedstartDate.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds());
    const adjustedendDate = new Date(date);
    adjustedendDate.setHours(endDate.getHours(), endDate.getMinutes(), endDate.getSeconds(), endDate.getMilliseconds());
    if (adjustedendDate.getHours() === 0 && adjustedendDate.getMinutes() === 0) {
      adjustedendDate.setDate(adjustedendDate.getDate() + 1);
    }
    return { ...event, startDate: adjustedstartDate, endDate: adjustedendDate };
  };

  const repeatingEvents = private$[userId]?.repeatingEvents?.get() || {};
  const publicRepeatingEvents = public$[userId]?.repeatingEvents?.get() || {};
  const combinedRepeatingEvents = { ...repeatingEvents, ...publicRepeatingEvents };
  const filteredEvents = [];

  Object.keys(combinedRepeatingEvents).forEach(key => {
    if (key.startsWith('every')) {
      const unit = key.slice(-1);
      const frequency = parseInt(key.slice(5, -1), 10);
      const events = combinedRepeatingEvents[key].filter(event => {
        if (!event.on) {
          return false; // Skip events that are turned off
        }
        const compareDate = new Date(year, month, day, 0, 0);
        const startDate = new Date(new Date(event.startDate).getFullYear(), new Date(event.startDate).getMonth(), new Date(event.startDate).getDate(), 0, 0, 0, 0);
        const diffDays = Math.floor((compareDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const endAfterDate = new Date(new Date(event.endAfter).getFullYear(), new Date(event.endAfter).getMonth(), new Date(event.endAfter).getDate(), new Date(event.endAfter).getHours(), new Date(event.endAfter).getMinutes());
        
        // if (event.starts) {
          if (compareDate < startDate) {
            return false;
          }
        // }
        if (event.ends) {
          if (compareDate > endAfterDate) {
            return false;
          }
        }
        if (unit === 'd') {
          return diffDays % frequency === 0;
        } else if (unit === 'm') {
          return (date.getMonth() - startDate.getMonth() + (12 * (date.getFullYear() - startDate.getFullYear()))) % frequency === 0;
        } else if (unit === 'y') {
          return (date.getFullYear() - startDate.getFullYear()) % frequency === 0;
        }
        return false;
      }).map(adjustEventTime);
      filteredEvents.push(...events);
    } else if (key.startsWith('weekdays')) {
      const weekdays = key.slice(8).split('').map(Number);
      const dayOfWeek = date.getDay();
      if (weekdays.includes(dayOfWeek)) {
        const events = repeatingEvents[key].filter(event => {
          const compareDate = new Date(year, month, day, 0, 0);
          const startDate = new Date(new Date(event.startDate).getFullYear(), new Date(event.startDate).getMonth(), new Date(event.startDate).getDate(), 0, 0, 0, 0);
          const diffDays = Math.floor((compareDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const endAfterDate = new Date(new Date(event.endAfter).getFullYear(), new Date(event.endAfter).getMonth(), new Date(event.endAfter).getDate(), new Date(event.endAfter).getHours(), new Date(event.endAfter).getMinutes());
          
          // if (event.starts) {
            if (compareDate < startDate) {
              return false;
            }
          // }
          if (event.ends) {
            if (compareDate > endAfterDate) {
              return false;
            }
          }
          return true;
        }).map(adjustEventTime);
        filteredEvents.push(...events);
      }
    }
  });

  return filteredEvents;
};

export const filterScheduleEvents = (dateKey) => {
  const userId = getCurrentUserId();
  if (!userId || !dateKey || dateKey.length !== 8) {
    console.error("Invalid dateKey or no user:", dateKey);
    return [];
  }

  const year = parseInt(dateKey.slice(0, 4), 10);
  const month = parseInt(dateKey.slice(4, 6), 10) - 1; // Months are 0-based in JavaScript Date
  const day = parseInt(dateKey.slice(6, 8), 10);
  const date = new Date(year, month, day, 0, 0, 0, 0);

  const adjustEventTime = (event) => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    const adjustedstartDate = new Date(date);
    adjustedstartDate.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), startDate.getMilliseconds());
    const adjustedendDate = new Date(date);
    adjustedendDate.setHours(endDate.getHours(), endDate.getMinutes(), endDate.getSeconds(), endDate.getMilliseconds());
    if (adjustedendDate.getHours() === 0 && adjustedendDate.getMinutes() === 0) {
      adjustedendDate.setDate(adjustedendDate.getDate() + 1);
    }
    return { ...event, startDate: adjustedstartDate, endDate: adjustedendDate };
  };

  const schedules = private$[userId]?.schedules?.get() || [];
  const publicSchedules = public$[userId]?.schedules?.get() || [];
  const combinedSchedules = [...schedules, ...publicSchedules];
  const filteredEvents = [];

  combinedSchedules.forEach(schedule => {
    // by default repeat every schedule days length
    if (schedule && schedule.on === true) {
      // ensure we have a days object to iterate
      const daysObj = schedule.days || {};
      // safe parse for repeat rule, default to 1 day if missing
      const repeatDaysRule = Number.parseInt(schedule.repeatRule?.regular?.number ?? '1', 10);

      Object.keys(daysObj).forEach(key => {
        // ensure the day list is an array before filtering
        const dayList = Array.isArray(daysObj[key]) ? daysObj[key] : [];
        const events = dayList.filter(event => {

          const compareDate = new Date(year, month, day, 0, 0, 0, 0);
          const startDate = new Date(schedule.startDate);
          const diffDays = Math.round((compareDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)); // kinda works
          const diff = diffDays - parseInt(key, 10);
          // ensure schedule has started
          if (compareDate < startDate) {
            return false;
          }

          // if (compareDate > endDate) {
          //   return false;
          // }

          return (diff) % repeatDaysRule === 0;
        }).map(adjustEventTime);
        filteredEvents.push(...events);
      });
    }
  });

  return filteredEvents;
};
    

export const getEventsForDate = (dateKey) => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  const events = private$[userId]?.events?.[dateKey]?.get() || [];
  const publicEvents = public$[userId]?.events?.[dateKey]?.get() || [];

  return [...events, ...publicEvents];
}

export const getAllRepeatingEvents = () => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  const allRepeatingEvents = private$[userId]?.repeatingEvents?.get() || {};
  const allEvents = [];

  Object.keys(allRepeatingEvents).forEach(key => {
    allEvents.push(...allRepeatingEvents[key]);
  });

  return allEvents;
};

// export const getAllSavedEvents = () => {
//   return savedEvents$.events.get() || [];
// }
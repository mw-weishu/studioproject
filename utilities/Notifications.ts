// import { observable } from '@legendapp/state';
// import notifee, { AlarmType, AndroidImportance, AndroidStyle, TimestampTrigger, TriggerType } from '@notifee/react-native';
// import { events$, formatDateKey, getLocalPersistedState, PastState$, repeatingEvents$, RepeatPastState$, schedules$ } from './EventsStore';
// import BackgroundFetch from 'react-native-background-fetch';
// import { Platform } from 'react-native';

// interface Event {
//   id: string;
//   title: string;
//   description: string;
//   startDate: Date;
//   endDate: Date;
//   ends: boolean;
//   endAfter: Date;
//   on: boolean;
//   notification: boolean;

//   modified: Date;
// }

// interface Schedule {
//   on: boolean;
//   id: string;
//   title: string;
//   description: string;
//   startDate: Date;
//   repeats: boolean;
//   repeatRule: {
//     regular: {
//       number: string;
//       unit: string;
//     };
//   };
//   ends: boolean;
//   endDate: Date;
//   days: {
//     [key: string]: Event[];
//   }
// }

// interface RepeatingEventsState {
//   [key: string]: Event[];
// }

// interface EventsState {
//   [key: string]: Event[];
// }

// export const selectedNotificationData$ = observable({
//   id: null,
//   title: '',
//   description: '',
//   startDate: new Date(0),
//   endDate: new Date(0),
//   modified: new Date(0),
// });

// /**
//  * Poll a getter for up to `timeoutMs` milliseconds until it returns a non-empty
//  * object (Object.keys(...).length > 0). Returns the last-read value from the
//  * getter (which may be empty if timeout is reached).
//  */
// const waitForState = async (getFn: () => any, timeoutMs = 1000, intervalMs = 100, localStorageKey: string) => {
//   console.log('waitForState called for key:', localStorageKey);
//   try {
//     console.log('starting');
//     // const current = getFn?.();
//     // if (current && Object.keys(current).length > 0) return current;
//     // console.log('waiting');
//     // const start = Date.now();
//     // while (Date.now() - start < timeoutMs) {
//     //   // small pause
//     //   // eslint-disable-next-line no-await-in-loop
//     //   console.log('waiting loop');
//     //   // !!! something here is not working
//     //   await new Promise((res) => setTimeout(res, intervalMs));
//     //   const s = getFn?.();
//     //   if (s && Object.keys(s).length > 0) return s;
//     // }
//     // console.log('waitForState timed out');
    
//     // If observables are still empty, try to read the local persisted copy
//     // from AsyncStorage (without mutating observables) so initialization can
//     // proceed in offline scenarios.
//     const currentAfterTimeout = events$.get?.();
//     if (currentAfterTimeout && Object.keys(currentAfterTimeout).length > 0) return currentAfterTimeout;
//     console.log('checking local storage for key:', localStorageKey);
//     try {
//         console.log('reading local storage');
//         const local = await getLocalPersistedState();
//         const localAny = local as any;
//         console.log('local storage read complete');
//         if (localAny && localAny[localStorageKey] && Object.keys(localAny[localStorageKey]).length > 0) {
//             console.log('data found in local storage for key:', localStorageKey);
//             return localAny[localStorageKey];
//         }
//     } catch (e) {
//         console.warn('getLocalPersistedState failed', e);
//     }
//     console.log('no data found in local storage for key:', localStorageKey);
//     // final attempt
//     return getFn?.();
//   } catch (err) {
//     console.warn('waitForState error', err);
//     return getFn?.();
//   }
//   console.log('exiting waitForState for key:', localStorageKey);
// };

// export const cancelAllNotifications = async () => {
//     try {
//         await notifee.cancelAllNotifications();
//     } catch (error) {
//         console.log('Error: ', error);
//     }
// }

// export const getAllNotifications = async () => {
//   try{
//   const notifications = await notifee.getTriggerNotifications();
//   const displayedNotifications = await notifee.getDisplayedNotifications();
//   notifications.push(...displayedNotifications);
//   console.log('All Notifications: ', notifications);
//   const ids = await notifee.getTriggerNotificationIds();
//   console.log('All IDs: ', ids);
//   }
//   catch (error) {
//       console.log('Error: ', error);
//   }
// }

// export const scheduleSingleNotification = async (id: string, title: string, description: string, startDate: any, endDate: any, now: any) => {

//   console.log('ID: ', id, 'Title: ', title, 'Start Time: ', startDate, 'End Time: ', endDate);

//   const timestamp = startDate < now ? now.getTime() + 1000 : startDate.getTime();
//     const start = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//     const end = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//     const durationString = `${start} - ${end}`;
//   const duration = startDate < now ? endDate - now : endDate - startDate;

//   // Convert newline characters in description to HTML <br> tags so the notification
//   // body and style.text can contain line breaks represented as HTML.
//   // Handles CRLF, LF, and CR.
//   const safeDescription = description || '';
//   const htmlDescription = safeDescription.replace(/\r\n|\n|\r/g, '<br>');
//   // Also create a plain-text version without HTML tags for BigText (safer)
//   const plainDescription = htmlDescription.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

//   const chronometerTimestamp = timestamp + duration;

//   try {
//     const channelId = await notifee.createChannel({
//       id: 'default',
//       name: 'Default Channel',
//     });

//     // Create a time-based trigger
//     const trigger: TimestampTrigger = {
//       type: TriggerType.TIMESTAMP,
//       timestamp: timestamp,
//       alarmManager: {
//         type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
//       },
//     };

//     // Create a trigger notification
//     // Notifee expects a valid string for BigTextStyle.text; avoid passing
//     // invalid/empty values. Use the HTML-converted description only when it's
//     // a non-empty string and cap its length to a reasonable size.
//     const bigText = (typeof htmlDescription === 'string' && htmlDescription.trim().length > 0)
//       ? htmlDescription.substring(0, 1000)
//       : undefined;
    
//     // console.log('Big Text Value: ', bigText);


//     // const androidOptions: any = {};

//     if (bigText) {
//       // Create a trigger notification
//       await notifee.createTriggerNotification(
//       {
//           id: id,
//           title: title,
//           body: plainDescription.length > 0 ? htmlDescription : undefined,
//           subtitle: durationString,
//           data: { notificationId: id, title: title, description: description, startDate: startDate.toString(), endDate: endDate.toString() },
//           android: {
//               channelId,
//               importance: AndroidImportance.HIGH,
//               // ongoing: true,
//               timeoutAfter: duration,
//               autoCancel: false, // do not cancel on notification tap
//               pressAction: {
//                   id: 'default',
//               },
//               color: '#DAA520', // Goldenrod
//               showChronometer: true,
//               chronometerDirection: 'down',
//               timestamp: chronometerTimestamp, // Set the timestamp to the end time
//               style: { type: AndroidStyle.BIGTEXT, text: htmlDescription}
//           },
//       },
//       trigger,
//       );
//     }
//     else {
//       await notifee.createTriggerNotification(
//       {
//           id: id,
//           title: title,
//           body: plainDescription.length > 0 ? htmlDescription : undefined,
//           subtitle: durationString,
//           data: { notificationId: id, title: title, description: description, startDate: startDate.toString(), endDate: endDate.toString() },
//           android: {
//               channelId,
//               importance: AndroidImportance.HIGH,
//               // ongoing: true,
//               timeoutAfter: duration,
//               autoCancel: false, // do not cancel on notification tap
//               pressAction: {
//                   id: 'default',
//               },
//               color: '#DAA520', // Goldenrod
//               showChronometer: true,
//               chronometerDirection: 'down',
//               timestamp: chronometerTimestamp, // Set the timestamp to the end time
//           },
//       },
//       trigger,
//       ); 
//     }
//     return true;
//   } catch (err) {
//     console.warn('scheduleSingleNotification failed for id:', id, err);
//     return false;
//   }
// }

// export const cancelNotification = async (id: string) => {
//     try {
//         await notifee.cancelNotification(id);
//     } catch (error) {
//         console.log('Error: ', error);
//     }
// }

// export const scheduleMultipleNotifications = async () => {
//   const currentNotifications = await notifee.getTriggerNotifications();
//   const displayedNotifications = await notifee.getDisplayedNotifications();
//   currentNotifications.push(...displayedNotifications);
//   const currentIds = currentNotifications.map((notification: any) => notification.notification.id);
//   const currentEventsIds = currentIds.filter((id) => /^[0-9]/.test(id));
  
//   let eventsState: EventsState = events$.get();
//   console.log('EventsState: ', eventsState);
//     // Step 1: Get PastState$ observable data
//   let pastState: { [key: string]: { id: string; modified: Date }[] } = PastState$.get() || {};
//   console.log('PastState: ', pastState);

//   console.log(Object.keys(eventsState).length === 0);
//   if (Object.keys(eventsState).length === 0) {
//     const waitedEventsState = await waitForState(() => events$.get?.(), 1000, 100, 'events');
//     eventsState = waitedEventsState || eventsState || {};
//     console.log('EventsState after wait: ', eventsState);
//     const waitedPastState = await waitForState(() => PastState$.get?.(), 1000, 100, 'pastState');
//     pastState = waitedPastState || pastState || {};
//     console.log('PastState after wait: ', pastState);
//   }

//   const compareNow = new Date();
//   compareNow.setHours(0, 0, 0, 0);

//   const compareNotifIds: string[] = [];

//   // Step 2: Schedule notifications for events
//   Object.keys(eventsState).forEach((key) => {

//     // Parse the key (YYYYMMDD) into a valid date
//     const year = parseInt(key.slice(0, 4), 10);
//     const month = parseInt(key.slice(4, 6), 10) - 1; // Month is zero-based
//     const day = parseInt(key.slice(6, 8), 10);
//     const compareDate = new Date(year, month, day);

//     if (compareDate >= compareNow) {
//       for (const event of eventsState[key]) {
//         const pastEventsForKey = pastState[key] || [];
//         const pastEvent = pastEventsForKey.find((e) => e.id === event.id);

//         const isModifiedNewer = !pastEvent || new Date(event.modified) > new Date(pastEvent.modified);

//         if ((event.notification) && (!currentEventsIds.includes(event.id) || isModifiedNewer)) {
//           const startDate = new Date(event.startDate);
//           const endDate = new Date(event.endDate);
//           const now = new Date();
//           scheduleSingleNotification(event.id, event.title, event.description, startDate, endDate, now);
//         }
//         compareNotifIds.push(event.id);
//       }
//     } else {
//       console.log('Events date is in the past: ', key);
//     }
//   });

//   // Step 3: After scheduling, update PastState$ with new data from eventsState
//   const newPastState: { [key: string]: { id: string; modified: Date }[] } = {};
//   Object.keys(eventsState).forEach((key) => {
//     newPastState[key] = eventsState[key].map(event => ({
//       id: event.id,
//       modified: event.modified,
//     }));
//   });
//   PastState$.set(newPastState);
//   console.log('New PastState: ', PastState$.get());

//   // canceling difference in past scheduled Notifications and currently scheduled Notifications
//   const notifIdsToCancel = currentEventsIds.filter((id) => !compareNotifIds.includes(id));
//   for (const id of notifIdsToCancel) {
//     cancelNotification(id);
//   }
  
//   // canceling android notifications that have a timeoutAfter in the past
//   if (Platform.OS === 'android') {
//     const displayedNotificationsIdsToCancel = displayedNotifications.filter((notification: any) => {
//       const timeoutAfter = notification.notification.android?.timeoutAfter;
//       if (timeoutAfter) {
//         const now = new Date();
//         const timeoutDate = new Date(notification.trigger.timestamp + timeoutAfter);
//         return timeoutDate < now;
//       }
//       return false;
//     }).map((notification: any) => notification.notification.id);
    
//     const TriggerNotificationsIdsToCancel = currentNotifications.filter((notification: any) => {
//       const timeoutAfter = notification.notification.android?.timeoutAfter;
//       if (timeoutAfter) {
//         const now = new Date();
//         const timeoutDate = new Date(notification.trigger.timestamp + timeoutAfter);
//         return timeoutDate < now;
//       }
//       return false;
//     }).map((notification: any) => notification.notification.id);
//     for (const id of displayedNotificationsIdsToCancel) {
//       console.log('Cancelling displayed notification: ', id);
//       await notifee.cancelNotification(id);
//     }
//     for (const id of TriggerNotificationsIdsToCancel) {
//       console.log('Cancelling trigger notification: ', id);
//       await notifee.cancelNotification(id);
//     }
//   }
// };

// export const scheduleMultipleRepeatingNotifications = async () => {
//   const currentNotifications = await notifee.getTriggerNotifications();
//   const displayedNotifications = await notifee.getDisplayedNotifications();
//   currentNotifications.push(...displayedNotifications);
//   const currentIds = currentNotifications.map((notification: any) => notification.notification.id);
//   // change s -> S ???
//   const currentRepeatingNotificationsIds = currentIds.filter((id) => id.startsWith('E') || id.startsWith('W') || id.startsWith('s'));

//   // Step 1: Get PastState$ observable data
//   let repeatPastState: { [key: string]: { id: string; modified: Date }[] } = RepeatPastState$.get() || {};
//   console.log('RepeatPastState: ', repeatPastState);

//   let repeatingEventsState: RepeatingEventsState = repeatingEvents$.get();
//   console.log('Repeating Events State: ', repeatingEventsState);
//   let schedulesState: Schedule[] = schedules$.schedules.get();
//   console.log('Schedules State: ', schedulesState);

//   // If both repeating events and schedules are empty, wait a short time for
//   // hydration. We need to consider schedules separately because schedules may
//   // be populated while repeatingEvents remain empty.
//   const schedulesNow = schedules$.schedules.get();
//   console.log(Object.keys(repeatingEventsState || {}).length === 0, Object.keys(schedulesNow || {}).length === 0);
//   if ((Object.keys(repeatingEventsState || {}).length === 0) && (Object.keys(schedulesNow || {}).length === 0)) {
//     const waitedRepeatingEvents = await waitForState(() => repeatingEvents$.get?.(), 1000, 100, 'repeatingEvents');
//     repeatingEventsState = waitedRepeatingEvents || repeatingEventsState || {};
//     console.log('Repeating Events State after wait: ', repeatingEventsState);
//     const waitedSchedules = await waitForState(() => schedules$.schedules.get?.(), 1000, 100, 'schedules');
//     schedulesState = waitedSchedules || schedulesState || {};
//     console.log('Schedules State after wait: ', schedulesState);
//     const waitedRepeatPastState = await waitForState(() => RepeatPastState$.get?.(), 1000, 100, 'repeatPastState');
//     repeatPastState = waitedRepeatPastState || repeatPastState || {};
//     console.log('repeatPastState after wait: ', repeatPastState);
//   }

//   const compareNotifIds: string[] = [];

//   // Step 2: Schedule notifications for repeating events
//   Object.keys(repeatingEventsState).forEach((key) => {
//     for (const event of repeatingEventsState[key]) {
//       if (event.notification && event.on && (event.ends === false || (event.ends === true && event.endAfter >= new Date()))) {
//         // Find the corresponding event in PastState$ by id
//         const pastEventsForKey = repeatPastState[key] || [];
//         const pastEvent = pastEventsForKey.find((e) => e.id === event.id);

//         // Compare modified dates
//         const isModifiedNewer = !pastEvent || new Date(event.modified) > new Date(pastEvent.modified);
        
//         if (key.startsWith('every')) {
//           const repeatNumber = parseInt(key.slice(5, -1), 10);
//           const startDate = new Date(event.startDate);
//           startDate.setHours(0, 0, 0, 0);
//           for (let i = 0; i < 10; i++) {
//             const checkDate = new Date();
//             checkDate.setDate(checkDate.getDate() + i);
//             checkDate.setHours(new Date(event.startDate).getHours(), new Date(event.startDate).getMinutes(), 0, 0);
//             const endDate = new Date(checkDate);
//             endDate.setHours(new Date(event.endDate).getHours(), new Date(event.endDate).getMinutes(), 0, 0);
//             //midnight exepction
//             if(endDate.getHours() === 0 && endDate.getMinutes() === 0) {
//               endDate.setDate(endDate.getDate() + 1);
//             }
//             const diffDays = Math.floor((checkDate.getTime() - new Date(event.startDate).getTime()) / (1000 * 60 * 60 * 24));
//             if (diffDays % repeatNumber === 0 && (event.ends === false || checkDate < new Date(event.endAfter)) && checkDate >= startDate) {
//               const notifId = `${event.id}-${formatDateKey(checkDate)}`;
//               compareNotifIds.push(notifId);

//               // Only schedule if not present or modified is newer
//               if (!currentRepeatingNotificationsIds.includes(notifId) || isModifiedNewer) {
//                 const now = new Date();
//                 scheduleSingleNotification(notifId, event.title, event.description, checkDate, endDate, now);
//               }
//             }
//           }
//         } else if (key.startsWith('weekdays')) {
//           const weekdays = key.slice(8);
//           const startDate = new Date(event.startDate);
//           startDate.setHours(0, 0, 0, 0);
//           for (let i = 0; i < 10; i++) {
//             const checkDate = new Date();
//             checkDate.setDate(checkDate.getDate() + i);
//             checkDate.setHours(new Date(event.startDate).getHours(), new Date(event.startDate).getMinutes(), 0, 0);
//             const endDate = new Date(checkDate);
//             endDate.setHours(new Date(event.endDate).getHours(), new Date(event.endDate).getMinutes(), 0, 0);
//             //midnight exepction
//             if(endDate.getHours() === 0 && endDate.getMinutes() === 0) {
//               endDate.setDate(endDate.getDate() + 1);
//             }
//             const dayOfWeek = checkDate.getDay(); // 0 (Sunday) to 6 (Saturday)
//             if (weekdays.includes(dayOfWeek.toString()) && (event.ends === false || checkDate < new Date(event.endAfter)) && checkDate >= startDate) {
//               const notifId = `${event.id}-${formatDateKey(checkDate)}`;
//               compareNotifIds.push(notifId);

//               // Only schedule if not present or modified is newer
//               if (!currentRepeatingNotificationsIds.includes(notifId) || isModifiedNewer) {
//                 const now = new Date();
//                 scheduleSingleNotification(notifId, event.title, event.description, checkDate, endDate, now);
//               }
//             }
//           }
//         }
//       }
//     }
//   });

//   // Step 3: Schedule notifications for schedules
//   schedulesState.forEach((schedule) => {
//     if (schedule.on === true && (schedule.ends === false || (schedule.ends === true && schedule.endDate >= new Date()))) {
//       console.log('starting for schedule: ', schedule);
//       console.log('days: ', schedule.days);
//       const pastEventsForKey = repeatPastState[schedule.id] || [];
      
//       const scheduleEventsState: EventsState = schedule.days;
//       // const daysLength = Object.keys(scheduleEventsState).length;
//       const repeatDaysRule = Number.parseInt(schedule.repeatRule.regular.number, 10);
//       // console.log('Schedule ID: ', schedule.id, ' with repeat every ', repeatDaysRule, ' days and events: ', scheduleEventsState);
//       // console.log('Typeof repeatDaysRule: ', typeof repeatDaysRule);

//       // Add validation
//       if (isNaN(repeatDaysRule) || repeatDaysRule <= 0) {
//         console.warn(`Invalid repeatDaysRule: ${repeatDaysRule} for schedule ${schedule.id}`);
//         return; // Skip this schedule
//       }

//       const startDate = new Date(schedule.startDate);
//       startDate.setHours(0, 0, 0, 0);
//       Object.keys(scheduleEventsState).forEach((key) => {
//         const compareDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + parseInt(key, 10))
        
//         for (let i = 0; i < 10; i++) {
//           const checkDate = new Date();
//           checkDate.setDate(checkDate.getDate() + i);
//           checkDate.setHours(0, 0, 0, 0);
          
//           const diffDays = Math.floor((checkDate.getTime() - compareDate.getTime()) / (1000 * 60 * 60 * 24));

//           console.log(`DiffDays: ${diffDays}, RepeatDaysRule: ${repeatDaysRule}, Modulo: ${diffDays % repeatDaysRule}`);
//           if (diffDays % repeatDaysRule === 0){ // need more checks here
//             for (const event of scheduleEventsState[key]) {
//               const pastEvent = pastEventsForKey.find((e) => e.id === event.id);
//               const isModifiedNewer = !pastEvent || new Date(event.modified) > new Date(pastEvent.modified);

//               const startDate = new Date(checkDate);
//               startDate.setHours(new Date(event.startDate).getHours(), new Date(event.startDate).getMinutes(), 0, 0);
//               const endDate = new Date(checkDate);
//               endDate.setHours(new Date(event.endDate).getHours(), new Date(event.endDate).getMinutes(), 0, 0);
//               //midnight exepction
//               if(endDate.getHours() === 0 && endDate.getMinutes() === 0) {
//                 endDate.setDate(endDate.getDate() + 1);
//               }
//               const notifId = `${event.id}-${formatDateKey(checkDate)}`;
//               compareNotifIds.push(notifId);
//               // console.log('CurrentRepeatingNotificationsIds: ', currentRepeatingNotificationsIds);
//               // console.log('NotifId: ', notifId, ' isModifiedNewer: ', isModifiedNewer);
//               if ((event.notification) && (!currentRepeatingNotificationsIds.includes(notifId) || isModifiedNewer)) {

//                 const now = new Date();
//                 scheduleSingleNotification(notifId, event.title, event.description, startDate, endDate, now);
//               }
//             }
//           }        
//         }
//       })
//     }
//   });

//   // Step 4: After scheduling, update PastState$ with new data from repeatingEventsState and schedulesState
//   const newPastState: { [key: string]: { id: string; modified: Date }[] } = {};
//   Object.keys(repeatingEventsState).forEach((key) => {
//     newPastState[key] = repeatingEventsState[key].map(event => ({
//       id: event.id,
//       modified: event.modified,
//     }));
//   });
//   schedulesState.forEach((schedule) => {
//     if (schedule.on === true && (schedule.ends === false || (schedule.ends === true && schedule.endDate >= new Date()))) {
//       Object.keys(schedule.days).forEach((key) => {
//         schedule.days[key].forEach((event) => {
//           if (!newPastState[schedule.id]) {
//             newPastState[schedule.id] = [];
//           }
//           newPastState[schedule.id].push({
//             id: event.id,
//             modified: event.modified,
//           });
//         });
//       });
//     }
//   });
//   RepeatPastState$.set(newPastState);
//   console.log('New RepeatPastState: ', RepeatPastState$.get());

//   // canceling the difference in past scheduled Notifications and currently scheduled Notifications
//   const notifIdsToCancel = currentRepeatingNotificationsIds.filter((id) => !compareNotifIds.includes(id));
//   console.log('Current R Notifications IDs: ', currentRepeatingNotificationsIds);
//   console.log('Notifications to cancel: ', notifIdsToCancel);
//   for (const id of notifIdsToCancel) {
//     cancelNotification(id);
//   }

//   // canceling android notifications that have a timeoutAfter in the past
//   if (Platform.OS === 'android') {
//     const displayedNotificationsIdsToCancel = displayedNotifications.filter((notification: any) => {
//       const timeoutAfter = notification.notification.android?.timeoutAfter;
//       if (timeoutAfter) {
//         const now = new Date();
//         const timeoutDate = new Date(notification.trigger.timestamp + timeoutAfter);
//         return timeoutDate < now;
//       }
//       return false;
//     }).map((notification: any) => notification.notification.id);
    
//     const TriggerNotificationsIdsToCancel = currentNotifications.filter((notification: any) => {
//       const timeoutAfter = notification.notification.android?.timeoutAfter;
//       if (timeoutAfter) {
//         const now = new Date();
//         const timeoutDate = new Date(notification.trigger.timestamp + timeoutAfter);
//         return timeoutDate < now;
//       }
//       return false;
//     }).map((notification: any) => notification.notification.id);
//     for (const id of displayedNotificationsIdsToCancel) {
//       console.log('Cancelling displayed notification: ', id);
//       await notifee.cancelNotification(id);
//     }
//     for (const id of TriggerNotificationsIdsToCancel) {
//       console.log('Cancelling trigger notification: ', id);
//       await notifee.cancelNotification(id);
//     }
//   }
// };
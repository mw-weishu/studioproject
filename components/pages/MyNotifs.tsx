// import { observable } from '@legendapp/state';
// import { observer, Switch } from '@legendapp/state/react';
// // import notifee, { TriggerNotification } from '@notifee/react-native';
// import React from 'react';
// import { StyleSheet } from 'react-native';
// import { GestureHandlerRootView, Pressable, ScrollView } from 'react-native-gesture-handler';
// import { Text, View } from '@/theme/Themed';
// import { formatDateKey } from '@/utilities/EventsStore';
// import { formatDate } from '@/utilities/Pickers';
// // import NotificationItem from '../items/NotificationItem';
// import { initialIndex$ } from './MyPager';

// const SavedSelection$ = observable({
//     current: 'notifications', // 'events', 'blocks', 'routines', 'notifications'
// });

// // const configurePersistence = async() => {
// //     try {
// //         configureObservablePersistence({
// //         pluginLocal: ObservablePersistAsyncStorage,
// //         localOptions: {
// //           asyncStorage: {
// //             AsyncStorage,
// //           },
// //         },
// //       });
// //     } catch (error) {
// //       console.error("Error configuring persistence:", error);
// //     }
// // }; 

// // const persistSavedSelection = async() => {
// //     try {
// //         persistObservable(SavedSelection$, {
// //             local: `UserPreferences/{userID}/SavedSelection`, // implement userID and remote???
// //         });
// //     } catch (error) {
// //       console.error("Error persisting SavedSelection:", error);
// //     }
// // }

// // configurePersistence();
// // persistSavedSelection();

// // const MyEvents = observer(() => {

// //   const savedEvents = savedEvents$.events.get() || [];

// //     return (
// //       <View>
// //         <View>
// //           <BlankSavedEventItem event={{id: 'e0'}}/>
// //         </View>
// //         <View>
// //             {savedEvents.map((item : any) => (
// //               // !!! here whatever is the key defines the modification validation !!!
// //               // !!! if the key is changed, the item is considered new !!!
// //               // !!! that's why key should include last modification date !!!
// //               <View key={`${item.id} || ${item.modified}`}>
// //                 {/* <Text>id: {`${item.id} || mod: ${item.modified}`}</Text> */}
// //                 <SavedItem event={item} />
// //               </View>
// //             ))}
// //         </View>
// //       </View>
// //     )
// // });

// // const MyBlocks = observer(() => {
// //     return (
// //       <View>
// //         <Text>Blocks Yo</Text>
// //       </View>
// //     )
// // });

// // const MyRoutines = observer(() => {
   
// //   const savedRoutines = savedEvents$.routines.get() || [];

// //     return (
// //       <View>
// //         <View>
// //           {/* <BlankRoutineItem routine={{id: 'r0'}}/> */}
// //         </View>
// //         <View>
// //           {savedRoutines.map((item : any) => (
// //             <View key={`${item.id} || ${item.modified}`}>
// //               {/* <Text>id: {`${item.id} || mod: ${item.modified}`}</Text> */}
// //               <RoutineItem routine={item} />
// //             </View>
// //           ))}
// //         </View>
// //       </View>
// //     )
// // });

// const MyNotifications = observer(() =>{
  
//   const [notifications, setNotifications] = React.useState<TriggerNotification[]>([])
//   React.useEffect(() => {
//     const fetchNotifications = async () => {
//       try {
//         const trigger = await notifee.getTriggerNotifications();
//         const displayed = await notifee.getDisplayedNotifications();

//         // Merge both lists. We'll dedupe and filter below.
//         const merged = [...trigger, ...displayed];

//         // Helper to extract a stable key for deduplication. We try several fields
//         // to avoid accidental duplicates coming from different lists.
//         const dedupeKey = (n: TriggerNotification) => {
//           // Some Notifee typings don't expose every runtime field (id/timestamp) so cast to any
//           const id = n.notification?.id ?? (n as any).id ?? '';
//           const start = n.notification?.data?.startDate ?? (n as any).trigger?.timestamp ?? (n.notification as any)?.timestamp ?? '';
//           // include title/body so notifications with same id but different content can co-exist
//           const title = n.notification?.title ?? '';
//           const body = n.notification?.body ?? '';
//           return `${String(id)}|${String(start)}|${title}|${body}`;
//         };

//         // preferNotEmpty: when choosing between two potential duplicates, prefer one
//         // that has a title/body or a startDate.
//         const isMeaningful = (n: TriggerNotification) => {
//           const hasTitleOrBody = !!(n.notification?.title || n.notification?.body);
//           const hasStart = n.notification?.data?.startDate != null || (n as any).trigger?.timestamp != null || (n.notification as any)?.timestamp != null;
//           return hasTitleOrBody || hasStart;
//         };

//         const map = new Map<string, TriggerNotification>();
//         for (const n of merged) {
//           const key = dedupeKey(n);
//           const existing = map.get(key);
//           if (!existing) {
//             map.set(key, n);
//           } else {
//             // If existing is not meaningful but new one is, replace it.
//             if (!isMeaningful(existing) && isMeaningful(n)) {
//               map.set(key, n);
//             }
//             // Otherwise keep existing (first-seen). This avoids creating duplicates.
//           }
//         }

//         // Now filter out completely-empty notifications that have neither title/body nor startDate.
//         const filtered = Array.from(map.values()).filter((n) => {
//           const hasTitleOrBody = !!(n.notification?.title || n.notification?.body);
//           const hasStart = n.notification?.data?.startDate != null || (n as any).trigger?.timestamp != null || (n.notification as any)?.timestamp != null;
//           return hasTitleOrBody || hasStart;
//         });

//         // Robust timestamp extractor for sorting: prefer explicit startDate, then trigger timestamp,
//         // then notification.timestamp, else fallback to 0.
//         const getTime = (n: TriggerNotification) => {
//           const start = n.notification?.data?.startDate;
//           if (start != null) return new Date(String(start)).getTime();
//           const trig = (n as any).trigger?.timestamp; // Trigger may be typed loosely
//           if (trig != null) return Number(trig);
//           const notifTs = (n.notification as any)?.timestamp;
//           if (notifTs != null) return Number(notifTs);
//           return 0;
//         };

//         filtered.sort((a, b) => getTime(a) - getTime(b));

//         setNotifications(filtered);
//       } catch (err) {
//         console.error('Error fetching notifications:', err);
//         setNotifications([]);
//       }
//     };
//     fetchNotifications();
//   }, []);

//   // Group notifications by day
//   const grouped: {[key: string]: TriggerNotification[]} = {};
//   notifications.forEach((notif) => {
//     const startDate = notif.notification?.data?.startDate;
//     // ensure we pass a string/number/Date to the Date constructor
//     const date = startDate != null ? new Date(String(startDate)) : new Date();
//     const dayKey = formatDateKey(date);
//     if (!grouped[dayKey]) grouped[dayKey] = [];
//     grouped[dayKey].push(notif);
//   });

//   const getTitleForDay = (dateKey: String) => {
//     // Today, Tomorrow, or in x days
//     const year = parseInt(dateKey.slice(0, 4), 10);
//     const month = parseInt(dateKey.slice(4, 6), 10) - 1; // Months are 0-based in JavaScript Date
//     const day = parseInt(dateKey.slice(6, 8), 10);
//     const date = new Date(year, month, day, 0, 0, 0, 0);

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     if (date.toDateString() === today.toDateString()) {
//       return 'Today';
//     } else if (date.toDateString() === new Date(today.getTime() + 86400000).toDateString()) {
//       return 'Tomorrow';
//     } else {
//       const diffDays = Math.ceil((date.getTime() - today.getTime()) / 86400000);
//       return `in ${diffDays} days`;
//     }
//   };

//   const getIndexForDay = (dateKey: String) => {
//     const year = parseInt(dateKey.slice(0, 4), 10);
//     const month = parseInt(dateKey.slice(4, 6), 10) - 1; // Months are 0-based in JavaScript Date
//     const day = parseInt(dateKey.slice(6, 8), 10);
//     const date = new Date(year, month, day, 0, 0, 0, 0);

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     date.setHours(0, 0, 0, 0);
//     const diffDays = Math.ceil((date.getTime() - today.getTime()) / 86400000);
//     return diffDays;
//   };

//   const getDateString = (dateKey: String) => {
//     const year = parseInt(dateKey.slice(0, 4), 10);
//     const month = parseInt(dateKey.slice(4, 6), 10) - 1; // Months are 0-based in JavaScript Date
//     const day = parseInt(dateKey.slice(6, 8), 10);
//     const date = new Date(year, month, day, 0, 0, 0, 0);

//     const dateString = formatDate(date);
//     return dateString;
//   };

//   return (
//     <View>
      
//       <ScrollView style={{height: '100%'}}>
//         <Text style={{textAlign: 'center', fontWeight: 500, fontSize: 20}}>Notifications</Text>
//         {Object.entries(grouped).map(([day, items]) => (
//           <Pressable onPress={() => {
            
//             stateNavigator.navigate('pager');
//             initialIndex$.set(getIndexForDay(day));
//           }}
//            key={day} style={{marginHorizontal: 16, marginVertical: 5, padding: 8, paddingBottom: 20, borderRadius: 16, backgroundColor: 'rgba(69, 69, 120, 0.7)'}}>
//             <View style={{padding: 8, marginHorizontal: 10,  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
//             <Text style={{textAlign: 'center', fontWeight: 'bold', fontSize: 16, marginVertical: 4}}>
//               {getTitleForDay(day)}
//             </Text>
//             <Text style={{textAlign: 'center', fontWeight: 'bold', fontSize: 16, marginVertical: 4}}>
//               {getDateString(day)}
//             </Text>
//             {/* <Pressable style={{backgroundColor: '#555555', borderRadius: 10, padding: 4}}>
//               <Icon source='chevron-up' size={20} color='white' />
//             </Pressable> */}
//             </View>
//             <ScrollView style={{maxHeight: 200}}>
//               {items.map((item, index) => (
//               <NotificationItem
//                 key={item.notification?.id ?? `${day}-${index}`}
//                 notification={item.notification}
//               />
//             ))}
//             </ScrollView>
//           </Pressable>
//         ))}
//       </ScrollView>
//     </View>
//   );
// })


// const MyNotifs = observer(() => {  

//   return (
//     <GestureHandlerRootView>
//     <View style={styles.safearea}>
      
//       {/* <Text style={styles.header}>Saved</Text> */}
//       {/* <SegmentedButtons
//           value={SavedSelection$.current.get()}
//           style={{ margin: 8 }}
//           onValueChange={SavedSelection$.current.set}
//           buttons={[
//               {
//                   value: 'events',
//                   label: 'Events',
//               },
//               // {
//               //     value: 'blocks',
//               //     label: 'Blocks',
//               // },
//               {
//                   value: 'routines',
//                   label: 'Routines',
//               },
//               {
//                   value: 'notifications',
//                   label: 'Notifications',
//               },
//           ]}
//       /> */}
//       {/* <Button onPress={() => openDate$.open.set(true)}>Open Date Picker</Button>
//       <Button onPress={() => openTime$.open.set(true)}>Open Time Picker</Button> */}
//                   {/* <Text>Renders: {renderCount}</Text> */}
//       <ScrollView
//         keyboardShouldPersistTaps='handled' // without this can't press buttons when text input is focused
//         scrollEventThrottle={16}
//         style={{ height: '100%' }}
//       >
//       <Switch value={SavedSelection$.current.get()} >
//           {{
//               // events: () => <MyEvents/>,
//               // blocks: () => <MyBlocks/>,
//               // routines: () => <MyRoutines/>,
//               notifications: () => <MyNotifications/>
//           }}
//       </Switch>
//       <View style={{ height: 60}}/>
//       </ScrollView>
//       {/* <View style={{ justifyContent: 'center', alignItems: 'center'}}>
//         <DatePickerModal
//           locale='en'
//           mode="single"
//           visible={openDateSaved$.open.get()}
//           date={date}
//           onDismiss={() => openDateSaved$.open.set(false)}
//           onConfirm={(date: any) => onDateConfirm(date)}
//         />
//         <TimePickerModal
//           locale='en'
//           visible={openTimeSaved$.open.get()}
//           onDismiss={() => openTimeSaved$.open.set(false)}
//           onConfirm={onTimeConfirm}
//           hours={new Date(openTimeSaved$.time.get()).getHours()}
//           minutes={new Date(openTimeSaved$.time.get()).getMinutes()}
//           animationType='fade'
//           use24HourClock={true}
//           defaultInputType='keyboard'
//         />
//       </View> */}
//     </View>
//     </GestureHandlerRootView>
//   )
// });
  
// export default MyNotifs

// const styles = StyleSheet.create({
//     safearea: {
//         width: '100%',
//         height: '100%',
//         paddingBottom: 5,
//     },
//     header: {
//         fontSize: 20,
//         fontWeight: 'bold',
//         marginVertical: 5,
//         marginHorizontal: 16,
//     }
// })
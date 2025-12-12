// import React, {useCallback} from 'react';
// import {StyleSheet} from 'react-native';
// import {Text as DefaultText, View as DefaultView} from 'react-native';
// import {Text, View, Pressable} from '../../theme/Themed';
// import { observer } from '@legendapp/state/react';
// import { Button, TextInput } from 'react-native-paper';
// import { openDate$, openTime$ } from '../../utilities/Pickers';
// import { selectedRoutineData$, selectedRoutineEventData$ } from '../../utilities/Routines';
// import { ScrollView } from 'react-native-gesture-handler';


// interface ItemProps {
//   event: any; 
//   day: string;
// }

// const NotSelected = observer((eventProps: ItemProps) => {
//   const {event} = eventProps;

//   const formatTime = (selectedTime: Date) => {
//     if (!(selectedTime instanceof Date)) {
//       selectedTime = new Date(selectedTime);
//     }
//     const formattedTime = selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//     return formattedTime;
//   };

//   return (
//     <View>
//       <Text style={styles.itemTitleText}>{event.title}</Text>
        
//       <View style={styles.rowItems}>
//         <View style={styles.itemPercentageOutlineNonActive}>
//           <DefaultView style={[styles.itemAbsoluteInner, { width: '100%', position: 'absolute' }]}>
//             <Text>{formatTime(event.startDate)}</Text>
//             <Text>{formatTime(event.endDate)}</Text>
//           </DefaultView>
//         </View>
//       </View>
//     </View>
//   );
// });

// const Selected = observer((eventProps: ItemProps) => {
//   const {event} = eventProps;
//   const {day} = eventProps;

//   const unselect = () => {
//     selectedRoutineEventData$.title.set("");
//     selectedRoutineEventData$.description.set("");
//     selectedRoutineEventData$.startDate.set(new Date(0));
//     selectedRoutineEventData$.endDate.set(new Date(0));
//     selectedRoutineEventData$.eventType.set("");
//     selectedRoutineEventData$.id.set(null);
//   };

//   const openstartDate = () => {
//     openTime$.case.set('routineevent-start');
//     openTime$.time.set(selectedRoutineEventData$.startDate.get());
//     openTime$.open.set(true);
    
//   }

//   const openendDate = () => {
//     openTime$.case.set('routineevent-end');
//     openTime$.time.set(selectedRoutineEventData$.endDate.get());
//     openTime$.open.set(true);
//   }

//   const handleModifyEvent = (day: string) => {
//     const newEvent = {
//       id: selectedRoutineEventData$.id.get(),
//       title: selectedRoutineEventData$.title.get(),
//       description: selectedRoutineEventData$.description.get(),
//       startDate: selectedRoutineEventData$.startDate.get(),
//       endDate: selectedRoutineEventData$.endDate.get(),
//       eventType: 'default',
//       modified: new Date(),
//     };

//     const days = selectedRoutineData$.days.get();
//     // filter out the event that is being modified
//     const dayEvents = days[day].filter((event: any) => event.id !== newEvent.id);

//     if (Array.isArray(dayEvents)) {
//       days[day] = [...dayEvents, newEvent];
//     } else {
//       days[day] = [newEvent];
//     }
//     selectedRoutineData$.days.set(undefined);
//     selectedRoutineData$.days.set(days);

//     console.log('Days: ', selectedRoutineData$.days.get());
    

//     unselect();
//   }

//   const formatTime = (selectedTime: Date) => {
//     if (!(selectedTime instanceof Date)) {
//       selectedTime = new Date(selectedTime);
//     }
//     const formattedTime = selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//     return formattedTime;
//   };
  
//   return (
//     <ScrollView
//         keyboardShouldPersistTaps='handled' // to allow keyboard to be dismissed by tapping outside of it
//         >
//       <TextInput
//         label="Title"
//         style={{ height: 40, fontWeight: 'bold', fontSize: 16 }}
//         value={selectedRoutineEventData$.title.get()}
//         onChangeText={text => selectedRoutineEventData$.title.set(text)}
//         mode='outlined'
//         outlineStyle={{borderRadius: 10}}
//       />
        
//       <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
//           <Button onPress={openstartDate}>
//               {formatTime(selectedRoutineEventData$.startDate.get())}
//           </Button>
//           <Button onPress={openendDate}>
//               {formatTime(selectedRoutineEventData$.endDate.get())}
//           </Button>
//       </View>
//       <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
//         <Button onPress={unselect}>
//             Discard
//         </Button>
//         <Button onPress={() => handleModifyEvent(day)} disabled={selectedRoutineEventData$.title.get() === ''}>
//             Save
//         </Button>
//       </View>
//     </ScrollView>
//   );
// });

// const SavedItem = observer((eventProps: ItemProps) => {
//   const {event} = eventProps;
//   const {day} = eventProps;

//   const itemPressed = useCallback(() => {
//     if (event.id === selectedRoutineEventData$.id.get()) {
//     return
//     }
//     selectedRoutineEventData$.title.set(event.title);
//     selectedRoutineEventData$.id.set(event.id);
//     selectedRoutineEventData$.description.set(event.description);
//     selectedRoutineEventData$.startDate.set(event.startDate);
//     selectedRoutineEventData$.endDate.set(event.endDate);

//     selectedRoutineEventData$.eventType.set("default");
//   }, []); 

//   const isDefault = event.eventType === 'default' ? true : false;

//   return (
//     <Pressable onPress={itemPressed} style={isDefault ? styles.item : styles.blankItem} /*testID={testIDs.agenda.ITEM}*/>
//       <View>
//         {event.id === selectedRoutineEventData$.id.get() ? <Selected event={event} day={day}/> : <NotSelected event={event} day={day}/>}
//       </View>
//     </Pressable>
//   );
// });

// export default React.memo(SavedItem);


// const styles = StyleSheet.create({
//   item: {
//     margin: 10,
//     marginBottom: 0,
//     padding: 20,
//     borderWidth: 1,
//     borderColor: 'gold',
//     borderRadius: 25,
//   },
//   blankItem: {
//     margin: 10,
//     marginBottom: 0,
//     padding: 20,
//     borderWidth: 1,
//     borderRadius: 25,
//     borderColor: 'grey',
//   },
//   rowItems: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center'
//   },
//   itemPercentageOutline:{
//     width: '100%',
//     marginTop: 5,
//     backgroundColor: 'lightgray',
//     height: 20, 
//     borderRadius: 100,
//     justifyContent: 'flex-start',
//     alignItems: 'center',
//     flexDirection: 'row',
//     overflow: 'hidden',
//   },
//   itemPercentageOutlineNonActive:{
//     width: '100%',
//     marginTop: 5,
//     height: 20, 
//     borderRadius: 100,
//     justifyContent: 'flex-start',
//     alignItems: 'center',
//     flexDirection: 'row',
//   },
//   itemPercentageInner:{
//     flexDirection: 'row',
//     backgroundColor: 'lightblue',
//     height: 20, 
//     borderRadius: 50,
//   },
//   itemAbsoluteInner:{
//     paddingRight: 4,
//     paddingLeft: 4,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     height: 20, 
//     borderRadius: 50,
//   },
//   itemTitleText: {
//     marginLeft: 0,
//     fontWeight: 'bold',
//     fontSize: 16
//   },
//   blankItemTitleText: {
//     color: 'lightgrey',
//     marginLeft: 0,
//     fontWeight: 'bold',
//     fontSize: 16
//   },
//   itemButtonContainer: {
//     flex: 1,
//     alignItems: 'flex-end'
//   },
// });
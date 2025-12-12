// import React, {useCallback} from 'react';
// import {StyleSheet} from 'react-native';
// import {Text, View, Pressable} from '../../theme/Themed';
// import { ScrollView } from 'react-native-gesture-handler';
// import { observer } from '@legendapp/state/react';
// import RoutineEventItem from './RoutineEventItem';
// import { Button } from 'react-native-paper';
// import { openDate$ } from '../../utilities/Pickers';
// import { TextInput } from 'react-native-paper';
// import { handleDelete, handleDuplicate, handleModify, handleSave, selectedRoutineData$ } from '../../utilities/Routines';
// // import BlankRoutineEventItem from './empty/BlankRoutineEventItem';

// interface ItemProps {
//   routine: any; 
// }

// const NotSelected = observer((routineProps: ItemProps) => {
//   const {routine} = routineProps;

//   const getDayEventsNotSelected =(day: any) => {
//     const days = routine.days;
//     const dayEvents = days[day];
//     return Array.isArray(dayEvents) ? dayEvents : [];
//   }

//   return (
//     <View>
//       <Text style={styles.itemTitleText}>{routine.title}</Text>
//       <View>
//         {Object.keys(routine.days || {}).map(day => (
//           <View key={day} style={styles.dayItem}>
//             <Text style={styles.dayTitle}>Day {day}</Text>
//             {(getDayEventsNotSelected(day) || {}).map((event: any) => (
//               <View key={event.id}>
//                 <RoutineEventItem event={event} day={day}/>
//               </View>
//             ))}
//           </View>
//         ))}
//       </View>
//     </View>
//   );
// });

// const Selected = observer((routineProps: ItemProps) => {
//   const {routine} = routineProps;

//   const getDayEventsSelected =(day: any) => {
//     const days = selectedRoutineData$.days.get();
//     const dayEvents = days[day];
//     return Array.isArray(dayEvents) ? dayEvents : [];
//   }

//   const unselect = () => {
//       selectedRoutineData$.title.set("");
//       selectedRoutineData$.description.set("");
//       selectedRoutineData$.days.set({});
//       selectedRoutineData$.id.set(null);
//   };

//   const selectDate = () => {
//       openDate$.case.set('routine');
//       console.log('case: ', openDate$.case.get());
//       openDate$.open.set(true);
//   }

//   const handleSaveRoutine = () => {
//       handleModify();
//       unselect();
//   }

//   const handleDuplicateRoutine = () => {
//       handleDuplicate();
//       unselect();
//   }

//   const handleDeleteRoutine = () => {
//       handleDelete();
//       unselect();
//   }

//   const addDay = (day: any) => {
      
//       const newDay = {
//           [day + 1]: []
//       };
//       selectedRoutineData$.days.set({...selectedRoutineData$.days.get(), ...newDay});
//   }

//   return (
//     <ScrollView
//         keyboardShouldPersistTaps='handled' // to allow keyboard to be dismissed by tapping outside of it
//         >
//         <TextInput
//             label='Routine Name'
//             style={{ height: 40, fontWeight: 'bold', fontSize: 16, }}
//             onChangeText={text => selectedRoutineData$.title.set(text)}
//             value={selectedRoutineData$.title.get()}
//             mode='outlined'
//             outlineStyle={{borderRadius: 10}}
//         />
//         <ScrollView
//         keyboardShouldPersistTaps='handled' // without this can't press buttons when text input is focused
//         scrollEventThrottle={16}
//         // style={{ height: 300, borderWidth: 1, borderColor: '#777', borderRadius: 10, padding: 10, marginVertical: 10}}
//         style={{height: 300, marginVertical: 20}}
//         >
//           {Object.keys(selectedRoutineData$.days.get() || {}).map(day => (
//           <View key={day} style={styles.dayItem}>
//               <Text style={styles.dayTitle}>Day {day}</Text>
//               {/* <BlankRoutineEventItem event={{id: `${routine.id}-${day}-0`}} day={day}/> */}
//               {(getDayEventsSelected(day) || {}).map((event: any) => (
//               <View key={`${event.id} || ${event.modified}`}>
//                   {/* <Text>id: {event.id} || mod: {event.modified}</Text> */}
//                   <RoutineEventItem event={event} day={day}/>         
//               </View>
//               ))}
              
//           </View>
//           ))}
//           <Button onPress={() => addDay(Object.keys(selectedRoutineData$.days.get() || {}).length)}>Add Day</Button>
//         </ScrollView>
//         <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
//             <Button onPress={unselect}>
//                 Discard
//             </Button>
//             <Button onPress={handleSaveRoutine} disabled={selectedRoutineData$.title.get() === ''}>
//                 Save
//             </Button>
//             <Button onPress={selectDate}>
//                 Apply
//             </Button>
//             <Button onPress={handleDuplicateRoutine} disabled={true}>
//                 Duplicate
//             </Button>
//             <Button onPress={handleDeleteRoutine}>
//                 Delete
//             </Button>
//         </View>
//     </ScrollView>
//   );
// });

// const RoutineItem = observer((routineProps: ItemProps) => {
//   const {routine} = routineProps;
//   const isSelected = routine.id === selectedRoutineData$.id.get();

//   const itemPressed = useCallback(() => {
//     if (routine.id === selectedRoutineData$.id.get()) {
//       return;
//     }
//     selectedRoutineData$.id.set(routine.id);
//     selectedRoutineData$.title.set(routine.title);
//     selectedRoutineData$.description.set(routine.description);
//     selectedRoutineData$.days.set(routine.days);
    
//         selectedRoutineData$.routineType.set('default');
    
//   }, []);

//   return (
//     <Pressable onPress={itemPressed} style={isSelected ? styles.selectedItem : styles.item}>
//       <View>
//         {isSelected ? <Selected routine={routine}/> : <NotSelected routine={routine}/>}
//       </View>
//     </Pressable>
//   );
// });

// export default React.memo(RoutineItem);

// const styles = StyleSheet.create({
//   item: {
//     margin: 10,
//     marginBottom: 0,
//     padding: 20,
//     borderWidth: 1,
//     borderColor: 'gold',
//     borderRadius: 25,
//     flexDirection: 'row',
//   },
//   selectedItem: {
//     margin: 10,
//     marginBottom: 0,
//     padding: 20,
//     borderWidth: 1,
//     borderColor: '#aaaaaa',
//     borderRadius: 25,
//     },
//   blankItem: {
//     margin: 10,
//     marginBottom: 0,
//     padding: 20,
//     borderWidth: 1,
//     borderRadius: 25,
//     borderColor: 'grey',
//   },
//   dayItem: {
//     marginVertical: 10,
//   },
//   dayTitle: {
//     fontWeight: 'bold',
//     fontSize: 16,
//     marginBottom: 5,
//   },
//   dayTitleNoMargin: { 
//       fontWeight: 'bold',
//       fontSize: 16,
//     },
//   itemTitleText: {
//     marginLeft: 0,
//     fontWeight: 'bold',
//     fontSize: 16
//   },
//   blankItemTitleText: {
//     color: 'lightgrey',
//     marginLeft: 0,
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
// });
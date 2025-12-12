// import { observer } from '@legendapp/state/react';
// import React, { useCallback } from 'react';
// import { StyleSheet } from 'react-native';
// import { ScrollView } from 'react-native-gesture-handler';
// import { Button, TextInput, TouchableRipple } from 'react-native-paper';
// import { Text, View } from '../../../theme/Themed';
// import { handleSave, selectedRoutineData$ } from '../../../utilities/Routines';
// import { setDefaultScheduleData } from '../../../utilities/Schedules';
// import BlankRoutineEventItem from '../empty/BlankRoutineEventItem';
// import RoutineEventItem from '../RoutineEventItem';

// interface ItemProps {
//   routine: any; 
// }

// const getDayEvents =(day: any) => {
//     const days = selectedRoutineData$.days.get();
//     const dayEvents = days[day];
//     return Array.isArray(dayEvents) ? dayEvents : [];
// }

// const NotSelected = observer(() => {

//   return (
//     <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
//         <Text style={styles.dayTitleNoMargin}>+</Text>
//     </View>
//   );
// });

// const Selected = observer(() => {

//     const unselect = () => {
//         selectedRoutineData$.title.set("");
//         selectedRoutineData$.description.set("");
//         selectedRoutineData$.days.set({});
//         selectedRoutineData$.id.set(null);
//     };

//     const handleSaveRoutine = () => {
//         handleSave();
//         unselect();
//     }

//     const addDay = (day: any) => {
        
//         const newDay = {
//             [day + 1]: []
//         };
//         selectedRoutineData$.days.set({...selectedRoutineData$.days.get(), ...newDay});
//     }

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
//         style={{height: 300, marginVertical: 20}}
//         >
//             {Object.keys(selectedRoutineData$.days.get() || {}).map(day => (
//             <View key={day} style={styles.dayItem}>
//                 <Text style={styles.dayTitle}>Day {day}</Text>
//                 <BlankRoutineEventItem event={{id: `r0d${day}-0`}} day={day}/>
//                 {(getDayEvents(day) || {}).map((event: any) => (
//                 <View key={`${event.id} || ${event.modified}`}>
//                     {/* <Text>id: {event.id} || mod: {event.modified}</Text> */}
//                     <RoutineEventItem event={event} day={day}/>         
//                 </View>
//                 ))}
                
//             </View>
//             ))}
//             <Button onPress={() => addDay(Object.keys(selectedRoutineData$.days.get() || {}).length)}>Add Day</Button>
//         </ScrollView>
//         <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
//             <Button onPress={unselect}>
//                 Discard
//             </Button>
//             <Button onPress={handleSaveRoutine} disabled={selectedRoutineData$.title.get() === ''}>
//                 Save
//             </Button>
//         </View>
//     </ScrollView>
//   );
// });

// const RoutineItem = observer((props: ItemProps) => {
//     const {routine} = props;
//   const isSelected = routine.id === selectedRoutineData$.id.get();

//   const itemPressed = useCallback(() => {
//     if (routine.id === selectedRoutineData$.id.get()) {
//       return;
//     }
//     selectedRoutineData$.id.set(routine.id);
//     selectedRoutineData$.title.set("");
//     selectedRoutineData$.description.set("");
//     selectedRoutineData$.days.set({});
//   }, []);

//   return (
//     <TouchableRipple 
//     onPress={() => {
//       setDefaultScheduleData()
//       stateNavigator.navigate('edit-schedule')
//     }} 
//     style={isSelected ? styles.selectedItem : styles.blankItem}
//     >
//       <View>
//         {isSelected ? <Selected/> : <NotSelected/>}
//       </View>
//     </TouchableRipple>
//   );
// });

// export default React.memo(RoutineItem);

// const styles = StyleSheet.create({
//   item: {
//     margin: 10,
//     marginBottom: 0,
//     padding: 20,
//     borderRadius: 25,
//     flexDirection: 'row',
//     backgroundColor: '#333333'
//   },
//   selectedItem: {
//     margin: 10,
//     marginBottom: 0,
//     padding: 20,
//     borderRadius: 25,
//     backgroundColor: '#333333'
//     },
//   blankItem: {
//     margin: 10,
//     marginBottom: 0,
//     padding: 20,
//     borderRadius: 25,
//     backgroundColor: 'rgb(69,69,120)'
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
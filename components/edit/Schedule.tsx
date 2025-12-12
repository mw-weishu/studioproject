import { Keyboard, StyleSheet, View } from 'react-native'
import React from 'react'
import { GestureHandlerRootView, Pressable, ScrollView, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { handleDelete, handleModify, handleSave, selectedScheduleData$, setDefaultScheduleData } from '../../utilities/Schedules';
import Pager, { InfinitePagerImperativeApi } from 'react-native-infinite-pager'
import { Button, Icon, Menu, TouchableRipple } from 'react-native-paper';
import { Text, TextInput } from '../../theme/Themed';
import { observer, Switch } from '@legendapp/state/react';
import BlankScheduleEventItem from '../items/empty/BlankScheduleEventItem';
import ScheduleEventItem from '../items/ScheduleEventItem';
import { routeState$, stateNavigator } from '../../nav/stateNavigator';
import { Switch as Toggle } from 'react-native-paper';
import { configureObservablePersistence, persistObservable } from '@legendapp/state/persist';
import { ObservablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { observable } from '@legendapp/state';
import ToggleSwitch from '../sub/ToggleSwitch';
import { parse } from 'date-fns';
import { formatDate, openDate$ } from '../../utilities/Pickers';

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

export const initialScheduleIndex$ = observable(0);
export const onPageChangeInitialScheduleIndexState$ = observable(0);

const persistInitialIndex = async() => {
  try {
      persistObservable(initialScheduleIndex$, {
          local: `initialScheduleIndex`,
      });
      persistObservable(onPageChangeInitialScheduleIndexState$, {
          local: `onPageChangeInitialScheduleIndexState`,
      });
  } catch (error) {
    console.error("Error persisting initialIndex:", error);
  }
}

configurePersistence();
persistInitialIndex();

const scheduleOnToggle = () => {
  const currentValue = selectedScheduleData$.on.get();
  selectedScheduleData$.on.set(!currentValue);
}

const getDayEvents = (day: any) => {
    const days = selectedScheduleData$.days.get();
    const dayEvents = days[day] || [];

    dayEvents.sort((a: any, b: any) => {
      const astartDate = new Date(a.startDate).getTime();
      const bstartDate = new Date(b.startDate).getTime();
      return astartDate - bstartDate;
    });

    return Array.isArray(dayEvents) ? dayEvents : [];
}

const addDay = (day: any) => {
        
    const newDay = {
        [day + 1]: []
    };
    selectedScheduleData$.days.set({...selectedScheduleData$.days.get(), ...newDay});
    console.log('Days: ', selectedScheduleData$.days.get());
  }

const onPageChange = (index: number) => {
  onPageChangeInitialScheduleIndexState$.set(index);
  selectedScheduleData$.dayIndex.set(index);
}

const ScheduleDayItem = observer(({ index }: { index: number }) => {

  return (
    <View>
      <Text style={{fontSize: 20, fontWeight: 'bold', color: 'white', textAlign: 'center'}}>Day {index + 1}/{Object.keys(selectedScheduleData$.days.get()).length}</Text>
      <BlankScheduleEventItem event={{id: `r0d${index}-0`}} day={index.toString()} />
      
        
      <ScrollView style={{height: '100%', backgroundColor: 'rgba(0, 0, 0, 0)', borderRadius: 25}}>
        {getDayEvents(index).map((event: any) => (
          <View key={event.id}>
            <ScheduleEventItem event={event} day={index.toString()} />
          </View>
        ))}
      </ScrollView>
    </View>
  )
});

const SchedulePage = ({ index }: { index: number }) => {

  return (
    <View style={{ height: '100%', backgroundColor: 'rgba(69, 69, 112, 0.6)', padding: 20, marginHorizontal: 15, borderRadius: 25,}}>
      <ScheduleDayItem index={index} />
    </View>

  );
}

const Regular = observer(({length}: {length: number}) => {

  const [visible, setVisible] = React.useState(false)

  const number = selectedScheduleData$.repeatRule.regular.number.get();

  const openMenu = () => {
    setVisible(true);
  }

  const closeMenu = () => {
    setVisible(false);
  }

  // console.log('Length: ', length);
  // console.log('Number: ', number);

  return (
    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
      <Text style={{textAlign: 'center', fontWeight: 'bold'}}>
        Repeat every
      </Text>
      <TextInput
        inputMode='numeric'
        keyboardType='numeric'
        style={{
          width: 40,
          height: 36,
          marginHorizontal: 10,
          textAlign: 'center',
          textAlignVertical: 'center',
          paddingVertical: 0,
          borderWidth: 1,
          borderRadius: 5,
          borderColor: 'grey',
        }}
        maxLength={4}
        value={selectedScheduleData$.repeatRule.regular.number.get()}
        // only numbers
        onChangeText={(text) => {
          const updatedtext = text.replace(/[^0-9]/g, '');
          if (updatedtext === '0') {
            selectedScheduleData$.repeatRule.regular.number.set(length.toString());
            return;
          }
          selectedScheduleData$.repeatRule.regular.number.set(updatedtext);
        }}
      />
      <Menu
      visible={visible}
      onDismiss={closeMenu}
      anchor={
        <Pressable
        // onPress={openMenu}
        style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}
        >
          <Text style={{fontWeight: 'bold'}}>
            {/* {selectedScheduleData$.repeatRule.regular.unit.get()} */}
            {selectedScheduleData$.repeatRule.regular.number.get() === '1' ? 'day' : 'days'}
          </Text>
          {/* <View style={{borderRadius: '100%', borderWidth: 1, borderColor: 'grey', marginLeft: 8}} >
          <Icon source='chevron-down' size={24}/>
          </View> */}
        </Pressable>
      }>
          <Menu.Item onPress={() => {selectedScheduleData$.repeatRule.regular.unit.set('days'); closeMenu()}} title="days" />
          {/* <Menu.Item onPress={() => {selectedScheduleData$.repeatRule.regular.unit.set('weeks'); closeMenu()}} title="weeks" /> */}
          {/* <Divider /> */}
          {/* <Menu.Item onPress={() => {selectedScheduleData$.repeatRule.regular.unit.set('months'); closeMenu()}} title="months" />
          <Menu.Item onPress={() => {selectedScheduleData$.repeatRule.regular.unit.set('years'); closeMenu()}} title="years" /> */}
      </Menu>
    </View>
  )
});

const Schedule = observer(() => {

  const dayslength = Object.keys(selectedScheduleData$.days.get()).length;
  const pagerRef = React.useRef<InfinitePagerImperativeApi>(null);

  const handleIncrement = () => {
    if (pagerRef.current) {
      pagerRef.current.incrementPage({ animated: true });
    }
  };

  const handleDecrement = () => {
    if (pagerRef.current) {
      pagerRef.current.decrementPage({ animated: true });
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1}}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 15,}}>
            <View style={{flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', gap: 10, marginBottom: 10}}>
            <TouchableRipple onPress={() => stateNavigator.navigateBack(1)} style={{backgroundColor: 'rgba(255, 255, 255, 0.3)', height: 30, width: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center'}}>
              <Icon source="chevron-left" size={30}/>
            </TouchableRipple>
            <View style={{flex: 1, height: 50}}>
            <TextInput
              placeholder="Schedule Name"
              focusable={true}
              placeholderTextColor={'gray'}
              value={selectedScheduleData$.title.get()}
              onChangeText={(text) => selectedScheduleData$.title.set(text)}
              style={{height: 50, fontWeight: 'bold', fontSize: 20, backgroundColor: 'rgba(100, 100, 100, 0.4)', borderRadius: 16, flex: 1, paddingHorizontal: 10}}
            />
            </View>
            {selectedScheduleData$.repeats.get() &&
            <ToggleSwitch
              isOn={selectedScheduleData$.on.get()}
              onToggle={() => selectedScheduleData$.on.toggle()}
              width={54}
              height={40}
              onBackgroundColor="goldenrod"
              offBackgroundColor="rgb(69, 69, 112)"
              circleColor="rgba(255, 255, 255, 0.8)"
              activeTextColor="#aaaaaa"
              inactiveTextColor="rgba(255, 255, 255, 0.5)"
              onText="ON"
              offText="OFF"
              />
            }
            </View>
            </View>
            <View style={[{ position: 'relative'}, selectedScheduleData$.repeats.get() ? {marginBottom: 400} : {marginBottom: 200}]}>
              <Pager
                ref={pagerRef}
                key={routeState$.get()}
                initialIndex={initialScheduleIndex$.get()}
                minIndex={0}
                maxIndex={dayslength - 1}
                renderPage={SchedulePage}
                onPageChange={(index) => onPageChange(index)}
              />
              {selectedScheduleData$.scheduleType.get() !== 'saved' &&
              <View style={{flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10}}>
                <Text style={{fontSize: 20, fontWeight: 'bold', color: 'white', textAlign: 'center', alignSelf: 'center'}}>Starts on</Text>
                <Button 
                  style={styles.button} 
                  onPress={() => {
                    openDate$.case.set('schedule-start');
                    openDate$.date.set(selectedScheduleData$.startDate.get()); 
                    // openDate$.open.set(true);
                    stateNavigator.navigate('calendar');
                  }}
                > 
                  <Text style={{fontSize: 20, fontWeight: 'bold', textAlign: 'center'}}>{formatDate(selectedScheduleData$.startDate.get())}</Text>
                </Button>
              </View>
              }
              {onPageChangeInitialScheduleIndexState$.get() === dayslength - 1 ?
              <Pressable style={styles.dec} onPress={() => {
                addDay(dayslength - 1); 
                if (parseInt(selectedScheduleData$.repeatRule.regular.number.get(), 10) < (dayslength + 1)) {
                  selectedScheduleData$.repeatRule.regular.number.set((dayslength + 1).toString());
                }
              }}>
                <Icon source="plus" size={24} />
              </Pressable>
              :
              <Pressable style={styles.dec} onPress={() => {handleIncrement()}}>
                <Icon source="chevron-right" size={24} />
              </Pressable>
              }
              {onPageChangeInitialScheduleIndexState$.get() > 0 &&
              <Pressable style={styles.inc} onPress={() => {handleDecrement()}}>
                <Icon source="chevron-left" size={24} />
              </Pressable>
              }
            </View>

            
            <View style={{ width: '100%', position: 'absolute', bottom: 30}}>
            
            <View style={{ margin: 16}}>
            <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 4}}>
              {/* <Text>Repeats</Text>
              <ToggleSwitch
                isOn={selectedScheduleData$.repeats.get()}
                onToggle={() => selectedScheduleData$.repeats.toggle()}
                width={36}
                height={28}
                onBackgroundColor="goldenrod"
                offBackgroundColor="rgb(69, 69, 112)"
                circleColor="rgba(255, 255, 255, 0.8)"
                activeTextColor="#aaaaaa"
                inactiveTextColor="rgba(255, 255, 255, 0.5)"
                onText=" "
                offText=" "
                /> */}
              </View>
            </View>
            {selectedScheduleData$.repeats.get() ? (
            <View style={{justifyContent: 'space-around', backgroundColor: 'rgba(69, 69, 120, 0.4)', borderRadius: 25, paddingVertical: 20, paddingHorizontal: 30}}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <View>
                <Text style={{fontSize: 20, fontWeight: 'bold', textAlign: 'center'}}>
                  Regular
                </Text>
              </View>
              {/* <View style={{flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start'}}>
              <IconButton icon='calendar-refresh' size={20} onPress={() => selectedEventData$.repeatRule.rule.set('regular')} style={{height: 20, width: 20}} iconColor={selectedEventData$.repeatRule.rule.get() === 'regular' ? 'goldenrod' : 'gray'}/>
              <IconButton icon='view-week' size={20} onPress={() => selectedEventData$.repeatRule.rule.set('weekdays')} style={{height: 20, width: 20}} iconColor={selectedEventData$.repeatRule.rule.get() === 'weekdays' ? 'goldenrod' : 'gray'}/>
              </View> */}
            </View>
            <Regular length={dayslength} />
            </View>
            ) : null}
            </View>
            
            <View style={{width: '100%', flexDirection: 'row', justifyContent: 'space-around', marginTop: 10}}>
            
            <Button contentStyle={{flexDirection: 'row-reverse'}} icon='bookmark' disabled={true} style={[styles.button, {backgroundColor: '#444444'}]} onPress={() => {
                          
            }}>
              <Text style={{fontSize: 14, fontWeight: 'bold', textAlign: 'center', color: 'gray'}}>Add to</Text>
            </Button>
            <Button
              style={styles.button}
              icon='check'
              onPress={() => {
                if (Object.keys(selectedScheduleData$.days.get()).length <= parseInt(selectedScheduleData$.repeatRule.regular.number.get(), 10)) {
                  if(selectedScheduleData$.title.get() !== '') {
                    if (selectedScheduleData$.id.get()) {
                      handleModify();
                    }
                    else {
                    handleSave();
                    }
                    stateNavigator.navigateBack(1);
                    setDefaultScheduleData();
                  }
                  else {
                    alert('Schedule Name required.')
                  }
                }
                else {
                  alert(`The number of days to repeat (${selectedScheduleData$.repeatRule.regular.number.get()}) cannot be less than the total number of days in the schedule (${Object.keys(selectedScheduleData$.days.get()).length}). Please adjust accordingly.`);
                }
            }}
            >
              <Text>Save</Text>
            </Button>
            <Button
              style={styles.button}
              icon='trash-can'
              onPress={() => {
                handleDelete();
                stateNavigator.navigateBack(1);
                setDefaultScheduleData();
              }}
            >
              <Text>Delete</Text>
            </Button>
            </View>
            </View>
        </View>
    </GestureHandlerRootView>
  )
});

export default Schedule

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(69, 69, 120, 0.8)',
    borderRadius: 10,
  },
  inc: {
      position: 'absolute',
      top: '49%',
      left: -20,
      width: 40,
      height: 60,
      backgroundColor: "rgba(255, 255, 255, 0.4)",
      alignItems: "flex-end",
      justifyContent: "center",
      borderRadius: 20,
    },
    dec: {
      position: 'absolute',
      top: '49%',
      right: -20,
      width: 40,
      height: 60,
      backgroundColor: "rgba(255, 255, 255, 0.4)",
      alignItems: "flex-start",
      justifyContent: "center",
      borderRadius: 20,
    },
})
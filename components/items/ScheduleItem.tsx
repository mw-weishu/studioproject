import React, {useCallback} from 'react';
import {StyleSheet} from 'react-native';
import {Text, View, Pressable} from '../../theme/Themed';
import { ScrollView } from 'react-native-gesture-handler';
import { observer } from '@legendapp/state/react';
import ScheduleEventItem from './ScheduleEventItem';
import { Button, Icon, TouchableRipple } from 'react-native-paper';
import { openDate$ } from '../../utilities/Pickers';
import { TextInput } from 'react-native-paper';
import { handleDelete, handleModify, handleSave, selectedScheduleData$ } from '../../utilities/Schedules';
import BlankscheduleEventItem from './empty/BlankScheduleEventItem';
import { HoldItem } from 'react-native-hold-menu';

interface ItemProps {
  schedule: any; 
}

const NotSelected = observer((scheduleProps: ItemProps) => {
  const {schedule} = scheduleProps;

  const getDayEventsNotSelected =(day: any) => {
    const days = schedule.days;
    const dayEvents = days[day];
    return Array.isArray(dayEvents) ? dayEvents : [];
  }

  return (
    <View>
      <Text style={styles.itemTitleText}>{schedule.title}</Text>
      <View>
        {Object.keys(schedule.days || {}).map(day => (
          <View key={day} style={styles.dayItem}>
            <Pressable style={styles.dec} onPress={() => void 0}>
              <Icon source="chevron-right" size={24} />
            </Pressable>
            <Pressable style={styles.inc} onPress={() => void 0}>
              <Icon source="chevron-left" size={24} />
            </Pressable>
            <Text style={styles.dayTitle}>Day {day}</Text>
            <ScrollView style={{maxHeight: 200}}>
            {(getDayEventsNotSelected(day) || {}).map((event: any) => (
              <View key={event.id}>
                <ScheduleEventItem event={event} day={day}/>
              </View>
            ))}
            </ScrollView>
          </View>
        ))}
      </View>
    </View>
  );
});

const Selected = observer((scheduleProps: ItemProps) => {
  const {schedule} = scheduleProps;

  const getDayEventsSelected =(day: any) => {
    const days = selectedScheduleData$.days.get();
    const dayEvents = days[day];
    return Array.isArray(dayEvents) ? dayEvents : [];
  }

  const unselect = () => {
      selectedScheduleData$.title.set("");
      selectedScheduleData$.description.set("");
      selectedScheduleData$.days.set({});
      selectedScheduleData$.id.set(null);
  };

  const selectDate = () => {
      openDate$.case.set('schedule');
      console.log('case: ', openDate$.case.get());
      openDate$.open.set(true);
  }

  const handleSaveschedule = () => {
      handleModify();
      unselect();
  }

  const handleDeleteschedule = () => {
      handleDelete();
      unselect();
  }

  const addDay = (day: any) => {
      
      const newDay = {
          [day + 1]: []
      };
      selectedScheduleData$.days.set({...selectedScheduleData$.days.get(), ...newDay});
  }

  return (
    <ScrollView
        keyboardShouldPersistTaps='handled' // to allow keyboard to be dismissed by tapping outside of it
        >
        <TextInput
            label='Schedule Name'
            style={{ height: 40, fontWeight: 'bold', fontSize: 16, }}
            onChangeText={text => selectedScheduleData$.title.set(text)}
            value={selectedScheduleData$.title.get()}
            mode='outlined'
            outlineStyle={{borderRadius: 10}}
        />
        <ScrollView
        keyboardShouldPersistTaps='handled' // without this can't press buttons when text input is focused
        scrollEventThrottle={16}
        style={{height: 300, marginVertical: 20}}
        >
          {Object.keys(selectedScheduleData$.days.get() || {}).map(day => (
          <View key={day} style={styles.dayItem}>
              
              <Text style={styles.dayTitle}>Day {day}</Text>
              <BlankscheduleEventItem event={{id: `${schedule.id}-${day}-0`}} day={day}/>
              {(getDayEventsSelected(day) || {}).map((event: any) => (
              <View key={`${event.id} || ${event.modified}`}>
                  {/* <Text>id: {event.id} || mod: {event.modified}</Text> */}
                  <ScheduleEventItem event={event} day={day}/>         
              </View>
              ))}
              
          </View>
          ))}
          <Button onPress={() => addDay(Object.keys(selectedScheduleData$.days.get() || {}).length)}>Add Day</Button>
        </ScrollView>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button onPress={unselect}>
                Discard
            </Button>
            <Button onPress={handleSaveschedule} disabled={selectedScheduleData$.title.get() === ''}>
                Save
            </Button>
            <Button onPress={selectDate}>
                Apply
            </Button>
            <Button onPress={handleDeleteschedule}>
                Delete
            </Button>
        </View>
    </ScrollView>
  );
});

const ScheduleItem = observer((scheduleProps: ItemProps) => {
  const MenuItems = [
    { text: 'Actions', icon: 'home', isTitle: true, onPress: () => {} },
    { text: 'Action 1', icon: 'edit', onPress: () => {} },
    { text: 'Action 2', icon: 'map-pin', withSeparator: true, onPress: () => {} },
    { text: 'Action 3', icon: 'trash', isDestructive: true, onPress: () => {} },
  ];

  const {schedule} = scheduleProps;
  const isSelected = schedule.id === selectedScheduleData$.id.get();

  const itemPressed = useCallback(() => {
    if (schedule.id === selectedScheduleData$.id.get()) {
      return;
    }
    selectedScheduleData$.id.set(schedule.id);
    selectedScheduleData$.title.set(schedule.title);
    selectedScheduleData$.description.set(schedule.description);
    selectedScheduleData$.days.set(schedule.days);
    
  }, []);

  return (
    // <HoldItem
    // items={MenuItems}
    // activateOn='hold'
    // >
    <TouchableRipple onPress={() => void 0} onLongPress={() => void 0} style={isSelected ? styles.selectedItem : styles.item}>
      
      <View>
        {isSelected ? <Selected schedule={schedule}/> : <NotSelected schedule={schedule}/>}
      </View>
      
    </TouchableRipple>
    // </HoldItem>
  );
});

export default React.memo(ScheduleItem);

const styles = StyleSheet.create({
  inc: {
    position: 'absolute',
    top: '49%',
    left: -40,
    width: 40,
    height: 60,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "flex-end",
    justifyContent: "center",
    borderRadius: '50%',
  },
  dec: {
    position: 'absolute',
    top: '49%',
    right: -40,
    width: 40,
    height: 60,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "flex-start",
    justifyContent: "center",
    borderRadius: '50%',
  },
  item: {
    margin: 10,
    marginBottom: 0,
    padding: 20,
    borderRadius: 25,
    flexDirection: 'row',
    backgroundColor: 'rgba(69, 69, 120, 0.7)',
    overflow: 'hidden',
  },
  selectedItem: {
    margin: 10,
    marginBottom: 0,
    padding: 20,
    borderRadius: 25,
    flexDirection: 'row',
    backgroundColor: 'rgba(69, 69, 120, 0.7)'
    },
  blankItem: {
    margin: 10,
    marginBottom: 0,
    padding: 20,
    borderRadius: 25,
    backgroundColor: '#333333',
  },
  dayItem: {
    marginVertical: 10,
  },
  dayTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  dayTitleNoMargin: { 
      fontWeight: 'bold',
      fontSize: 16,
    },
  itemTitleText: {
    marginLeft: 0,
    fontWeight: 'bold',
    fontSize: 16
  },
  blankItemTitleText: {
    color: 'lightgrey',
    marginLeft: 0,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
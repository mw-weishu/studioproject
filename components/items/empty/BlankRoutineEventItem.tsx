import { observer } from '@legendapp/state/react';
import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, TextInput } from 'react-native-paper';
import { Pressable, Text, View } from '../../../theme/Themed';
import { getRoutineEventID, getRoutineID } from '../../../utilities/EventsStore';
import { openTime$ } from '../../../utilities/Pickers';
import { selectedRoutineData$, selectedRoutineEventData$ } from '../../../utilities/Routines';

interface ItemProps {
  event: any;
  day: string; 
}

const NotSelected = observer(() => {

  return (
    <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
      <Text>+</Text>
    </View>
  );
});

const Selected = observer((props: ItemProps) => {
  const {day} = props;
  const unselect = () => {
    selectedRoutineEventData$.id.set(null);
  };

  const handleAddEvent = (day: string) => {
    const newEvent = {
      id: getRoutineEventID(getRoutineID(), Number(day)), //???
      title: selectedRoutineEventData$.title.get(),
      description: selectedRoutineEventData$.description.get(),
      startTime: selectedRoutineEventData$.startDate.get(),
      endTime: selectedRoutineEventData$.endDate.get(),
      eventType: 'default',
      modified: new Date(),
    };
    console.log('New Event: ', newEvent);
    const days = selectedRoutineData$.days.get();
    console.log('Days: ', days);
    const dayEvents = days[day];
    if (Array.isArray(dayEvents)) {
      days[day] = [...dayEvents, newEvent];
    } else {
      days[day] = [newEvent];
    }
    selectedRoutineData$.days.set(undefined);
    selectedRoutineData$.days.set(days);

    console.log('Days: ', selectedRoutineData$.days.get());
    

    unselect();
  }

  const openStartTime = () => {
    openTime$.case.set('routineevent-start');
    openTime$.time.set(selectedRoutineEventData$.startDate.get());
    openTime$.open.set(true);
    
  }

  const openEndTime = () => {
    openTime$.case.set('routineevent-end');
    openTime$.time.set(selectedRoutineEventData$.endDate.get());
    openTime$.open.set(true);
  }

  const formatTime = (selectedTime: Date) => {
    if (!(selectedTime instanceof Date)) {
      selectedTime = new Date(selectedTime);
    }
    const formattedTime = selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return formattedTime;
  };
  
  return (
    <ScrollView
        keyboardShouldPersistTaps='handled' // to allow keyboard to be dismissed by tapping outside of it
        >
      <TextInput
        label="Event Title"
        style={{ height: 40, fontWeight: 'bold', fontSize: 16 }}
        onChangeText={text => selectedRoutineEventData$.title.set(text)}
        value={selectedRoutineEventData$.title.get()}
        mode='outlined'
        outlineStyle={{borderRadius: 10}}
      />
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Button onPress={openStartTime}>
                {formatTime(selectedRoutineEventData$.startDate.get())}
            </Button>
            <Button onPress={openEndTime}>
                {formatTime(selectedRoutineEventData$.endDate.get())}
            </Button>
        </View>
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <Button onPress={unselect}>
            Discard
        </Button>
        <Button onPress={() => handleAddEvent(day)} disabled={selectedRoutineEventData$.title.get() === ''}>
            Save
        </Button>
      </View>

    </ScrollView>
  );
});

const BlankRoutineEventItem = observer((props: ItemProps) => {
    const {event} = props;
    const {day} = props;

  const itemPressed = useCallback(() => {
    if (event.id === selectedRoutineEventData$.id.get()) {
      return
    }
    const newDate = new Date();
    newDate.setHours(0, 0, 0, 0);
    const newMidnight = new Date(new Date().setDate(new Date().getDate() + 1));
    newMidnight.setHours(0, 0, 0, 0);
    selectedRoutineEventData$.id.set(event.id);
    selectedRoutineEventData$.title.set("");
    selectedRoutineEventData$.description.set("");
    selectedRoutineEventData$.startDate.set(newDate);
    selectedRoutineEventData$.endDate.set(newMidnight);
  }, []); 

  return (
    <Pressable onPress={itemPressed} style={styles.blankItem}>
      <View>
        {event.id === selectedRoutineEventData$.id.get() ? <Selected event={event} day={day}/> : <NotSelected/>}
      </View>
    </Pressable>
  );
});

export default React.memo(BlankRoutineEventItem);


const styles = StyleSheet.create({
  item: {
    margin: 10,
    marginBottom: 0,
    padding: 20,
    borderWidth: 1,
    borderColor: 'gold',
    borderRadius: 25,
    flexDirection: 'row',
  },
  blankItem: {
    margin: 10,
    marginBottom: 0,
    padding: 20,
    borderWidth: 1,
    borderRadius: 25,
    borderColor: 'grey',
  },
  rowItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  itemPercentageOutline:{
    width: '100%',
    marginTop: 5,
    backgroundColor: 'lightgray',
    height: 20, 
    borderRadius: 100,
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  itemPercentageOutlineNonActive:{
    width: '100%',
    marginTop: 5,
    height: 20, 
    borderRadius: 100,
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
  },
  itemPercentageInner:{
    flexDirection: 'row',
    backgroundColor: 'lightblue',
    height: 20, 
    borderRadius: 50,
  },
  itemAbsoluteInner:{
    paddingRight: 4,
    paddingLeft: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 20, 
    borderRadius: 50,
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
    fontSize: 16
  },
  itemButtonContainer: {
    flex: 1,
    alignItems: 'flex-end'
  },
});
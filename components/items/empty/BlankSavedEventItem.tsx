import { handleAdd, selectedSavedEventData$ } from '@/utilities/Saved';
import { observer } from '@legendapp/state/react';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Button, TextInput, TouchableRipple } from 'react-native-paper';
import { Text, View } from '../../../theme/Themed';
import { setDefaultEventData } from '../../../utilities/Events';
import { openTime$ } from '../../../utilities/Pickers';

interface ItemProps {
  event: any; 
}

const NotSelected = observer(() => {

  return (
    <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
        <Text style={styles.itemTitleText}>+</Text>
    </View>
  );
});

const Selected = observer(() => {

  const unselect = () => {
    selectedSavedEventData$.title.set("");
    selectedSavedEventData$.description.set("");
    selectedSavedEventData$.startDate.set(new Date(0));
    selectedSavedEventData$.endDate.set(new Date(0));
    selectedSavedEventData$.eventType.set("");
    selectedSavedEventData$.id.set(null);
  };

  const selectStartTime = () => {
    openTime$.case.set('saved-event-start');
    openTime$.time.set(selectedSavedEventData$.startDate.get());
    openTime$.open.set(true);
  }

  const selectEndTime = () => {
    openTime$.case.set('saved-event-end');
    openTime$.time.set(selectedSavedEventData$.endDate.get());
    openTime$.open.set(true);
  }

  const handleSaveEvent = () => {
    handleAdd();
    unselect();
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
        onChangeText={text => selectedSavedEventData$.title.set(text)}
        value={selectedSavedEventData$.title.get()}
        mode='outlined'
        outlineStyle={{borderRadius: 10}}
      />
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <Button onPress={() => selectStartTime()}>
          {formatTime(selectedSavedEventData$.startDate.get())}
        </Button>
        <Button onPress={() => selectEndTime()}>
          {formatTime(selectedSavedEventData$.endDate.get())}
        </Button>
      </View>
      
      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 10}}>
        <Button onPress={unselect}>
          Discard
        </Button>
        <Button onPress={handleSaveEvent} disabled={selectedSavedEventData$.title.get() === ''}>
          Save
        </Button>
      </View>
      
    </ScrollView>
  );
});

const SavedEventItem = observer((eventProps: ItemProps) => {
  const {event} = eventProps;

  const itemPressed = useCallback(() => {
    if (event.id === selectedSavedEventData$.id.get()) {
      return;
    }
    const newDate = new Date();
    newDate.setHours(0, 0, 0, 0);
    const newMidnight = new Date(new Date().setDate(new Date().getDate() + 1));
    newMidnight.setHours(0, 0, 0, 0);
    selectedSavedEventData$.id.set(event.id);
    selectedSavedEventData$.title.set("");
    selectedSavedEventData$.description.set("");
    selectedSavedEventData$.startDate.set(newDate);
    selectedSavedEventData$.endDate.set(newMidnight);
  }, []);

  return (
    <TouchableRipple onPress={() => {
      setDefaultEventData();
      router.navigate('/edit-event');
    }} 
    style={styles.blankItem}>
      <View>
        {event.id === selectedSavedEventData$.id.get() ? <Selected/> : <NotSelected/>}
      </View>
    </TouchableRipple>
  );
});

export default React.memo(SavedEventItem);


const styles = StyleSheet.create({
  item: {
    margin: 10,
    marginBottom: 0,
    padding: 20,
    borderWidth: 1,
    borderColor: 'gold',
    borderRadius: 25,
  },
  blankItem: {
    margin: 10,
    marginBottom: 0,
    padding: 20,
    borderRadius: 25,
    backgroundColor: 'rgb(69,69,120)'
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
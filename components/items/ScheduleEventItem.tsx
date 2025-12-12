import { observer } from '@legendapp/state/react';
import React, { useCallback } from 'react';
import { View as DefaultView, StyleSheet } from 'react-native';
import { Pressable, Text, View } from '../../theme/Themed';
import { HoldItem } from '../HoldItem';
// import { handleDeleteScheduleEvent, selectedEventData$, setEventData } from '../../utilities/Events';
import { addToSavedEvents } from '../../utilities/EventsStore';
// import { selectedScheduleData$, setScheduleDataByEventId } from '../../utilities/Schedules';


interface ItemProps {
  event: any; 
  day?: string;
}

const NotSelected = observer((eventProps: ItemProps) => {
  const {event} = eventProps;

  const formatTime = (selectedTime: Date) => {
    if (!(selectedTime instanceof Date)) {
      selectedTime = new Date(selectedTime);
    }
    const formattedTime = selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return formattedTime;
  };

  return (
    <View>
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <View style={{ flexDirection: 'row', alignItems: 'center'}}>
          <Text style={!event.blank ? styles.itemTitleText : styles.blankItemTitleText}>{event.title}</Text>
        </View>
        <View style={{flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center'}}>
          <Text>{formatTime(event.startDate)} - {formatTime(event.endDate)}</Text>
        </View>
      </View>
        <View style={styles.rowItemsNonActive}>
       
          <DefaultView style={styles.itemPercentageOutlineNonActive}>
            <DefaultView>
              {/* <Text style={!event.blank ? styles.itemTitleText : styles.blankItemTitleText}>xxx</Text> */}
            </DefaultView>
          </DefaultView>
        </View>
    </View>
  );
});

const SavedItem = observer((eventProps: ItemProps) => {
  

  const {event} = eventProps;
  const {day} = eventProps;

  const MenuItems = [
    { text: 'Actions', icon: 'home', isTitle: true, onPress: () => {} },
    { text: 'Edit', icon: 'edit', onPress: () => {
      // setEventData(event);
      // stateNavigator.navigate('edit-event');
    }},
    { text: 'Save', icon: 'save', withSeparator: true, onPress: () => {
      addToSavedEvents(event);
    }},
    { text: 'Delete', icon: 'trash', isDestructive: true, onPress: () => {
      // console.log('event type: ', event.eventType);
            // setScheduleDataByEventId(event.id);
            
            // selectedEventData$.id.set(event.id);
            // handleDeleteScheduleEvent(selectedScheduleData$.dayIndex.get());
    } },
  ];

  const itemPressed = useCallback(() => {
    // setEventData(event);
    // selectedEventData$.blank.set(false);
    // selectedEventData$.eventType.set('schedule');

    // stateNavigator.navigate('edit-event');
  }, []); 

  return (
    <HoldItem
    items={MenuItems}
    activateOn='tap'
    >
    <Pressable onPress={() => void 0} style={styles.item}>
      <View style={styles.itemInner}>
      </View>
      <View style={styles.itemPadding}>
        <NotSelected event={event} day={day}/>
      </View>
    </Pressable>
    </HoldItem>
  );
});

export default React.memo(SavedItem);


const styles = StyleSheet.create({
  itemPadding: {
    padding: 20,
  },
  item: {
    margin: 10,
    marginBottom: 0,
    backgroundColor: 'rgba(255, 200, 0, 0.2)',
    borderRadius: 25,
    // position: 'relative', ???
    overflow: 'hidden',
  },
  itemInner: {
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(255, 200, 0, 0.2)',
    borderRadius: 25,
    position: 'absolute',
  },
  blankItem: {
    margin: 10,
    marginBottom: 0,
    backgroundColor: 'rgba(69, 69, 112, 0.6)',
    borderRadius: 25,
    flexDirection: 'row',
    // position: 'relative', ???
    overflow: 'hidden',
  },
  blankItemInner: {
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(69, 69, 112, 0.6)',
    borderRadius: 25,
    position: 'absolute',
  },
  rowItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    
  },
  rowItemsNonActive: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    
    height: 0,
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
  itemTitleText: {
    marginLeft: 0,
    fontWeight: 'bold',
    fontSize: 16,
    maxWidth: 130,
  },
  blankItemTitleText: {
    color: 'lightgrey',
    marginLeft: 0,
    fontWeight: 'bold',
    fontSize: 16,
    maxWidth: 130,
  },
});
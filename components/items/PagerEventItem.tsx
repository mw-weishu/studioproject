import React, { useMemo } from 'react';
import { View as DefaultView, StyleSheet } from 'react-native';
import { Icon } from 'react-native-paper';
import { Pressable, Text, View } from '../../theme/Themed';
import { addToSavedEvents, deleteEvent } from '../../utilities/EventsStore';
import { HoldItem } from '../HoldItem';
import PagerEventTimeSlide from './PagerEventTimeSlide';

interface ItemProps {
  event: any;
}

const ensureDate = (value: any) => (value instanceof Date ? value : new Date(value));

const formatTime = (selectedTime: Date | string) => {
  const date = ensureDate(selectedTime);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const createMenuItems = (event: any) => [
  { 
    text: 'Edit', 
    icon: 'edit', 
    onPress: () => {
      if (event.eventType === 'schedule') {
        // setScheduleDataByEventId(event.id);
        // stateNavigator.navigate('edit-schedule');
      } else {
        // setEventData(event);
        // stateNavigator.navigate('edit-event');
      }
    }
  },
  { 
    text: 'Save', 
    icon: 'save', 
    withSeparator: true, 
    onPress: () => {
      addToSavedEvents(event);
    }
  },
  { 
    text: 'Delete', 
    icon: 'trash', 
    isDestructive: true, 
    onPress: () => {
      deleteEvent(event);
    }
  },
];

const NotSelected = (eventProps: ItemProps) => {

  const {event} = eventProps;

  // Normalize dates so observables with serialized values still render correctly
  const startDate = useMemo(() => ensureDate(event.startDate), [event.startDate]);
  const endDate = useMemo(() => ensureDate(event.endDate), [event.endDate]);

  // Memoize expensive calculations
  const timeCalculations = useMemo(() => {
    const now = new Date();
    const totalTime = endDate.getTime() - startDate.getTime();
    const timePassed = now.getTime() - startDate.getTime();
    const remainingTime = endDate.getTime() - now.getTime();
    const percentage = Math.min((timePassed / totalTime) * 100, 100);
    const isActiveEvent = now >= startDate && now <= endDate;
    
    return {
      totalTime,
      timePassed,
      remainingTime,
      percentage,
      isActiveEvent
    };
  }, [startDate, endDate]);

  // Memoize formatted times
  const formattedTimes = useMemo(() => ({
    startDate: formatTime(startDate),
    endDate: formatTime(endDate)
  }), [startDate, endDate]);

  return (
    <View>
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Text style={!event.blank ? styles.itemTitleText : styles.blankItemTitleText}>{event.title}</Text>
        </View>
        <View style={{flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center'}}>
          <Text>{formattedTimes.startDate} - {formattedTimes.endDate}</Text>
          </View>
      </View>
            <View style={styles.rowItemsNonActive}>
       
          <DefaultView style={timeCalculations.isActiveEvent ? styles.itemPercentageOutline : styles.itemPercentageOutlineNonActive}>
            <DefaultView>
              {/* {timeCalculations.isActiveEvent ? <Text style={!event.blank ? styles.itemTitleText : styles.blankItemTitleText}>{formatRemainingTime(timeCalculations.remainingTime)}</Text> : null} */}
            </DefaultView>
          </DefaultView>
        </View>
    </View>
  );
};

const PinnedIcon = React.memo(({ blank }: { blank: boolean }) => (
  <Pressable 
    style={!blank ? 
      [styles.floatingIconStart, { transform: [{ rotate: '-45deg' }] }] : 
      styles.blankFloatingIconStart
    } 
    onPress={() => void 0}
  >
    <Icon source={'pin'} size={20} color="white"/>
  </Pressable>
));

const SavedIcon = React.memo(({ blank }: { blank: boolean }) => (
  <Pressable 
    style={!blank ? styles.floatingIconStart : styles.blankFloatingIconStart} 
    onPress={() => void 0}
  >
    <Icon source={'bookmark'} size={20} color="white"/>
  </Pressable>
));

const RepeatIcon = React.memo(({ blank }: { blank: boolean }) => (
  <Pressable 
    style={!blank ? styles.floatingIconStart : styles.blankFloatingIconStart} 
    onPress={() => void 0}
  >
    <Icon source={'update'} size={20} color="white"/>
  </Pressable>
));

const NotificationIcon = React.memo(({ blank }: { blank: boolean }) => (
  <Pressable 
    style={!blank ? styles.floatingIconEnd : styles.blankFloatingIconEnd} 
    onPress={() => void 0}
  >
    <Icon source={'bell-ring'} size={20} color="white" />
  </Pressable>
));

const Item = (eventProps: ItemProps) => {
  //Render count
  const renderCount = React.useRef(1).current++;
  const {event} = eventProps;
  const MenuItems = React.useMemo(() => createMenuItems(event), [event.id]);
  
  return (
      <HoldItem
      items={MenuItems}
      activateOn='tap'
      >
      <View>
      {!event.blank && (
        <View style={styles.floatingIconsContainer}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            {event.pinned && <PinnedIcon blank={event.blank} />}
            {event.saved && <SavedIcon blank={event.blank} />}
            {(event.repeats || event.eventType === 'schedule') && <RepeatIcon blank={event.blank} />}
          </View>
          <View>
            {event.notification && <NotificationIcon blank={event.blank} />}
          </View>
        </View>
      )}
      {!event.blank && event.eventType === 'public' && (
        <View style={styles.floatingIconsContainerBottom}>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
            
            </View>
            <View>
              <Text style={{color: 'white', fontWeight: 'bold', backgroundColor: 'goldenrod', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10}}>public</Text>
            </View>
          
        </View>
      )}

      <View style={!event.blank ? styles.item : styles.blankItem}>
    {/* <Pressable onLongPress={() => setMenuVisible(true)} onPress={itemPressed} style={!event.blank ? styles.item : styles.blankItem}> */}
      
      <PagerEventTimeSlide event={event}/>
      <View style={{paddingVertical: 20, paddingHorizontal: 14,}}>
        <NotSelected event={event}/>
      </View>
    </View>
    </View>
    </HoldItem>
  );
};

// Custom comparison function for better memoization
const areEqual = (prevProps: ItemProps, nextProps: ItemProps) => {
  const prev = prevProps.event;
  const next = nextProps.event;
  
  return (
    prev.id === next.id &&
    prev.title === next.title &&
    prev.description === next.description &&
    prev.startDate === next.startDate &&
    prev.endDate === next.endDate &&
    prev.blank === next.blank &&
    prev.pinned === next.pinned &&
    prev.saved === next.saved &&
    prev.repeats === next.repeats &&
    prev.notification === next.notification &&
    prev.eventType === next.eventType
  );
};

export default React.memo(Item, areEqual);


const styles = StyleSheet.create({
  floatingIconsContainer: {
    position: 'absolute',
    top: 4,
    left: 10,
    right: 10,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  floatingIconsContainerBottom: {
    position: 'absolute',
    bottom: -6,
    left: 10,
    right: 10,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  floatingIconStart: {
    height: 24,
    width: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgb(160, 120, 0)',
    borderRadius: '50%',
    marginRight: 2,
  },
  blankFloatingIconStart: {
    height: 24,
    width: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgb(69, 69, 112)',
    borderRadius: '50%',
    marginRight: 2,
  },
  floatingIconEnd: {
    height: 24,
    width: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgb(160, 120, 0)',
    borderRadius: '50%',
  },
  blankFloatingIconEnd: {
    height: 24,
    width: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgb(69, 69, 112)',
    borderRadius: '50%',
  },
  item: {
    margin: 10,
    marginBottom: 0,
    backgroundColor: 'rgba(255, 200, 0, 0.4)',
    borderRadius: 25,
    overflow: 'hidden',
  },
  blankItem: {
    margin: 10,
    marginBottom: 0,
    backgroundColor: 'rgba(69, 69, 112, 0.6)',
    borderRadius: 25,
    flexDirection: 'row',
    overflow: 'hidden',
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
    height: 20, 
    borderRadius: 100,
    justifyContent: 'center',
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
    fontSize: 16
  },
  blankItemTitleText: {
    color: 'lightgrey',
    marginLeft: 0,
    fontWeight: 'bold',
    fontSize: 16
  },
});
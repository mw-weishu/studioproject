import { observable } from '@legendapp/state';
import { observer } from '@legendapp/state/react';
import * as FileSystem from 'expo-file-system';
import React, { useCallback } from 'react';
import { View as DefaultView, Image, StyleSheet } from 'react-native';
import { Icon, TouchableRipple } from 'react-native-paper';
import { Pressable, Text, View } from '../../theme/Themed';
// import { openDate$, openTime$ } from '../../utilities/Pickers';
// import { handleDelete, handleDeleteEvent, handleDeleteScheduleEvent, selectedEventData$, setDefaultEventData, setEventData } from '../../utilities/Events';
// import { selectedScheduleData$, setScheduleData, setScheduleDataByEventId } from '../../utilities/Schedules';
import { addToSavedEvents } from '../../utilities/EventsStore';
import { HoldItem } from '../HoldItem';
import PagerEventTimeSlide from './PagerEventTimeSlide';
// import { handleAdd, selectedSavedEventData$ } from '../../utilities/SEvents';

const fosusedOnEvent = observable(null);

interface ItemProps {
  event: any;
}

const formatTime = (selectedTime: Date) => {
    if (!(selectedTime instanceof Date)) {
      selectedTime = new Date(selectedTime);
    }
    const formattedTime = selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return formattedTime;
  };

const Item = observer((eventProps: ItemProps) => {

  const BlankItems = [
    { text: 'Create', icon: 'plus-square', onPress: () => {
      // setDefaultEventData(event);
      // stateNavigator.navigate('edit-event')
    }},
  ];

  const EventItems = [
    // { text: 'Actions', icon: 'home', isTitle: true, onPress: () => {} },
    // { text: 'Edit', icon: 'edit', onPress: () => {
    //   setEventData(event);
    //   stateNavigator.navigate('edit-event')
    // }},
    { text: 'Copy to Dates', icon: 'calendar', onPress: () => {
      // selectedSavedEventData$.set({
      //   ...event,
      //   startDate: event.startDate,
      //   endDate: event.endDate,
      // });
      // openDate$.case.set('saved-event-apply');
      // stateNavigator.navigate('calendar');
    }},
    { text: 'Add to Saved', icon: 'save', withSeparator: true, onPress: () => {
      // selectedSavedEventData$.set(event);
      // handleAdd();
    }},
    // { text: 'Add to Public', icon: 'share', onPress: () => {
    //   addToPublicEvents(event);
    // }},
    // { text: 'Delete', icon: 'trash', isDestructive: true, onPress: () => {
    //   // console.log('event type: ', event.eventType);
    //   selectedEventData$.set(event);
    //   handleDeleteEvent(event);
    // }},
  ];

  const ScheduleEventItems = [
    // { text: 'Actions', icon: 'home', isTitle: true, onPress: () => {} },
    // { text: 'Edit Schedule', icon: 'edit', onPress: () => {
    //   setScheduleDataByEventId(event.id);
    //   stateNavigator.navigate('edit-schedule');
    // }},
    { text: 'Add to Saved', icon: 'save', withSeparator: true, onPress: () => {
      addToSavedEvents(event);
    }},
    // { text: 'Delete', icon: 'trash', isDestructive: true, onPress: () => {
    //   // console.log('event type: ', event.eventType);
    //   setScheduleDataByEventId(event.id);
      
    //   selectedEventData$.id.set(event.id);
    //   handleDeleteScheduleEvent(selectedScheduleData$.dayIndex.get());
    // }},
  ];
  

  // const {date} = eventProps;
  const {event} = eventProps;
  const [localExists, setLocalExists] = React.useState(false);
  const [remoteExists, setRemoteExists] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    const checkImages = async () => {
      try {
        const localUri = event.image;
        const remoteUrl = event.imageUrl;
        if (localUri && localUri.startsWith('file://')) {
          try {
            const info = await FileSystem.getInfoAsync(localUri);
            if (!cancelled) setLocalExists(!!info.exists);
          } catch {
            if (!cancelled) setLocalExists(false);
          }
        }
        if (remoteUrl && !localExists) {
          try {
            await Image.prefetch(remoteUrl);
            if (!cancelled) setRemoteExists(true);
          } catch {
            if (!cancelled) setRemoteExists(false);
          }
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    checkImages();
    return () => { cancelled = true; };
  }, [event.image, event.imageUrl]);

  const itemPressed = useCallback(() => {
    console.log('event type: ', event.eventType);
    if (event.eventType === 'schedule') {
      // setScheduleDataByEventId(event.id);
      // stateNavigator.navigate('edit-schedule');
    } else {
    if(event.blank){
    // setDefaultEventData(event);
    }
    else{
    // setEventData(event);
    }
    // stateNavigator.navigate('edit-event');
    }
  }, []);

  const displayUri = localExists ? event.image : remoteExists ? event.imageUrl : null;
  const expectImage = !!(event.image || event.imageUrl);
  const now = new Date();
  const isActiveEvent = now >= event.startDate && now <= event.endDate;
  
  
return (
      <View>
      <HoldItem
      items={event.blank ? BlankItems : event.eventType === 'schedule' ? ScheduleEventItems : EventItems}
      activateOn='tap'
      >
      <View>
      {!event.blank &&
      <View style={styles.floatingIconsContainer}>
        
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          {event.pinned &&
          <Pressable style={!event.blank ? [styles.floatingIconStart, { transform: [{ rotate: '-45deg' }] }] : styles.blankFloatingIconStart} onPress={() => void 0}>
          
            <Icon source={'pin'} size={20} color="white"/>
          </Pressable>
          }
          {event.saved &&
          <Pressable style={!event.blank ? styles.floatingIconStart : styles.blankFloatingIconStart} onPress={() => void 0}>
          
            <Icon source={'bookmark'} size={20} color="white"/>
          </Pressable>
          }
          {(event.repeats || event.eventType === 'schedule') &&
          <Pressable style={!event.blank ? styles.floatingIconStart : styles.blankFloatingIconStart} onPress={() => void 0}>
          
            <Icon source={'update'} size={20} color="white"/>
          </Pressable>
          }
        </View>
        <View>
          {event.notification &&
          <Pressable style={!event.blank ? styles.floatingIconEnd : styles.blankFloatingIconEnd} onPress={() => void 0}>
            <Icon source={'bell-ring'} size={20} color="white" />
          </Pressable>
          }
        </View>
      </View>
      }
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
      <TouchableRipple onPress={() => void 0}>
        <View>
          <PagerEventTimeSlide event={event}/>
          <View style={{paddingVertical: 20, paddingHorizontal: 14,}}>
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={!event.blank ? styles.itemTitleText : styles.blankItemTitleText}>{event.title}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <Text>{formatTime(event.startDate)} - {formatTime(event.endDate)}</Text>
                </View>
              </View>
              <View style={styles.rowItemsNonActive}>
                <DefaultView style={isActiveEvent ? styles.itemPercentageOutline : styles.itemPercentageOutlineNonActive}>
                  <DefaultView />
                </DefaultView>
              </View>
              {event.description !== '' && <Text>{event.description}</Text>}
              {expectImage && (
                displayUri && !checking && !imageError ? (
                  <Image
                    source={{ uri: displayUri }}
                    style={styles.image}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <View style={styles.imagePlaceholder} />
                )
              )}
            </View>
          </View>
        </View>     
      </TouchableRipple>
      </View>
    </View>
    </HoldItem>
    </View>
  );
});

export default React.memo(Item);


const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 200,
    marginTop: 10,
    borderRadius: 15,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    marginTop: 10,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)'
  },
  hiddenImage: {
    width: 0,
    height: 0,
    opacity: 0,
    position: 'absolute',
  },
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
    // position: 'relative', ???
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
    // backgroundColor: 'lightgray',
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
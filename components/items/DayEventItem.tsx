import { handleDeleteEvent, selectedEventData$, setDefaultEventData, setEventData } from '@/utilities/Events';
import { openDate$ } from '@/utilities/Pickers';
import { handleAdd, selectedSavedEventData$ } from '@/utilities/Saved';
import { setScheduleDataByEventId } from '@/utilities/Schedules';
import { observable } from '@legendapp/state';
import { observer } from '@legendapp/state/react';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { View } from '../../theme/Themed';
import { addToPublicEvents, addToSavedEvents } from '../../utilities/EventsStore';
import { HoldItem } from '../HoldItem';
import { EventContent } from './DayEventItem.EventContent';
import { FloatingIcons } from './DayEventItem.FloatingIcons';
import { PublicBadge } from './DayEventItem.PublicBadge';

const focusedOnEvent = observable(null);

interface ItemProps {
  event: any;
}

const Item = observer((eventProps: ItemProps) => {

  const BlankItems = [
    { text: 'Create', icon: 'plus-square', onPress: () => {
      setDefaultEventData(event);
      router.navigate('/edit-event');
    }},
  ];

  const EventItems = [
    // { text: 'Actions', icon: 'home', isTitle: true, onPress: () => {} },
    { text: 'Edit', icon: 'edit', onPress: () => {
      setEventData(event);
      router.navigate('/edit-event');
    }},
    { text: 'Copy to Dates', icon: 'calendar', onPress: () => {
      selectedSavedEventData$.set({
        ...event,
        startDate: event.startDate,
        endDate: event.endDate,
      });
      openDate$.case.set('saved-event-apply');
      router.navigate('/date');
    }},
    { text: 'Add to Saved', icon: 'save', withSeparator: true, onPress: () => {
      selectedSavedEventData$.set(event);
      handleAdd();
    }},
    { text: 'Add to Public', icon: 'share', onPress: () => {
      addToPublicEvents(event);
    }},
    { text: 'Delete', icon: 'trash', isDestructive: true, onPress: () => {
      // console.log('event type: ', event.eventType);
      selectedEventData$.set(event);
      handleDeleteEvent(event);
    }},
  ];

  const ScheduleEventItems = [
    // { text: 'Actions', icon: 'home', isTitle: true, onPress: () => {} },
    { text: 'Edit Schedule', icon: 'edit', onPress: () => {
      setScheduleDataByEventId(event.id);
      router.navigate('/edit-schedule');
    }},
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
  

  const { event } = eventProps;

  const itemPressed = useCallback(() => {
    console.log('event type: ', event.eventType);
    if (event.eventType === 'schedule') {
      // setScheduleDataByEventId(event.id);
      // stateNavigator.navigate('edit-schedule');
    } else {
      if (event.blank) {
        // setDefaultEventData(event);
      } else {
        // setEventData(event);
      }
      // stateNavigator.navigate('edit-event');
    }
  }, [event]);

  return (
    <HoldItem
      items={
        event.blank
          ? BlankItems
          : event.eventType === 'schedule'
          ? ScheduleEventItems
          : EventItems
      }
      activateOn="tap"
      hitSlop={{ top: 50, bottom: 50, left: 10, right: 10 }}
    >
      <View style={{ position: 'relative' }}>
        <FloatingIcons event={event} />
        <PublicBadge event={event} />
        <EventContent event={event} />
      </View>
    </HoldItem>
  );
});

export default React.memo(Item);
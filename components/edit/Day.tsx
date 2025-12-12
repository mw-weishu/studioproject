import { Keyboard, StyleSheet, View } from 'react-native'
import React, { useState } from 'react'
import { GestureHandlerRootView, Pressable, ScrollView, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import Pager from 'react-native-infinite-pager'
import { Button, Icon, TouchableRipple } from 'react-native-paper';
import { Text, TextInput } from '../../theme/Themed';
import { observer } from '@legendapp/state/react';
import BlankScheduleEventItem from '../items/empty/BlankScheduleEventItem';
import ScheduleEventItem from '../items/ScheduleEventItem';
import { routeState$, stateNavigator } from '../../nav/stateNavigator';
import { Switch as Toggle } from 'react-native-paper';
import { configureObservablePersistence, persistObservable } from '@legendapp/state/persist';
import { ObservablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { observable } from '@legendapp/state';
// import { FlashList } from '@shopify/flash-list';
import { filterRepeatingEvents, filterScheduleEvents, getEventsForDate } from '../../utilities/EventsStore';
import { formatDate } from '../../utilities/Pickers';
import DayEventItem from '../items/DayEventItem';
import { onPageChangeInitialIndexState$ } from '../MyPager';
import { HoldMenuFlatList } from 'react-native-hold-menu';

// Function to format the date key
const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

// Helper function to convert milliseconds to hours and minutes
const formatDuration = (ms: number): string => {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes}min`
  }
  else if (minutes === 0) {
    return `${hours}h`;
  } 
  else {
    return `${hours}h ${minutes}min`;
  }
  
};

const DayItem = observer(() => {
        const index = onPageChangeInitialIndexState$.get();
  
      const [currentTime, setCurrentTime] = useState(new Date());
      // !!! cannot change the state of events from here !!!
      const title = index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : index === -1? 'Yesterday' : '';
      const dateTitle = formatDate(new Date(new Date().setDate(new Date().getDate() + index)));
  
      const blankStartDate = new Date();
      blankStartDate.setDate(new Date().getDate() + index);
      blankStartDate.setHours(0, 0, 0, 0);

      const blankEndDate = new Date();
      blankEndDate.setDate(new Date().getDate() + index + 1);
      blankEndDate.setHours(0, 0, 0, 0);
  
      const date = new Date(currentTime);
      date.setDate(new Date().getDate() + index);
      const dateStr: string = formatDateKey(date);

      // console.log('schedule events: ', filterScheduleEvents(dateStr));
      
      const filteredEvents = [
        ...(getEventsForDate(dateStr) || []).map((event: any) => ({
            ...event,
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate),
        })),
        ...filterRepeatingEvents(dateStr).map((event: any) => ({
            ...event,
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate),
        })),
        ...filterScheduleEvents(dateStr).map((event: any) => ({
            ...event,
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate),
        })),
      ];
      filteredEvents.sort((a: any, b: any) => a.startDate.getTime() - b.startDate.getTime());
  
      // creating empty blocks around events in the FlatList
      let compareTime = new Date(date);
      compareTime.setHours(0, 0, 0, 0);
      
      const emptyBlocks = [];
      
      for (let i = 1; i < filteredEvents.length + 1; i++) {
        if (new Date(filteredEvents[i-1].startDate) > compareTime && new Date(filteredEvents[i-1].startDate).getTime() - compareTime.getTime() >= 60000) {
          const duration = formatDuration(filteredEvents[i-1].startDate.getTime() - compareTime.getTime());
          emptyBlocks.push({         
            title: duration,
            startDate: compareTime,
            endDate: filteredEvents[i-1].startDate,
            description: '',
            blank: true,
            id: dateStr + '-' + i + '-blank',
          });
        }
        compareTime = filteredEvents[i-1].endDate;
      }
  
      
      // !!! endDate in the next day could require a special display logic !!!
      const nextDate = new Date(compareTime);
      nextDate.setDate(compareTime.getDate() + 1);
      nextDate.setHours(0, 0, 0, 0);
      
      if (compareTime < blankEndDate) {
        const duration = formatDuration(nextDate.getTime() - compareTime.getTime());
        emptyBlocks.push({        
          title: duration,
          startDate: compareTime,
          endDate: nextDate,
          description: '',
          blank: true,
          id: dateStr + '-' + emptyBlocks.length + 1 + '-blank',
        });
      }
  
      // merging and sorting the events and empty blocks
      const finalEvents = [...filteredEvents, ...emptyBlocks];
      finalEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      
      return (
        <View style={{paddingVertical: 10}}>
            
        <View style={styles.slide}>
            
          <View style={{ marginHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <View style={{flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', gap: 10}}>
          <TouchableRipple onPress={() => stateNavigator.navigateBack(1)} style={{backgroundColor: 'rgba(255, 255, 255, 0.3)', height: 30, width: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center'}}>
            <Icon source="chevron-left" size={30}/>
          </TouchableRipple>
          <Text style={styles.header}>{title}</Text>
          </View>
          <Text style={styles.header}>{dateTitle}</Text>
          </View>
          
          <HoldMenuFlatList
            data={finalEvents}
            keyExtractor={(item) => `${item.id}-${item.modified}`} // Ensure a unique string key
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <DayEventItem event={item} />
            )}
          />
        </View>
        </View>
      );
      
});

export default DayItem;

const styles = StyleSheet.create({
    slide: {
      height: '100%',
    },
    header: {
      fontSize: 20,
      fontWeight: 'bold',
    }
});
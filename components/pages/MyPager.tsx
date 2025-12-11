import { Pressable, Text, View } from '@/theme/Themed';
import { filterRepeatingEvents, filterScheduleEvents, getEventsForDate } from '@/utilities/EventsStore';
import { observer } from '@legendapp/state/react';
import React, { useEffect, useState } from 'react';
import { Dimensions, Platform, StyleSheet } from 'react-native';
import { FlatList, GestureHandlerRootView } from 'react-native-gesture-handler';
import PagerItem from '../items/PagerEventItem';

import Pager, { InfinitePagerImperativeApi, Preset } from 'react-native-infinite-pager';
// import { pagerDateData$, setDefaultEventData, setEventData } from '../utilities/Events';
import { observable } from '@legendapp/state';
// import { formatDate } from '../utilities/Pickers';
// import { routeState$, stateNavigator } from '../nav/stateNavigator';
// import { set } from 'date-fns';
import { CalendarImperativeApi } from 'react-native-swipe-calendar';
// import { setDefaultScheduleData } from '../utilities/Schedules';
// import { initialScheduleIndex$ } from './edit/Schedule';

const formatDate = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
};

const calendarIndexDate$ = observable(new Date());

// const configurePersistence = async() => {
//     try {
//         configureObservablePersistence({
//         pluginLocal: ObservablePersistAsyncStorage,
//         localOptions: {
//           asyncStorage: {
//             AsyncStorage,
//           },
//         },
//       });
//     } catch (error) {
//       console.error("Error configuring persistence:", error);
//     }
// };

export const initialIndex$ = observable(0);
export const onPageChangeInitialIndexState$ = observable(0);

// const persistInitialIndex = async() => {
//   try {
//       persistObservable(initialIndex$, {
//           local: `initialIndex`,
//       });
//       persistObservable(onPageChangeInitialIndexState$, {
//           local: `onPageChangeInitialIndexState`,
//       });
//   } catch (error) {
//     console.error("Error persisting initialIndex:", error);
//   }
// }

// configurePersistence();
// persistInitialIndex();

// Function to format the date key
const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

// Compute the day index difference between a date and today using UTC midnights.
// This avoids DST and timezone-caused millisecond differences that can produce
// fractional days when using local ms arithmetic.
const msPerDay = 24 * 60 * 60 * 1000;
const dayIndexFromToday = (d: Date) => {
  const today = new Date();
  const utcD = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.trunc((utcD - utcToday) / msPerDay);
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

const getTitle = (index: number) => {
  if (index === 0) return 'Today';
  else if (index === 1) return 'Tomorrow';
  else if (index === -1) return 'Yesterday';
  else if (index > 1 && index < 11) return `in ${index} days`;
  else if (index < -1 && index > -11) return `${-index} days ago`;

  return '';
}

const CarouselPage = ({ index }: { index: number }) => {
  
      const [currentTime, setCurrentTime] = useState(new Date());

        useEffect(() => {
          const interval = setInterval(() => {
            setCurrentTime(new Date());
          }, 1000);
          return () => clearInterval(interval);
        }, []);
      // !!! cannot change the state of events from here !!!
      const title = getTitle(index);
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
        <Pressable onPress={() => {
          // stateNavigator.navigate('edit-day')
        }} 
          style={{marginBottom: 65, marginHorizontal: 16, paddingVertical: 10, borderRadius: 25, backgroundColor: 'rgba(69, 69, 120, 0.6)'}}>
        <View style={styles.slide}>

          <View style={{ marginHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <Text style={styles.header}>{title}</Text>
          <Text style={styles.header}>{dateTitle}</Text>
          </View>
          
          <FlatList
            data={finalEvents}
            keyExtractor={(item) => `${item.id}-${item.modified}`} // Ensure a unique string key
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            removeClippedSubviews={false}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={10}
            getItemLayout={undefined}
            renderItem={({ item }) => (
              <PagerItem event={item} />
            )}
          />
        </View>
        {/* </HoldItem> */}
        </Pressable>
      );
      
    };

const MyPager = observer(() => {
    const goToTodayVisible = onPageChangeInitialIndexState$.get() !== 0;
    // Use SLIDE preset on web to avoid pageInterpolatorCube initialization error
    const [preset, setPreset] = useState<Preset>(Platform.OS === 'web' ? Preset.SLIDE : Preset.SLIDE);
    const [screenData, setScreenData] = useState(Dimensions.get('window'));

    //Render count
    const renderCount = React.useRef(1).current++

    const pagerRef = React.useRef<InfinitePagerImperativeApi>(null);
  // when true, the next pager onPageChange was triggered by the calendar touch
  const suppressSetSelectedDate = React.useRef(false);
  const suppressFirstTime = React.useRef(0);

    // Handle orientation changes
    useEffect(() => {
      const subscription = Dimensions.addEventListener('change', ({ window }) => {
        setScreenData(window);
      });
      return () => subscription?.remove();
    }, []);

    // Handle pager ref updates when orientation changes
    useEffect(() => {
      if (pagerRef.current) {
        // Force a layout update after orientation change
        setTimeout(() => {
          if (pagerRef.current) {
            const currentIndex = onPageChangeInitialIndexState$.get();
            pagerRef.current.setPage(currentIndex, { animated: false });
          }
        }, 100);
      }
    }, [screenData.width, screenData.height]);

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

    const transformDateToMonday = (date: Date): Date => {
      const day = date.getDay(); // 0 (Sun) to 6 (Sat)
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
      date.setDate(diff)
      date.setHours(0, 0, 0, 0);
      console.log('CalendarIndexDate: ', calendarIndexDate$.get());
      console.log('Returning Monday date: ', date);
      return new Date(date);
    };
    
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const calendarRef = React.useRef<CalendarImperativeApi>(null);
    
  
    const onPageChange = (index: number) => {
      // const newStartDate = new Date(new Date().setDate(new Date().getDate() + index));
      // newStartDate.setHours(0, 0, 0, 0);
      // pagerDateData$.baseStartDate.set(newStartDate);
      // const oldStartDate = pagerDateData$.currentScreenStartDate.get();
      // pagerDateData$.currentScreenStartDate.set(newStartDate);
      // const newEndDate = new Date(new Date().setDate(new Date().getDate() + index + 1));
      // newEndDate.setHours(0, 0, 0, 0);
      // pagerDateData$.baseEndDate.set(newEndDate);
      // pagerDateData$.currentScreenEndDate.set(newEndDate);

      // onPageChangeInitialIndexState$.set(index);

      // // If this page change was initiated by the calendar (user tapped a day),
      // // don't clear the selected date here. The calendar initiated the change
      // // and will keep selection as appropriate.
      // if (suppressSetSelectedDate.current) {
      //   suppressSetSelectedDate.current = false;
      // } else {
      //   setSelectedDate(new Date(new Date().setDate(new Date().getDate() + index)));

      //   if (suppressFirstTime.current < 1) {
      //     suppressFirstTime.current += 1;
      //     return;
      //   }
      //   else {
      //     // if (selectedDate) {
      //     //   console.log('aaaaasssss', selectedDate)
      //     //   calendarRef.current?.setPage(selectedDate)
      //     // }
      //     // define if it is previous or next week for calendar page change
      //     const mondayCurrentWeekPageDate = transformDateToMonday(new Date(selectedDate || new Date())); 
      //     console.log('Calendar Index Date: ', calendarIndexDate$.get());
      //     const isOnSameWeekPage = calendarIndexDate$.get().getTime() === mondayCurrentWeekPageDate.getTime();
      //     console.log('Is on same week page: ', isOnSameWeekPage);
      //     if (newStartDate.getDay() === 0 && oldStartDate.getDay() === 1 
      //     && ((Math.abs((newStartDate.getTime() - oldStartDate.getTime()) / 86400000) <= 2)
      //     || (Math.abs((newStartDate.getTime() - oldStartDate.getTime()) / 86400000) >= 25))
      //     && isOnSameWeekPage) {
      //       console.log('isOnSameWeekPage triggered decrementPage', isOnSameWeekPage);
      //       calendarRef.current?.decrementPage({ animated: true });
      //     }
      //     else if (newStartDate.getDay() === 1 && oldStartDate.getDay() === 0
      //     && ((Math.abs((newStartDate.getTime() - oldStartDate.getTime()) / 86400000) <= 2)
      //     || (Math.abs((newStartDate.getTime() - oldStartDate.getTime()) / 86400000) >= 25))
      //     && isOnSameWeekPage) {
      //       console.log('isOnSameWeekPage triggered incrementPage', isOnSameWeekPage);
      //       calendarRef.current?.incrementPage({ animated: true });
      //     }
      //   }
      // } 

      
    }
    
    const [state, setState] = React.useState({ open: false });
    
      const onStateChange = ({ open }: { open: boolean }) => setState({ open });
    
      const { open } = state;

    

    return (
    <GestureHandlerRootView>
      {/* <Calendar
        theme={{ 
          todayIndicatorDotColor: 'royalblue',
          headerFontColor: 'white',
          dayLabelColor: 'white',
          dayFontColor: 'white',
          selectedDayFontColor: 'black',
          selectedDayBackgroundColor: 'goldenrod',
        }}
        HeaderComponent={({startDate, endDate}: {startDate: any, endDate: any}) => {
          return null;
        }}
        // DayLabelComponent={({ date }) => {
        //   return (
        //     null
        //   );
        // }}
        pageInterval='week'
        // WeekComponent={({ days }) => {
        //   return (
        //     <View style={{ height: 50, flexDirection: 'row', justifyContent: 'space-between', padding: 16}}>
        //       {days.map((day, index) => (
        //         <TouchableRipple key={index} onPress={() => void 0}>
        //           <View style={{ flex: 1, alignItems: 'center' }}>
        //             <Text style={{ color: 'white' }}>{day.getDate()}</Text>
        //           </View>
        //         </TouchableRipple>
        //       ))}
        //     </View>
        //   );
        // }}
        weekStartsOn={1}
        ref={calendarRef}
        currentDate={currentDate}
        onDateSelect={(date: any, { isSelected }: {isSelected: any}) => {
          // set the selected date (calendar tapped)
          setSelectedDate(date);
          // mark that this page change comes from the calendar so the pager onPageChange
          // doesn't clear the selected date.
          suppressSetSelectedDate.current = true;
          // compute page index robustly using UTC midnights to avoid DST/timezone shifts
          const index = dayIndexFromToday(new Date(date));
          pagerRef.current?.setPage(index, { animated: Math.abs(index - onPageChangeInitialIndexState$.get()) === 1 ? true : false });
        }}
        selectedDate={selectedDate}
        onPageChange={(date: any) => {
          console.log('Setting Calendar Index Date: ', date);
          calendarIndexDate$.set(date);
          // LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          // console.log('Date: ', date);

        }}
      /> */}
      <View style={{height: 10}}>
        {/* <Text>{suppressFirstTime.current}</Text> */}
      </View>

      <Pager
        ref={pagerRef}
        style={styles.pager}
        renderPage={CarouselPage}
        vertical={false}
        initialIndex={initialIndex$.get()}
        onPageChange={(index: number) => onPageChange(index)}
        preset={preset}
      />

        {/* <Pressable style={[styles.dec, { top: screenData.height * 0.45 }]} onPress={() => handleIncrement()}>
          <Icon source="chevron-right" size={24} />
        </Pressable>
        <Pressable style={[styles.inc, { top: screenData.height * 0.45 }]} onPress={() => handleDecrement()}>
          <Icon source="chevron-left" size={24} />
        </Pressable> */}
        {/* {goToTodayVisible ? 
        <Pressable style={styles.goToToday} onPress={() => {
          if (pagerRef.current) {
            pagerRef.current.setPage(0, { animated: false }); // can change this depending on if difference is equal to 1
            calendarRef.current?.setPage(new Date(), { animated: false });
          }
        }}>
          <Text style={{fontSize: 16, fontWeight: 'bold'}}>Go to Today</Text>
          <Icon source="arrow-u-left-top" size={24} />
        </Pressable>
        :
         null
        } */}
        {/* <FAB.Group
          style={{bottom: 60, right: 8, borderRadius: 20,}}
          fabStyle={{borderRadius: 20, backgroundColor: 'rgba(252, 186, 3, 0.6)'}}
          open={open}
          visible
          icon={open ? 'close' : 'plus'}
          actions={[
            {
              icon: 'calendar',
              label: 'Event',
              onPress: () => {
                // setDefaultEventData();
                // stateNavigator.navigate('edit-event')
              },
            },
            {
              icon: 'calendar-text',
              label: 'Schedule',
              onPress: () => {
                // setDefaultScheduleData();
                // initialScheduleIndex$.set(0);
                // stateNavigator.navigate('edit-schedule');
              },
            },
          ]}
          onStateChange={onStateChange}
          onPress={() => {
            setState({ open: !open });
          }}
        /> */}
    </GestureHandlerRootView>
    );
});

export default MyPager

const styles = StyleSheet.create({
    pager: {
      flex: 1,
    },
    inc: {
      position: 'absolute',
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
      right: -20,
      width: 40,
      height: 60,
      backgroundColor: "rgba(255, 255, 255, 0.4)",
      alignItems: "flex-start",
      justifyContent: "center",
      borderRadius: 20,
    },
    goToToday: {
      position: 'absolute',
      bottom: 70,
      left: 20,
      height: 40,
      backgroundColor: "rgba(255, 255, 255, 0.4)",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 20,
      paddingHorizontal: 10,
    },
    slide: {
      height: '100%',
    },
    header: {
      fontSize: 20,
      fontWeight: 'bold',
    }
});
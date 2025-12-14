import { Text, View } from '@/theme/Themed';
import { onDateConfirm } from "@/utilities/Pickers";
import { router } from "expo-router";
import React, {
  useRef,
  useState,
} from "react";
import {
  Platform,
  StyleSheet,
  UIManager
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Button } from "react-native-paper";
import Calendar, { CalendarImperativeApi } from "react-native-swipe-calendar";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function MyCalendar() {

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const calendarRef = useRef<CalendarImperativeApi>(null);

  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });

  const handleDateSelect = (date: Date) => {
    setDateRange((prevRange) => {
      if (!prevRange.start || (prevRange.start && prevRange.end)) {
        return { start: date, end: null };
      } else if (prevRange.start && !prevRange.end) {
        return date > prevRange.start ? { start: prevRange.start, end: date } : { start: date, end: prevRange.start };
      }
      return prevRange;
    });
  };

  const getInitialIndex = (date: Date) => {
    // calculate the days between the selected date and the current date
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to midnight for accurate comparison
    const diff = Math.abs(date.getTime() - today.getTime());
    const diffDays = Math.ceil(diff / (1000 * 3600 * 24));
    if (date > currentDate) {
    return diffDays;
    }
    return -diffDays;
  };

  
  return (
    <GestureHandlerRootView>
    <View style={styles.container}>
      <Calendar
        theme={{ 
          todayIndicatorDotColor: "cyan",
          headerFontColor: 'white',
          dayLabelColor: 'white',
          dayFontColor: 'white',
          selectedDayFontColor: 'black',
          selectedDayBackgroundColor: 'goldenrod',
        }}
        HeaderComponent={({startDate, endDate}) => (
          <View style={{ padding: 20}}>
            <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>
              {startDate.toLocaleDateString("en", {
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>
        )}
        // DayComponent={({ date, isSelected, isToday }) => {
        //   const isInRange =
        //     dateRange.start &&
        //     dateRange.end &&
        //     date >= dateRange.start &&
        //     date <= dateRange.end;
      
        //   return (
        //     <Pressable
        //       style={{
        //         flex: 1,
        //         height: 50,
        //         backgroundColor: isSelected ? "goldenrod" : isInRange ? "lightgrey" : isToday ? "cyan" : "black",
        //         borderWidth: 1,
        //         borderColor: '#252525',
        //         alignItems: "center",
        //       }}
        //       onPress={() => {
        //         // setSelectedDate(date);
        //         handleDateSelect(date);
        //       }}
        //     >
        //       <Text style={{ color: isToday ? "red" : "white" }}>{date.getDate()}</Text>
        //     </Pressable>
        //   );
        // }}
        // onDateSelect={handleDateSelect}
        weekStartsOn={1}
        ref={calendarRef}
        currentDate={currentDate}
        onDateSelect={(date, { isSelected }) => {
          setSelectedDate(isSelected ? null : date );
          // Automatically change page if selected date is in prev/next month
          // const diff = differenceInCalendarMonths(date, currentDate)
          // if (diff === 1) calendarRef.current?.incrementPage()
          // if (diff === -1) calendarRef.current?.decrementPage()
          
          // const initialIndex = getInitialIndex(date);
          // onPageChangeInitialIndexState$.set(initialIndex);
          // stateNavigator.navigate('pager');
        }}
        selectedDate={selectedDate}
        onPageChange={(date) => {
          // setCurrentDate(date);
          // LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }}
      />
      {/* <View style={styles.controlBar}>
        <TouchableOpacity
          style={styles.incDec}
          onPress={() => calendarRef.current?.decrementPage()}
        >
          <Text>{"<"}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.incDec}
          onPress={() => calendarRef.current?.incrementPage()}
        >
          <Text>{">"}</Text>
        </TouchableOpacity>
      </View> */}
      <View style={{margin: 8, flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
      <Button
        mode="contained"
        onPress={() => {
          router.back();
          
        }}
        style={{ backgroundColor: '#333333' }}
      >
        Cancel
      </Button>
      <Button
        mode="contained"
        onPress={() => {
          if (selectedDate) {
            onDateConfirm(selectedDate);
            router.back();
          }
        }}
        disabled={!selectedDate}
        style={{ backgroundColor: selectedDate ? 'goldenrod' : '#333333' }}
      >
        <Text style={{ color: selectedDate ? 'white' : 'grey' }}>Confirm</Text>
      </Button>
        </View>
    </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { 
    height: "100%",
    width: "100%",
    justifyContent: "center",
  },
  controlBar: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
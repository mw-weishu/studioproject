import { Text, View } from '@/theme/Themed';
import { getAllRepeatingEvents, savedEvents$, schedules$ } from '@/utilities/EventsStore';
import { observable } from '@legendapp/state';
import { observer, Switch } from '@legendapp/state/react';
import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
// import { selectedEventData$, setDefaultEventData } from '../utilities/Events';
// import { setDefaultScheduleData } from '@/utilities/Schedules';
// import BlankRoutineItem from '@/components/items/empty/BlankRoutineItem';
import SavedEventItem from '@/components/items/SavedEventItem';
import ActiveEventItem from '../items/ActiveEventItem';
import ActiveScheduleItem from '../items/ActiveScheduleItem';
// import ScheduleItem from '../items/ScheduleItem';
import SegmentedControl from '../SegmentedControl';

export const listSelection$ = observable(0);
export const itemsSelection$ = observable(0);

const Active = observer(() => {
    return (
        <View>
            <Text style={{textAlign: 'center', fontWeight: 500, fontSize: 20}}>Events</Text>
            <ActiveEvents/>
            <View style={{height: 20}}></View>
            <Text style={{textAlign: 'center', fontWeight: 500, fontSize: 20}}>Schedules</Text>
            <ActiveSchedules/>
        </View>
    )
});

const ActiveEvents = observer(() => {

    const repeatingEvents = getAllRepeatingEvents();

    if (Object.keys(repeatingEvents).length === 0){
        return (
            <View style={{height: 60, justifyContent: 'center'}}>
                <Text style={{textAlign: 'center'}}>Empty. Create new repeating events to fill up this space.</Text>
            </View>
        )
    }
    return (
        <View>
            <ScrollView>
                {repeatingEvents.map((item: any) => (
                    <ActiveEventItem item={item} key={item.id}/>
                ))}
            </ScrollView>
        </View>
    )
});

const ActiveSchedules = observer(() => {
    const schedules = schedules$.schedules.get() || [];

    // this needt to be roeworked
    // const getDaysText = (days: any) => {
    //     const daysLength = Object.keys(days).length;

    //     if (daysLength === 1) {
    //         return '1 day Schedule';
    //     }
    //     else { return `${daysLength} days Schedule`;
    //     }
    // }

    if (Object.keys(schedules).length === 0){
        return (
            <View style={{height: 60, justifyContent: 'center'}}>
                <Text style={{textAlign: 'center'}}>Empty. Create new repeating schedules to fill up this space.</Text>
            </View>
        )
    }
    return (
        <View>
            <ScrollView>
            {schedules.map((schedule: any) => (
                    <ActiveScheduleItem schedule={schedule} key={schedule.id}/>
                ))}
            </ScrollView>
        </View>
    )
});

const InDevelopment = () => {
    return (
        <View style={{justifyContent: 'center', alignItems: 'center', height: 200}}>
            <Text style={{fontSize: 16, color: 'gray'}}>under development</Text>
        </View>
    )
};

const Saved = observer(() => {

    const data = [
        {
            title: 'Events',
            data: savedEvents$.events.get() || {},
        },
        {
            title: 'Schedules',
            data: schedules$.schedules.get() || [],
        }
    ]
    
    const savedEvents = savedEvents$.events.get() || {};
    
    return (
        <View style={{height: '100%'}}>
        <Text style={{textAlign: 'center', fontWeight: 500, fontSize: 20}}>Events</Text>
        {Object.keys(savedEvents).length === 0 ?
        <View style={{height: 60, justifyContent: 'center'}}>
            <Text style={{textAlign: 'center'}}>Empty. Create new saved events to fill up this space.</Text>
        </View>
        :
        <ScrollView style={{flex: 1}}>
            {savedEvents.map((item : any) => (
              <View key={`${item.id} || ${item.modified}`}>
                <SavedEventItem event={item}/>
              </View>
            ))}
            {/* <Text>Saved Schedules:</Text>
            <ActiveSchedules/> */}
        </ScrollView>
}
      </View>
    )
});

const SavedSchedules = observer(() => {
   
  const savedSchedules = schedules$.schedules.get() || [];

    return (
      <View>
        <View>
          {/* <BlankRoutineItem routine={{id: 'r0'}}/> */}
        </View>
        <ScrollView>
          {savedSchedules.map((item : any) => (
            <View key={`${item.id} || ${item.modified}`}>
              {/* <Text>id: {`${item.id} || mod: ${item.modified}`}</Text> */}
              {/* <ScheduleItem schedule={item} /> */}
            </View>
          ))}
        </ScrollView>
      </View>
    )
});
    
const MySaved = observer(() => {
    const [isToggled, setIsToggled] = React.useState(false);

    const [tabIndex, setTabIndex] = React.useState(1);
    const handleListsChange = (index: number) => {
        listSelection$.set(index);
    };
    const handleItemsChange = (index: number) => {
        itemsSelection$.set(index);
    }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <View style={{height: '100%', width: '100%'}}>
        <View>

            <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginBottom: 6}}>
                <SegmentedControl
                tabs={[{icon: 'bookmark', tab: 'Saved'}, {icon: 'update', tab: 'Active'}]}
                currentIndex={listSelection$.get()}
                onChange={(index: any) => handleListsChange(index)}
                segmentedControlBackgroundColor='rgb(69, 69, 112)'
                activeSegmentBackgroundColor='goldenrod'
                activeTextColor='white'
                textColor='white'
                />
            </View>
            <View style={{marginHorizontal: 10}}>
                <View style={{justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                    
                </View>
                <ScrollView
                keyboardShouldPersistTaps='handled' // without this can't press buttons when text input is focused
                scrollEventThrottle={16}
                style={{ height: '100%' }}
                >
                <Switch
                    value={listSelection$.get()}
                    children={{
                        0: () => <Saved/>,
                        1: () => <Active/>,
                        // Pinned: () => <Pinned/>,
                        // History: () => <History/>
                    }}
                />
                </ScrollView>
            </View>
        </View>

    </View>
    </GestureHandlerRootView>
  )
});

export default MySaved;

const styles = StyleSheet.create({
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 5,
    },
    item: {
        padding: 10,
        marginVertical: 5,
        backgroundColor: 'rgb(69, 69, 120)',
        borderRadius: 25,
    },
    collitem: {
        flexDirection: 'row',
        padding: 10,
        marginVertical: 5,
        backgroundColor: 'rgb(69, 69, 120)',
        borderRadius: 15,
        width: '47.3%',
        marginHorizontal: 5,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.3)',
    },
    activebutton: {
        padding: 10,
        marginVertical: 5,
        backgroundColor: 'goldenrod',
        borderRadius: 10,
        width: '48%',
        alignItems: 'center',
        flexDirection: 'row',
    },
    button: {
        padding: 10,
        marginVertical: 5,
        backgroundColor: 'rgb(69, 69, 112)',
        borderRadius: 10,
        width: '48%',
        alignItems: 'center',
        flexDirection: 'row',
    },
});
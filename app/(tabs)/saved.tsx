import MySaved, { listSelection$ } from '@/components/pages/MySaved'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { FAB } from 'react-native-paper'

const saved = () => {

    const [state, setState] = React.useState({ open: false });
          
            const onStateChange = ({ open }: { open: boolean }) => setState({ open });
          
            const { open } = state;

  return (
    <View style={{height: '100%', width: '100%'}}>
      <MySaved />
      <FAB.Group
          style={{ position: 'absolute', bottom: 60, right: 8, borderRadius: 20}}
          fabStyle={{borderRadius: 20, backgroundColor: 'rgba(252, 186, 3, 0.6)'}}
          open={open}
          visible
          key={listSelection$.get() === 0 ? 'saved' : 'active'}
          icon={open ? 'close' : 'plus'}
          actions={
            listSelection$.get() === 0 ?
            [
            {
              icon: 'calendar',
              label: 'Saved Event',
              onPress: () => {
                // setDefaultEventData();
                // selectedEventData$.eventType.set('saved');
                // stateNavigator.navigate('edit-event');
              },
            },
            // {
            //   icon: 'calendar-text',
            //   label: 'Saved Schedule',
            //   onPress: () => {
            //     setDefaultScheduleData();
            //     selectedScheduleData$.scheduleType.set('saved');
            //     selectedScheduleData$.repeats.set(false);
            //     stateNavigator.navigate('edit-schedule');
            //   },
            // },
          ]
          : [
            {
              icon: 'calendar',
              label: 'Repeating Event',
              onPress: () => {
                // setDefaultEventData();
                // selectedEventData$.eventType.set('pager');
                // selectedEventData$.repeats.set(true);
                // stateNavigator.navigate('edit-event');
              },
            },
            {
              icon: 'calendar-text',
              label: 'Repeating Schedule',
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
        />
    </View>
  )
}

export default saved

const styles = StyleSheet.create({})
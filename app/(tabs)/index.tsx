import React from 'react';
import { Platform, StyleSheet } from 'react-native';

// import EditScreenInfo from '@/components/EditScreenInfo';
// import { Text, View } from '@/components/Themed';
import AnimatedIntro from '@/components/AnimatedIntro';
import BottomLoginSheet from '@/components/BottomLoginSheet';
import { initialScheduleIndex$ } from '@/components/edit/Schedule';
import MyPager from '@/components/pages/MyPager';
import { firebase } from '@/firebase.config';
import { setDefaultEventData } from '@/utilities/Events';
import { setDefaultScheduleData } from '@/utilities/Schedules';
import { observer } from '@legendapp/state/react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FAB } from 'react-native-paper';


// const SavedEventItem = React.lazy(() => import('@/components/items/SavedEventItem'));

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const hours = date.getHours();

    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
};

const TabOneScreen = observer(() => {
  const [isSignedIn, setIsSignedIn] = React.useState(false);

  const [state, setState] = React.useState({ open: false });
    
  const onStateChange = ({ open }: { open: boolean }) => setState({ open });

  const { open } = state;

  React.useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      setIsSignedIn(!!user);
      
    });
    return unsubscribe;
  }, []);

  if (!isSignedIn) {
    return (
      <View style={{flex: 1}}>
        <AnimatedIntro />
        <BottomLoginSheet />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={{ height: '100%', width: '100%' }}>
      <MyPager />
      <FAB.Group
                style={styles.fab}
                fabStyle={{borderRadius: 20, backgroundColor: 'rgba(252, 186, 3, 0.6)'}}
                open={open}
                visible
                icon={open ? 'close' : 'plus'}
                actions={[
                  {
                    icon: 'calendar',
                    label: 'Event',
                    onPress: () => {
                      setDefaultEventData();
                      router.navigate('/edit-event');
                    },
                  },
                  {
                    icon: 'calendar-text',
                    label: 'Schedule',
                    onPress: () => {
                      setDefaultScheduleData();
                      initialScheduleIndex$.set(0);
                      router.navigate('/edit-schedule');
                    },
                  },
                ]}
                onStateChange={onStateChange}
                onPress={() => {
                  setState({ open: !open });
                }}
              />
      </View>
    </GestureHandlerRootView>
  );
});

export default TabOneScreen;
const styles = StyleSheet.create({
  fab: Platform.OS === 'web' ? {
    bottom: -6, right: 8, borderRadius: 20,
  }: { bottom: -30, right: 8, borderRadius: 20},
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
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
    backgroundColor: 'lightgray',
    height: 20,
    borderRadius: 100,
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  itemTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  blankItemTitleText: {
    color: 'lightgrey',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

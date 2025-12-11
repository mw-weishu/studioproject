import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

// import EditScreenInfo from '@/components/EditScreenInfo';
// import { Text, View } from '@/components/Themed';
import AnimatedIntro from '@/components/AnimatedIntro';
import BottomLoginSheet from '@/components/BottomLoginSheet';
import { HoldItem } from '@/components/HoldItem';
import CheckoutForm from '@/components/payment-sheet';
import { firebase } from '@/firebase.config';
import { getEventsForDate } from '@/utilities/EventsStore';
import { observer } from '@legendapp/state/react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';


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

const Item = ({event}: {event: any}) => {

  const MenuItems = [
    // { text: 'Actions', icon: 'home', isTitle: true, onPress: () => {} },
    { text: 'Edit', icon: 'edit', onPress: () => {
    //   setEventData(event);
    //   stateNavigator.navigate('edit-event');
    }},
    { text: 'Apply to Dates', icon: 'calendar', withSeparator: true, onPress: () => {
    //   selectedSavedEventData$.set({
    //     ...event,
    //   });
    //   openDate$.case.set('saved-event-apply');
    //   stateNavigator.navigate('calendar');
    }},
    { text: 'Delete', icon: 'trash', isDestructive: true, onPress: () => {
    //   selectedSavedEventData$.set(event);
    //   handleDelete();
    }},
  ];
  
  return (
    <HoldItem
        items={MenuItems}
        activateOn='tap'
        >
        <Pressable onPress={() => void 0} style={styles.item}>
          <View style={styles.itemInner}>
          </View>
          <View style={styles.itemPadding}>
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
           
              <View style={styles.itemPercentageOutlineNonActive}>
                <View>
                  {/* <Text style={!event.blank ? styles.itemTitleText : styles.blankItemTitleText}>xxx</Text> */}
                </View>
              </View>
            </View>
        </View>
          </View>
        </Pressable>
        </HoldItem>
  );
}

const TabOneScreen = observer(() => {
  const [isSignedIn, setIsSignedIn] = React.useState(false);
  
  // Convert object with numeric keys to array
  // const savedEventsObj = savedEvents$.get() || {};
  // const savedEvents = Object.values(savedEventsObj).filter(item => 
  //   typeof item === 'object' && item !== null && 'id' in item
  // );

  const events = getEventsForDate('20251211');

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
    <View style={styles.container}>
      <Text style={styles.title}>Tab One</Text>
      <View style={styles.separator} />
      {/* <EditScreenInfo path="app/(tabs)/index.tsx" /> */}
      <CheckoutForm />
      <HoldItem
        activateOn='tap'
        items={[
          { text: 'explore', onPress: () => {
            router.navigate('/explore');
          }},
          { text: 'account', onPress: () => {
            router.navigate('/account');
          }},
        ]}
      >
        <View style={{ marginHorizontal: 50, borderRadius: 20, padding: 20, backgroundColor: '#ddd' }}>
          <Text>Long press me to see options</Text>
        </View>
      </HoldItem>
      <ScrollView style={{ flex: 1, marginHorizontal: 20 }}>
        <Text style={{color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 10}}>Saved Events ({events.length})</Text>
        {events.length === 0 ? (
          <Text style={{color: 'gray'}}>No saved events.</Text>
        ) : (
          events.map((event: any) => (
            <Item key={event.id} event={event} />
          ))
        )}
      </ScrollView>
    </View>
  );
});

export default TabOneScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // alignItems: 'center',
    // justifyContent: 'center',
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

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HoldItem } from '../HoldItem';

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
};

const SavedEventItem = ({event}: {event: any}) => {
  const MenuItems = [
    { text: 'Edit', icon: 'edit', onPress: () => {
      // TODO: Add edit functionality
    }},
    { text: 'Apply to Dates', icon: 'calendar', withSeparator: true, onPress: () => {
      // TODO: Add apply to dates functionality
    }},
    { text: 'Delete', icon: 'trash', isDestructive: true, onPress: () => {
      // TODO: Add delete functionality
    }},
  ];
  
  return (
    <HoldItem
      items={MenuItems}
      activateOn='tap'
    >
        <View style={styles.itemInner} />
        <View style={styles.itemPadding}>
          <View>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <View style={{ flexDirection: 'row', alignItems: 'center'}}>
                <Text style={!event.blank ? styles.itemTitleText : styles.blankItemTitleText}>
                  {event.title}
                </Text>
              </View>
              <View style={{flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center'}}>
                <Text>{formatTime(event.startDate)} - {formatTime(event.endDate)}</Text>
              </View>
            </View>
            <View style={styles.rowItemsNonActive}>
              <View style={styles.itemPercentageOutlineNonActive}>
                <View />
              </View>
            </View>
          </View>
        </View>
    </HoldItem>
  );
};

export default SavedEventItem;

const styles = StyleSheet.create({
  itemPadding: {
    padding: 20,
  },
  item: {
    margin: 10,
    marginBottom: 0,
    backgroundColor: 'rgba(255, 200, 0, 0.2)',
    borderRadius: 25,
    overflow: 'hidden',
  },
  itemInner: {
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(255, 200, 0, 0.2)',
    borderRadius: 25,
    position: 'absolute',
  },
  rowItemsNonActive: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 0,
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
import { observer } from '@legendapp/state/react';
import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '../../../theme/Themed';
// import { selectedEventData$, setDefaultEventData } from '../../../utilities/Events';
import { TouchableRipple } from 'react-native-paper';

interface ItemProps {
  event: any;
  day: string; 
}

const BlankScheduleEventItem = observer((props: ItemProps) => {
    const {event} = props;
    const {day} = props;

  const itemPressed = useCallback(() => {
    // setDefaultEventData();
    // selectedEventData$.eventType.set('schedule');
    // stateNavigator.navigate('edit-event');
  }, []); 

  return (
    <TouchableRipple onPress={itemPressed} style={styles.blankItem}>
      <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 20}}>+</Text>
      </View>
    </TouchableRipple>
  );
});

export default React.memo(BlankScheduleEventItem);


const styles = StyleSheet.create({
  item: {
    marginVertical: 5,
    padding: 20,
    borderRadius: 25,
    flexDirection: 'row',
  },
  blankItem: {
    marginVertical: 5,
    padding: 16,
    borderRadius: 25,
    backgroundColor: 'rgb(69, 69, 120)'
  },
  rowItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
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
    height: 20, 
    borderRadius: 100,
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
  },
  itemPercentageInner:{
    flexDirection: 'row',
    backgroundColor: 'lightblue',
    height: 20, 
    borderRadius: 50,
  },
  itemAbsoluteInner:{
    paddingRight: 4,
    paddingLeft: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 20, 
    borderRadius: 50,
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
  itemButtonContainer: {
    flex: 1,
    alignItems: 'flex-end'
  },
});
import { Platform, StyleSheet } from 'react-native';
import { View, Text, Pressable } from '../../theme/Themed'
import { View as DefaultView } from 'react-native';
import React, { useCallback } from 'react'
import { observer } from '@legendapp/state/react';
import { observable } from '@legendapp/state';
import { Button, Divider, Icon, Menu } from 'react-native-paper';
import { openDate$, openTime$ } from '../../utilities/Pickers';
// import { selectednotificationData$, setDefaultnotificationData, setnotificationData } from '../../utilities/notifications';
import { TextInput } from 'react-native-paper'
import { ScrollView } from 'react-native-gesture-handler';
import { stateNavigator } from '../../nav/stateNavigator';
import { setScheduleData } from '../../utilities/Schedules';

const fosusedOnNotification = observable(null);

interface ItemProps {
  notification: any;
}

// const unselect = () => {
//   selectedNotificationData$.id.set(null);
// }

const formatTime = (selectedTime: Date) => {
    if (!(selectedTime instanceof Date)) {
      selectedTime = new Date(selectedTime);
    }
    const formattedTime = selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return formattedTime;
  };

const formatRemainingTime = (remainingTime: number) => {
  const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
  const hours = Math.floor(remainingTime / (1000 * 60 * 60));
  const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

  if (remainingTime < 60000) {
    return `Ends in ${seconds}sec`;
  } else if (remainingTime < 3600000) {
    return `Ends in ${minutes}min`;
  } else if (remainingTime < 86400000){
    return `Ends in ${hours}h ${minutes}min`;
  } else if (remainingTime < 172800000){
    return `Ends in ${days} day ${hours}h`;
  } else if (remainingTime < 259200000){
    return `Ends in ${days} days ${hours}h`;
  }

};

const formatChronometerTime = (remainingTime: number) => {
  const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

  if (remainingTime < 60000) {
    return `00:${seconds < 10 ? '0' + seconds : seconds}`;
  } else if (remainingTime < 3600000) {
    return `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  } else if (remainingTime < 86400000){
    return `${hours}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  } else {
    return `${days}d ${hours}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  }

}

const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const checkRepetition = (repeatKey: string) => {
    if (repeatKey.startsWith('every')) {
        // 'every1d', 'every2m', etc.
        const unit = repeatKey.slice(-1); // 'd' or 'm'
        const frequency = parseInt(repeatKey.slice(5, -1), 10); // '1' or '2'
        const unitName = unit === 'd' ? 'day' : 'month';
        return `Repeats every ${frequency > 1 ? frequency + ' ' : ''}${unitName}${frequency > 1 ? 's' : ''}`;
    } else if (repeatKey.startsWith('weekdays')) {
        // 'weekdays1235`, 'weekdays135' 1 = MON, 2 = TUE, 3 = WED, 4 = THU, 5 = FRI, 6 = SAT, 7 = SUN
        const days = repeatKey.slice(8).split('').map(Number); // ['1', '2', '3', '5']
        const dayNames = days.map((day: number) => weekdays[day - 1]).join(' ');
        return `Repeats on ${dayNames}`;
    }
}

const Selected = observer((notificationProps: ItemProps) => {
  // const {date} = notificationProps;
  const {notification} = notificationProps;

  // const now = new Date();
  // const totalTime = notification.endDate.getTime() - notification.startDate.getTime();
  // const timePassed = now.getTime() - notification.startDate.getTime();
  // const remainingTime = notification.endDate.getTime() - now.getTime();
  // const percentage= Math.min((timePassed / totalTime) * 100, 100);
  
  // const isActivenotification = now >= notification.startDate && now <= notification.endDate;

  // const noMidnight = notification.endDate.getHours() !== 0 && notification.endDate.getMinutes() !== 0;
  // // check in how many days the notification ends
  // const daysToEnd = noMidnight ? notification.endDate.getDate() - date.getDate() : notification.endDate.getDate() - date.getDate() - 1;

  return (
    <View>
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          {/* {notification.repeats ?
          <View style={{marginRight: 2}}>
          <Icon source={'update'} size={20} color="white"/>
          </View>
          : null} */}
          <Text style={!notification.blank ? styles.itemTitleText : styles.blankItemTitleText}>{notification.title}</Text>
        </View>
        <View style={{flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center'}}>
          <Text>{notification.subtitle}</Text>
        
        
        {/* <Pressable onPress={() => fosusedOnNotification.set(null)} style={{marginLeft: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '50%'}}>
          <Icon source={'chevron-up'} size={24} color="white"/>
        </Pressable> */}
          </View>
      </View>
      <View style={styles.rowItems}>
        <Text >{notification.body}</Text>
      </View>
    </View>
  );
});

const NotSelected = observer((notificationProps: ItemProps) => {
  // const {date} = notificationProps;
  const {notification} = notificationProps;

  // const now = new Date();
  // const totalTime = notification.endDate.getTime() - notification.startDate.getTime();
  // const timePassed = now.getTime() - notification.startDate.getTime();
  // const remainingTime = notification.endDate.getTime() - now.getTime();
  // const percentage= Math.min((timePassed / totalTime) * 100, 100);
  
  // const isActivenotification = now >= notification.startDate && now <= notification.endDate;

  // const noMidnight = notification.endDate.getHours() !== 0 && notification.endDate.getMinutes() !== 0;
  // // check in how many days the notification ends
  // const daysToEnd = noMidnight ? notification.endDate.getDate() - date.getDate() : notification.endDate.getDate() - date.getDate() - 1;

  return (
    <View>
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          {/* {notification.repeats ?
          <View style={{marginRight: 2}}>
          <Icon source={'update'} size={20} color="white"/>
          </View>
          : null} */}
          <Text style={!notification.blank ? styles.itemTitleText : styles.blankItemTitleText}>{notification.title}</Text>
        </View>
        <View style={{flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center'}}>
          <Text>{notification.subtitle}</Text>
        
        
        {/* <Pressable onPress={() => fosusedOnNotification.set(notification.id)} style={{marginLeft: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '50%'}}>
          <Icon source={'chevron-down'} size={24} color="white"/>
        </Pressable> */}
          </View>
      </View>
        <View style={styles.rowItemsNonActive}>
        </View>
    </View>
  );
});

const Item = observer((notificationProps: ItemProps) => {
  // const {date} = notificationProps;
  const {notification} = notificationProps;
  const [menuVisible, setMenuVisible] = React.useState(false);

  const itemPressed = useCallback(() => {
    
  }, []);

  // const now = new Date();
  // const isActivenotification = now >= notification.startDate && now <= notification.endDate;

  // const totalTime = notification.endDate.getTime() - notification.startDate.getTime();
  // const timePassed = now.getTime() - notification.startDate.getTime();
  // const remainingTime = notification.endDate.getTime() - now.getTime();
  // const percentage= -Math.min((remainingTime / totalTime) * 100, 100);
  
  return (
      <Pressable onLongPress={() => void 0} onPress={itemPressed} style={!notification.blank ? styles.item : styles.blankItem}>
    {/* <Pressable onLongPress={() => setMenuVisible(true)} onPress={itemPressed} style={!notification.blank ? styles.item : styles.blankItem}> */}
      {/* <View style={isActivenotification && !notification.blank ? [styles.itemInner, { left: `${percentage}%` }] : isActivenotification ? [styles.blankItemInner, { left: `${percentage}%` } ] : {}}>
      </View> */}
      <View style={{paddingVertical: 20, paddingHorizontal: 14,}}>
        {fosusedOnNotification.get() === notification.id ? <Selected notification={notification} /> : <NotSelected notification={notification} />}
      </View>
      <View style={{justifyContent: 'flex-end', alignItems: 'flex-end', paddingRight: 10}}> 
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          mode='elevated'
          elevation={5}
          anchorPosition='bottom'
          anchor={<View style={{width: 1, height: 1}} />}
        >
          {notification.blank ?
          
          <Menu.Item leadingIcon='plus' onPress={() => {setMenuVisible(false); itemPressed()}} title="New notification" />
          
          :
          <View>
          <Text style={{padding: 10, fontSize: 16, fontWeight: 'bold'}}>{notification.title}</Text>
          <Divider />
          <Menu.Item leadingIcon='pencil' onPress={() => {setMenuVisible(false); itemPressed()}} title="Edit" />
          {/* <Menu.Item leadingIcon='cancel' onPress={() => deletenotification(notification)} title="Delete" /> */}
            </View>
          }
          </Menu>
        </View>
    </Pressable>
        
  );
});

export default React.memo(Item);


const styles = StyleSheet.create({
  item: {
    margin: 10,
    marginBottom: 0,
    backgroundColor: 'rgba(255, 200, 0, 0.4)',
    borderRadius: 25,
    // position: 'relative', ???
    overflow: 'hidden',
  },
  itemInner: {
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(255, 200, 0, 0.8)',
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
    // backgroundColor: 'lightgray',
    height: 20, 
    borderRadius: 100,
    justifyContent: 'center',
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
});
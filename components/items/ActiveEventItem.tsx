import { observer } from '@legendapp/state/react';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '../../theme/Themed';
import { HoldItem } from '../HoldItem';
import ToggleSwitch from '../ToggleSwitch';
// import { handleDeleteEvent, handleToggleEvent, selectedEventData$, setEventData } from '../../utilities/Events';
// import { formatTime } from '../../utilities/Pickers';
// import { handleAdd, selectedSavedEventData$ } from '../../utilities/SEvents';

const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface EventProps {
    item: any;
}

const ActiveEventItem = observer((props: EventProps) => {

    const {item} = props;

    const EventItems = [
    // { text: 'Actions', icon: 'home', isTitle: true, onPress: () => {} },
    { text: 'Edit', icon: 'edit', onPress: () => {
        // setEventData(item);
        // stateNavigator.navigate('edit-event')
    }},
    { text: 'Add to Saved', icon: 'save', withSeparator: true, onPress: () => {
        // selectedSavedEventData$.set(item);
        // handleAdd();
    }},
    { text: 'Delete', icon: 'trash', isDestructive: true, onPress: () => {
        // console.log('event type: ', event.eventType);
        // selectedEventData$.set(item);
        // handleDeleteEvent(item);
    }},
    ];

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

  return (
    <HoldItem
    items={EventItems}
    activateOn='tap'
    >
    <View
    key={`${item.id}`}
    style={styles.item}
    >
        <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{formatTime(item.startDate)} - {formatTime(item.endDate)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <Text style={styles.subtitle}>{checkRepetition(item.repeatKey)}</Text>
                <ToggleSwitch
                    isOn={item.on}
                    onToggle={
                        () => void 0
                            // handleToggleEvent(item)
                    }
                    width={54}
                    height={40}
                    onBackgroundColor="goldenrod"
                    offBackgroundColor="rgb(69, 69, 112)"
                    circleColor="rgba(255, 255, 255, 0.8)"
                    activeTextColor="#aaaaaa"
                    inactiveTextColor="rgba(255, 255, 255, 0.5)"
                    onText="ON"
                    offText="OFF"
                    />
            </View>
        </View>
    </View>
    </HoldItem>
  )
});

export default ActiveEventItem

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
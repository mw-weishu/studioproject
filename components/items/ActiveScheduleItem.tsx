import { observer } from '@legendapp/state/react';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '../../theme/Themed';
// import { handleDelete, handleToggleSchedule, selectedScheduleData$, setScheduleData } from '../../utilities/Schedules';
import { HoldItem } from '../HoldItem';
import ToggleSwitch from '../ToggleSwitch';

interface ScheduleProps {
    schedule: any;
}

const ActiveScheduleItem = observer((props: ScheduleProps) => {
    const {schedule} = props;

    const EventItems = [
        // { text: 'Actions', icon: 'home', isTitle: true, onPress: () => {} },
        { text: 'Edit', icon: 'edit', onPress: () => {
            // setScheduleData(schedule)
            // stateNavigator.navigate('edit-schedule')
        }},
        // { text: 'Add to Saved', icon: 'save', withSeparator: true, onPress: () => {
            
        // }},
        { text: 'Delete', icon: 'trash', isDestructive: true, onPress: () => {
            // setScheduleData(schedule);
            // handleDelete();
        }},
        ];

    const getRepeatText = (number: number) => {
            if (number === 1) {
                return 'Repeats every day';
            }
            return `Repeats every ${number} days`;
        }

  return (
    <HoldItem
    items={EventItems}
    activateOn='tap'
    >
    <View
        key={`${schedule.id}`}
        style={styles.item}
    >
        <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between'}}>
                <Text style={styles.title}>{schedule.title}</Text>
                {/* <Text style={styles.subtitle}>{getDaysText(schedule.days)}</Text> */}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' , alignItems: 'center'}}>
                <View>
                    <Text style={styles.subtitle}>{getRepeatText(schedule.repeatRule.regular.number)}</Text>
                </View>
                <ToggleSwitch
                    isOn={schedule.on}
                    onToggle={() => void 0
                        // handleToggleSchedule(schedule)
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
})

export default ActiveScheduleItem;

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
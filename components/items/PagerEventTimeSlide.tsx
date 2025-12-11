import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ItemProps {
  event: any;
}

const ensureDate = (value: any) => (value instanceof Date ? value : new Date(value));

const PagerEventTimeSlide = (props: ItemProps) => {
    const {event} = props;
    
  const [currentTime, setCurrentTime] = React.useState(new Date());

    // Normalize dates in case the observable stores them as strings
    const startDate = React.useMemo(() => ensureDate(event.startDate), [event.startDate]);
    const endDate = React.useMemo(() => ensureDate(event.endDate), [event.endDate]);

    const now = currentTime;
    const isActiveEvent = now >= startDate && now <= endDate;

    const totalTime = endDate.getTime() - startDate.getTime();
    const timePassed = now.getTime() - startDate.getTime();
    const remainingTime = endDate.getTime() - now.getTime();
    const percentage= -Math.min((remainingTime / totalTime) * 100, 100);

    
    React.useEffect(() => {
        
        const interval = setInterval(() => {
          setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
      }, []);
  return (
    <View style={isActiveEvent && !event.blank ? [styles.itemInner, { left: `${percentage}%` }] : isActiveEvent ? [styles.blankItemInner, { left: `${percentage}%` } ] : {}}>
    </View>
  )
}

export default PagerEventTimeSlide

const styles = StyleSheet.create({
    itemInner: {
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(255, 200, 0, 0.8)',
    borderRadius: 25,
    position: 'absolute',
  },
  blankItemInner: {
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(69, 69, 112, 0.6)',
    borderRadius: 25,
    position: 'absolute',
  },
})
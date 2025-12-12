import React from 'react';
import { StyleSheet } from 'react-native';
import { Icon } from 'react-native-paper';
import { Pressable, View } from '../../theme/Themed';

interface FloatingIconsProps {
  event: any;
}

export const FloatingIcons = React.memo(({ event }: FloatingIconsProps) => {
  if (event.blank) return null;

  return (
    <View style={styles.floatingIconsContainer}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {event.pinned && (
          <Pressable
            style={[
              styles.floatingIconStart,
              { transform: [{ rotate: '-45deg' }] },
            ]}
            onPress={() => void 0}
          >
            <Icon source={'pin'} size={20} color="white" />
          </Pressable>
        )}
        {event.saved && (
          <Pressable style={styles.floatingIconStart} onPress={() => void 0}>
            <Icon source={'bookmark'} size={20} color="white" />
          </Pressable>
        )}
        {(event.repeats || event.eventType === 'schedule') && (
          <Pressable style={styles.floatingIconStart} onPress={() => void 0}>
            <Icon source={'update'} size={20} color="white" />
          </Pressable>
        )}
      </View>
      <View>
        {event.notification && (
          <Pressable style={styles.floatingIconEnd} onPress={() => void 0}>
            <Icon source={'bell-ring'} size={20} color="white" />
          </Pressable>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  floatingIconsContainer: {
    position: 'absolute',
    top: 4,
    left: 10,
    right: 10,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  floatingIconStart: {
    height: 24,
    width: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgb(160, 120, 0)',
    borderRadius: 12,
    marginRight: 2,
  },
  floatingIconEnd: {
    height: 24,
    width: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgb(160, 120, 0)',
    borderRadius: 12,
  },
});

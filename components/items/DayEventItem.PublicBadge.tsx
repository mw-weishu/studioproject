import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '../../theme/Themed';

interface PublicBadgeProps {
  event: any;
}

export const PublicBadge = React.memo(({ event }: PublicBadgeProps) => {
  if (event.blank || event.eventType !== 'public') return null;

  return (
    <View style={styles.floatingIconsContainerBottom}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
      </View>
      <View>
        <Text
          style={{
            color: 'white',
            fontWeight: 'bold',
            backgroundColor: 'goldenrod',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 10,
          }}
        >
          public
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  floatingIconsContainerBottom: {
    position: 'absolute',
    bottom: -6,
    left: 10,
    right: 10,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

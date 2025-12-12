import * as FileSystem from 'expo-file-system';
import React, { useEffect, useState } from 'react';
import { View as DefaultView, Image, StyleSheet } from 'react-native';
import { Text, View } from '../../theme/Themed';
import PagerEventTimeSlide from './PagerEventTimeSlide';

const formatTime = (selectedTime: Date) => {
  if (!(selectedTime instanceof Date)) {
    selectedTime = new Date(selectedTime);
  }
  const formattedTime = selectedTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  return formattedTime;
};

interface EventContentProps {
  event: any;
}

export const EventContent = React.memo(({ event }: EventContentProps) => {
  const [localExists, setLocalExists] = useState(false);
  const [remoteExists, setRemoteExists] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const checkImages = async () => {
      try {
        const localUri = event.image;
        const remoteUrl = event.imageUrl;
        if (localUri && localUri.startsWith('file://')) {
          try {
            const info = await FileSystem.getInfoAsync(localUri);
            if (!cancelled) setLocalExists(!!info.exists);
          } catch {
            if (!cancelled) setLocalExists(false);
          }
        }
        if (remoteUrl && !localExists) {
          try {
            await Image.prefetch(remoteUrl);
            if (!cancelled) setRemoteExists(true);
          } catch {
            if (!cancelled) setRemoteExists(false);
          }
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    checkImages();
    return () => {
      cancelled = true;
    };
  }, [event.image, event.imageUrl]);

  const displayUri = localExists ? event.image : remoteExists ? event.imageUrl : null;
  const expectImage = !!(event.image || event.imageUrl);
  const now = new Date();
  const isActiveEvent = now >= event.startDate && now <= event.endDate;

  return (
    <View style={!event.blank ? styles.item : styles.blankItem}>
      <View>
        <PagerEventTimeSlide event={event} />
          <View style={{ paddingVertical: 20, paddingHorizontal: 14 }}>
            <View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text
                    style={
                      !event.blank
                        ? styles.itemTitleText
                        : styles.blankItemTitleText
                    }
                  >
                    {event.title}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                  }}
                >
                  <Text>
                    {formatTime(event.startDate)} - {formatTime(event.endDate)}
                  </Text>
                </View>
              </View>
              <View style={styles.rowItemsNonActive}>
                <DefaultView
                  style={
                    isActiveEvent
                      ? styles.itemPercentageOutline
                      : styles.itemPercentageOutlineNonActive
                  }
                >
                  <DefaultView />
                </DefaultView>
              </View>
              {event.description !== '' && <Text>{event.description}</Text>}
              {expectImage &&
                (displayUri && !checking && !imageError ? (
                  <Image
                    source={{ uri: displayUri }}
                    style={styles.image}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <View style={styles.imagePlaceholder} />
                ))}
            </View>
          </View>
        </View>
    </View>
  );
});

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 200,
    marginTop: 10,
    borderRadius: 15,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    marginTop: 10,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  item: {
    margin: 10,
    marginBottom: 0,
    backgroundColor: 'rgba(255, 200, 0, 0.4)',
    borderRadius: 25,
    overflow: 'hidden',
  },
  blankItem: {
    margin: 10,
    marginBottom: 0,
    backgroundColor: 'rgba(69, 69, 112, 0.6)',
    borderRadius: 25,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  rowItemsNonActive: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 0,
  },
  itemPercentageOutline: {
    width: '100%',
    marginTop: 5,
    height: 20,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  itemPercentageOutlineNonActive: {
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
    fontSize: 16,
  },
  blankItemTitleText: {
    color: 'lightgrey',
    marginLeft: 0,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

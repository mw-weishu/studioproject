import { observer } from "@legendapp/state/react";
import React from "react";
import { StyleSheet } from "react-native";
import { Text, View } from "../../theme/Themed";

interface ItemProps {
  event: any;
}

const formatTime = (selectedTime: any): string => {
  const d = selectedTime instanceof Date ? selectedTime : new Date(selectedTime);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const Item = observer(({ event }: ItemProps) => {
  if (!event || event.blank) return null;
  return (
    <View style={styles.item}>
      <Text style={styles.title}>{event.title}</Text>
      {event.startDate && event.endDate && (
        <Text style={styles.time}>
          {formatTime(event.startDate)} – {formatTime(event.endDate)}
        </Text>
      )}
      {event.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {event.description}
        </Text>
      ) : null}
    </View>
  );
});

export default React.memo(Item);

const styles = StyleSheet.create({
  item: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#1c1c1e",
    marginVertical: 4,
    marginHorizontal: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  time: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    color: "#ccc",
    marginTop: 4,
  },
});

// Schedule edit removed in Findora
import { observable } from "@legendapp/state";
import React from "react";
import { View, Text } from "../../theme/Themed";

export const initialScheduleIndex$ = observable(0);
export const onPageChangeInitialScheduleIndexState$ = observable(0);

export default function ScheduleForm() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Schedules are not available in Findora.</Text>
    </View>
  );
}

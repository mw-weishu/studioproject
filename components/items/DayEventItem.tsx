import { observer } from "@legendapp/state/react";
import React from "react";
import { View } from "../../theme/Themed";
import { EventContent } from "./DayEventItem.EventContent";

interface ItemProps {
  event: any;
}

const Item = observer((eventProps: ItemProps) => {
  const { event } = eventProps;
  return (
    <View style={{ position: "relative" }}>
      <EventContent event={event} />
    </View>
  );
});

export default React.memo(Item);

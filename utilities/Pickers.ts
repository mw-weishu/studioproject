import { observable } from "@legendapp/state";
import { selectedEventData$ } from "./Events";
import { handleApply, selectedRoutineData$ } from "./Routines";
import { handleApplySavedEvent, selectedSavedEventData$ } from "./Saved";
import { selectedScheduleData$ } from "./Schedules";

export const formatTime = (selectedTime: any) => {
  if (!(selectedTime instanceof Date)) {
    selectedTime = new Date(selectedTime);
  }
  const formattedTime = selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return formattedTime;
};

export const formatDate = (selectedDate: any) => {
  if (!(selectedDate instanceof Date)) {
    selectedDate = new Date(selectedDate);
  }
  const monthName = selectedDate.toLocaleDateString(['en'], {month: 'short'});
  const day = selectedDate.toLocaleDateString(['en'], {day: 'numeric'});
  const dayName = day + (['st', 'nd', 'rd'][((day as any) % 10) - 1] || 'th');
  return `${monthName} ${dayName}`;
}

export const openTime$ = observable({
  open: false,
  case: '',
  time: new Date(),
});

export const openDate$ = observable({
  open: false,
  case: '',
  date: new Date(),
});

// export const onDateConfirm = (date: Date) => {
//   date.setUTCSeconds(0);
//   date.setUTCMilliseconds(0);
//   switch (openDate$.case.get()) {
//     case 'startend-oneday':
//         const startHours = selectedEventData$.startDate.get()
//         const endHours = selectedEventData$.endDate.get()

//         const startDate = new Date(date);
//         const endDate = new Date(date);
//         startDate.setUTCHours(startHours.getUTCHours(), startHours.getUTCMinutes(), 0, 0);
//         endDate.setUTCHours(endHours.getUTCHours(), endHours.getUTCMinutes(), 0, 0);

//         // midnight case
//         if (endDate.getHours() === 0 && endDate.getMinutes() === 0) {
//           endDate.setUTCDate(endDate.getUTCDate() + 1);
//         }
//         selectedEventData$.startDate.set(startDate);
//         selectedEventData$.endDate.set(endDate);
//         break;
//     case 'start':
//         selectedEventData$.startDate.set(date);
//         console.log('Start Date: ', selectedEventData$.startDate.get());
//         break;
//     case 'end':
//         selectedEventData$.endDate.set(date);
//         break;
//     case 'schedule-apply':
//         selectedRoutineData$.applydate.set(date);
//         handleApply();
//         selectedRoutineData$.id.set(null);
//         break;
//     case 'saved-event-apply':
//         selectedSavedEventData$.applydate.set(date);
//         handleApplySavedEvent();
//         selectedSavedEventData$.id.set(null);
//         break;
//     default:
//         break;
//   }
//   openDate$.open.set(false);
// };

export const onDateConfirm = (date: Date) => {
  // Create a new date to avoid mutating the original
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  switch (openDate$.case.get()) {
    case 'startend-oneday':
        const startHours = selectedEventData$.startDate.get()
        const endHours = selectedEventData$.endDate.get()

        const startDate = new Date(localDate);
        const endDate = new Date(localDate);
        
        // Use local time methods instead of UTC to avoid timezone issues
        startDate.setHours(startHours.getHours(), startHours.getMinutes(), 0, 0);
        endDate.setHours(endHours.getHours(), endHours.getMinutes(), 0, 0);

        // midnight case
        if (endDate.getHours() === 0 && endDate.getMinutes() === 0) {
          endDate.setDate(endDate.getDate() + 1);
        }
        selectedEventData$.startDate.set(startDate);
        selectedEventData$.endDate.set(endDate);
        break;
    case 'start':
        selectedEventData$.startDate.set(localDate);
        console.log('Start Date: ', selectedEventData$.startDate.get());
        break;
    case 'end':
        selectedEventData$.endDate.set(localDate);
        break;
    case 'schedule-start':
        selectedScheduleData$.startDate.set(localDate);
        break;
    case 'schedule-apply':
        selectedRoutineData$.applydate.set(localDate);
        handleApply();
        selectedRoutineData$.id.set(null);
        break;
    case 'saved-event-apply':
        handleApplySavedEvent(localDate);
        selectedSavedEventData$.id.set(null);
        break;
    default:
        break;
  }
  openDate$.open.set(false);
};

export const onTimeConfirm = (date: Date) => {
  const baseMidnight = openTime$.time.get().getHours() === 0 && openTime$.time.get().getMinutes() === 0;

  let someDate = new Date(date);
  someDate.setUTCHours(date.getUTCHours());
  someDate.setUTCMinutes(date.getUTCMinutes());
  someDate.setUTCSeconds(0);
  someDate.setUTCMilliseconds(0);
  switch (openTime$.case.get()) {
    case 'start':
      selectedEventData$.startDate.set(someDate);
      break;
    case 'end':
      if (baseMidnight && !(someDate.getHours() === 0 && someDate.getMinutes() === 0)) {
        someDate.setUTCDate(someDate.getUTCDate() - 1);
      }
      else if (!baseMidnight && someDate.getHours() === 0 && someDate.getMinutes() === 0) {
        someDate.setUTCDate(someDate.getUTCDate() + 1);
      }
      selectedEventData$.endDate.set(someDate);
      break;
    case 'saved-event-start':
      selectedSavedEventData$.startDate.set(someDate);
      break;
    case 'saved-event-end':
      if (baseMidnight && !(someDate.getHours() === 0 && someDate.getMinutes() === 0)) {
        someDate.setUTCDate(someDate.getUTCDate() - 1);
      }
      else if (!baseMidnight && someDate.getHours() === 0 && someDate.getMinutes() === 0) {
        someDate.setUTCDate(someDate.getUTCDate() + 1);
      }
      selectedSavedEventData$.endDate.set(someDate);
      break;
    default:
        break;
  }
  openTime$.open.set(false);
};
import { observable } from "@legendapp/state";
import { firebase } from "../firebase.config";
import { BaseEvent, RepeatRule, deleteEvent, deleteRepeatingEvent, formatRepeatKey, getEventID, getRepeatingEventID, getScheduleEventID, getScheduleID, saveEvent, saveRepeatingEvent } from "./EventsStore";
import { deleteEventImage, uploadEventImage } from "./ImageUpload";
// import { cancelNotification, scheduleMultipleNotifications, scheduleMultipleRepeatingNotifications, scheduleSingleNotification } from "./Notifications";
import { selectedScheduleData$ } from "./Schedules";

export const pagerDateData$ = observable({
    baseStartDate: new Date(0),
    baseEndDate: new Date(0),
    currentScreenStartDate: new Date(0),
    currentScreenEndDate: new Date(0),
});


const normalizeRepeatRule = (rule: any): RepeatRule => {
    const asRule = rule ?? {};
    const baseRule: RepeatRule['rule'] = asRule.rule === 'weekdays' ? 'weekdays' : 'regular';
    const numRaw = asRule?.regular?.number ?? '1';
    const num = typeof numRaw === 'string' ? parseInt(numRaw, 10) : numRaw ?? 1;
    const unitRaw = asRule?.regular?.unit ?? 'd';
    const unitChar = typeof unitRaw === 'string' ? unitRaw.charAt(0) : unitRaw;
    const unit: 'd' | 'm' | 'y' = unitChar === 'm' ? 'm' : unitChar === 'y' ? 'y' : 'd';
    return {
        rule: baseRule,
        regular: { number: num, unit },
        weekdays: asRule.weekdays || {},
    };
};

export const selectedEventData$ = observable({
    id: null,
    title: '',
    description: '',
    imageUrl: '',
    image: null as string | null,
    blank: false,
    eventType: 'pager',
    modified: new Date(0),
    fullDay: false,

    startDate: new Date(new Date().setHours(0, 0, 0, 0)),
    endDate: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(0, 0, 0, 0)),
    
    on: true,
    notification: true,
    repeats: false,
    // these need to be put inside the repeatRule
    // starts: true,
    repeatKey: 'none',
    ends: false,
    endAfter: new Date(0),
    
    repeatRule: {
        rule: 'regular',
        regular: {
            number: '1',
            unit: 'days',
        },
        weekdays: {
            monday: {i: 1, active: false, startDate: undefined, endDate: undefined},
            tuesday: {i: 2, active: false, startDate: undefined, endDate: undefined},
            wednesday: {i: 3, active: false, startDate: undefined, endDate: undefined},
            thursday: {i: 4, active: false, startDate: undefined, endDate: undefined},
            friday: {i: 5, active: false, startDate: undefined, endDate: undefined},
            saturday: {i: 6, active: false, startDate: undefined, endDate: undefined},
            sunday: {i: 7, active: false, startDate: undefined, endDate: undefined},
        },
    },
    advancedRules: {
        timeZone: { // Locked to UTC or not
            on: false,
        },
        DST: { // Daylight Saving Time
            on: false,
        },
    },
    // notification: false,
});

export const setDefaultEventData = (event?: any) => {
    selectedEventData$.set({
    id: null,
    title: '',
    description: '',
    imageUrl: '',
    image: null,
    blank: false,
    eventType: 'pager',
    modified: new Date(0),
    fullDay: false,

    startDate: event ? event.startDate : new Date(new Date().setHours(0, 0, 0, 0)),
    endDate: event ? event.endDate : new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(0, 0, 0, 0)),
    
    on: true,
    notification: true,
    repeats: false,
    // these need to be put inside the repeatRule
    // starts: true,
    repeatKey: 'none',
    ends: false,
    endAfter: new Date(0),
    
    repeatRule: {
        rule: 'regular',
        regular: {
            number: '1',
            unit: 'days',
        },
        weekdays: {
            monday: {i: 1, active: false, startDate: undefined, endDate: undefined},
            tuesday: {i: 2, active: false, startDate: undefined, endDate: undefined},
            wednesday: {i: 3, active: false, startDate: undefined, endDate: undefined},
            thursday: {i: 4, active: false, startDate: undefined, endDate: undefined},
            friday: {i: 5, active: false, startDate: undefined, endDate: undefined},
            saturday: {i: 6, active: false, startDate: undefined, endDate: undefined},
            sunday: {i: 7, active: false, startDate: undefined, endDate: undefined},
        },
    },
    advancedRules: {
        timeZone: { // Locked to UTC or not
            on: false,
        },
        DST: { // Daylight Saving Time
            on: false,
        },
    },
    // notification: false,
    });
}

export const setEventData = (event: any) => {
    selectedEventData$.id.set(event.id);
    selectedEventData$.title.set(event.title);
    selectedEventData$.description.set(event.description);
    selectedEventData$.imageUrl.set(event.imageUrl);
    selectedEventData$.image.set(event.image);
    selectedEventData$.startDate.set(event.startDate);
    selectedEventData$.endDate.set(event.endDate);
    selectedEventData$.blank.set(event.blank);
    selectedEventData$.eventType.set(event.eventType);
    selectedEventData$.fullDay.set(event.fullDay);
    // selectedEventData$.starts.set(event.starts);
    selectedEventData$.ends.set(event.ends);
    selectedEventData$.endAfter.set(event.endAfter);
    selectedEventData$.on.set(event.on);
    selectedEventData$.repeats.set(event.repeats);
    selectedEventData$.repeatKey.set(event.repeatKey);
    selectedEventData$.repeatRule.set(event.repeatRule);
    // selectedEventData$.advancedRules.timeZone.on.set(event.advancedRules.timeZone.on);
    // selectedEventData$.advancedRules.DST.on.set(event.advancedRules.DST.on);
}

export const handleSaveEvent = async () => {
    console.log('handle save start');
    if (selectedEventData$.startDate.get() > selectedEventData$.endDate.get()) {
        alert("Start time is later than end time.");
        return;
    }
    console.log('Repeats: ', selectedEventData$.repeats.get());
    const userId = firebase.auth().currentUser?.uid || 'unknown';
    const localImage = selectedEventData$.image.get();
    let imageUrl = selectedEventData$.imageUrl.get();

    if (selectedEventData$.repeats.get() === false) {
        const eventId = getEventID(selectedEventData$.startDate.get());
        if (localImage && !imageUrl) {
            try {
                imageUrl = await uploadEventImage(localImage, eventId, userId);
                selectedEventData$.imageUrl.set(imageUrl);
            } catch (e) {
                console.log('Image upload failed (save single):', e);
            }
        }
        const newEvent: BaseEvent = {
            ...selectedEventData$.get(),
            id: eventId,
            eventType: 'pager',
            imageUrl,
            modified: new Date(),
        } as any;
        saveEvent(newEvent as any);
        // scheduleMultipleNotifications();
    } else if (selectedEventData$.repeats.get() === true) {
        const normalizedRule = normalizeRepeatRule(selectedEventData$.repeatRule.get());
        const repeatKey = formatRepeatKey(normalizedRule);
        const repeatingId = getRepeatingEventID(repeatKey);
        if (localImage && !imageUrl) {
            try {
                imageUrl = await uploadEventImage(localImage, repeatingId, userId);
                selectedEventData$.imageUrl.set(imageUrl);
            } catch (e) {
                console.log('Image upload failed (save repeating):', e);
            }
        }
        const newRepeatingEvent = {
            ...selectedEventData$.get(),
            id: repeatingId,
            imageUrl,
            modified: new Date(),
            eventType: 'pager',
            repeatKey: repeatKey,
            repeatRule: normalizedRule,
        };
        saveRepeatingEvent(newRepeatingEvent as any);
        // scheduleMultipleRepeatingNotifications();
    }
};

export const handleAddScheduleEvent = (day: number) => {
    const scheduleID = selectedScheduleData$.id.get() ?selectedScheduleData$.id.get() : getScheduleID();
  const newEvent = {
    ...selectedEventData$.get(),
    id: getScheduleEventID(scheduleID, day),
        eventType: 'schedule' as const,
    modified: new Date(),
  };
  const days = selectedScheduleData$.days.get();
  const dayEvents = days[day];
  if (Array.isArray(dayEvents)) {
    days[day] = [...dayEvents, newEvent];
  } else {
    days[day] = [newEvent];
  }
  selectedScheduleData$.days.set(undefined);
  selectedScheduleData$.days.set(days);
}

export const handleModifyEvent = async (event: any) => {
    if (selectedEventData$.startDate.get() > selectedEventData$.endDate.get()) {
        alert("Start time is later than end time.");
        return;
    }
    const userId = firebase.auth().currentUser?.uid || 'unknown';
    const localImage = selectedEventData$.image.get();
    let imageUrl = selectedEventData$.imageUrl.get();
    const previousImageUrl = event.imageUrl;
    const newImageSelected = localImage && previousImageUrl && localImage !== previousImageUrl;

    if (event.repeatKey === 'none') {
        if (selectedEventData$.repeats.get() === false) {
            const newId = getEventID(selectedEventData$.startDate.get());
            if (newImageSelected) {
                try { await deleteEventImage(previousImageUrl); } catch (e) { console.log('Failed deleting previous image (single):', e); }
            }
            if (localImage && (!imageUrl || newImageSelected)) {
                try {
                    imageUrl = await uploadEventImage(localImage, newId, userId);
                    selectedEventData$.imageUrl.set(imageUrl);
                } catch (e) { console.log('Image upload failed (modify single):', e); }
            }
            const modifiedEvent: BaseEvent = {
                ...selectedEventData$.get(),
                id: newId,
                imageUrl,
                modified: new Date(),
                eventType: 'pager',
            } as any;
            deleteEvent(event);
            // cancelNotification(selectedEventData$.id.get());
            saveEvent(modifiedEvent as any);
            // scheduleMultipleNotifications();
        } else {
            const newRepeatKey = formatRepeatKey(normalizeRepeatRule(selectedEventData$.repeatRule.get()));
            const newId = getRepeatingEventID(newRepeatKey);
            if (newImageSelected) {
                try { await deleteEventImage(previousImageUrl); } catch (e) { console.log('Failed deleting previous image (to repeating):', e); }
            }
            if (localImage && (!imageUrl || newImageSelected)) {
                try {
                    imageUrl = await uploadEventImage(localImage, newId, userId);
                    selectedEventData$.imageUrl.set(imageUrl);
                } catch (e) { console.log('Image upload failed (modify to repeating):', e); }
            }
            const modifiedRepeatingEvent = {
                ...selectedEventData$.get(),
                id: newId,
                imageUrl,
                modified: new Date(),
                eventType: 'pager',
                repeatKey: newRepeatKey,
                repeatRule: normalizeRepeatRule(selectedEventData$.repeatRule.get()),
            };
            deleteEvent(event);
            // cancelNotification(selectedEventData$.id.get());
            saveRepeatingEvent(modifiedRepeatingEvent as any);
            // scheduleMultipleRepeatingNotifications();
        }
    } else {
        if (selectedEventData$.repeats.get() === false) {
            const existingId = selectedEventData$.id.get();
            if (newImageSelected) {
                try { await deleteEventImage(previousImageUrl); } catch (e) { console.log('Failed deleting previous image (repeating->single):', e); }
            }
            if (localImage && (!imageUrl || newImageSelected)) {
                try {
                    imageUrl = await uploadEventImage(localImage, existingId, userId);
                    selectedEventData$.imageUrl.set(imageUrl);
                } catch (e) { console.log('Image upload failed (modify repeating to single):', e); }
            }
            const modifiedEvent: BaseEvent = {
                ...selectedEventData$.get(),
                id: existingId,
                imageUrl,
                modified: new Date(),
                eventType: 'pager',
                repeatKey: 'none',
            } as any;
            deleteRepeatingEvent(event);
            // scheduleMultipleRepeatingNotifications();
            saveEvent(modifiedEvent as any);
            // scheduleMultipleNotifications();
        } else {
            const newRepeatKey = formatRepeatKey(normalizeRepeatRule(selectedEventData$.repeatRule.get()));
            const newId = getRepeatingEventID(newRepeatKey);
            if (newImageSelected) {
                try { await deleteEventImage(previousImageUrl); } catch (e) { console.log('Failed deleting previous image (repeating->repeating):', e); }
            }
            if (localImage && (!imageUrl || newImageSelected)) {
                try {
                    imageUrl = await uploadEventImage(localImage, newId, userId);
                    selectedEventData$.imageUrl.set(imageUrl);
                } catch (e) { console.log('Image upload failed (modify repeating to repeating):', e); }
            }
            const modifiedRepeatingEvent = {
                ...selectedEventData$.get(),
                id: newId,
                imageUrl,
                modified: new Date(),
                eventType: 'pager',
                repeatKey: newRepeatKey,
                repeatRule: normalizeRepeatRule(selectedEventData$.repeatRule.get()),
            };
            deleteRepeatingEvent(event);
            saveRepeatingEvent(modifiedRepeatingEvent as any);
            // scheduleMultipleRepeatingNotifications();
        }
    }
};

export const handleModifyScheduleEvent = (day: number) => {
    const modifiedEvent = {
        ...selectedEventData$.get(),
        id: selectedEventData$.id.get(),
        modified: new Date(),
    };
    const days = selectedScheduleData$.days.get();
    // filter out the event that is being modified
    const dayEvents = days[day].filter((event: any) => event.id !== modifiedEvent.id);
    if (Array.isArray(dayEvents)) {
        days[day] = [...dayEvents, modifiedEvent];
    } else {
        days[day] = [modifiedEvent];
    }
    selectedScheduleData$.days.set(undefined);
    selectedScheduleData$.days.set(days);
}

export const handleDelete = (event: any) => {
    if (event.eventType === 'schedule') {
        handleDeleteScheduleEvent(event.day);
    }
    else {
        handleDeleteEvent(event);
    }
};

type EventWithRepeat = Omit<BaseEvent, 'id' | 'eventType'> & {
    id: string | null;
    eventType?: BaseEvent['eventType'] | string;
    repeatKey?: string;
    imageUrl?: string;
};

export const handleDeleteEvent = (event: EventWithRepeat) => {
    console.log('handle delete start');
    console.log('repeatKey: ', event.repeatKey);
    if (event.repeatKey === 'none') {
        if (event.imageUrl) {
            deleteEventImage(event.imageUrl).catch(e => console.log('Failed deleting image (single delete):', e));
        }
        deleteEvent(event as any);
        // cancelNotification(selectedEventData$.id.get());
    }
    else {
        if (event.imageUrl) {
            deleteEventImage(event.imageUrl).catch(e => console.log('Failed deleting image (repeating delete):', e));
        }
        deleteRepeatingEvent(event as any);
        // scheduleMultipleRepeatingNotifications();
    }
};

export const handleDeleteScheduleEvent = (day: number) => {
    const days = selectedScheduleData$.days.get();

    // Safety check: ensure days[day] exists and is an array
    if (!days[day] || !Array.isArray(days[day])) {
        console.warn(`No events found for day ${day}`);
        return;
    }
    console.log('Day Index: ', day);
    console.log('Days before deletion: ', days[day]);
    console.log('Event ID to delete: ', selectedEventData$.id.get());
    const dayEvents = days[day].filter((event: any) => event.id !== selectedEventData$.id.get());
    days[day] = dayEvents;

    console.log('Days after deletion: ', days[day]);

    selectedScheduleData$.days.set(undefined);
    selectedScheduleData$.days.set(days);

    console.log('handle delete schedule event end');
}

export const handleToggleEvent = (event: any) => {
    const modifiedEvent = {
        ...event,
        on: !event.on
    };
    //having to do that is crazy, but it works
    setEventData(modifiedEvent);
    
    handleModifyEvent(modifiedEvent);
}
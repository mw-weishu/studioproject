import { observable } from "@legendapp/state";
import { addToSchedules, deleteSchedule, getScheduleID, modifySchedule, schedules$ } from "./EventsStore";
// import { scheduleMultipleRepeatingNotifications } from "./Notifications";
import { initialScheduleIndex$, onPageChangeInitialScheduleIndexState$ } from "../components/edit/Schedule";

export const selectedScheduleData$ = observable({
    on: true,
    id: null,
    title: '',
    description: '',
    scheduleType: 'active',
    dayIndex: 0,
    startDate: new Date(new Date().setHours(0, 0, 0, 0)),
    repeats: true,
    repeatRule: {
        regular: {
            number: '1',
            unit: 'days',
        },
    },
    ends: false,
    endDate: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(0, 0, 0, 0)),
    days: {} as Record<string, any[]>,
});

/**
 * Ensure days is an object with sequential string keys '0'..'n'.
 * Fill missing indices with empty arrays.
 */
const normalizeDays = (days: any): Record<string, any[]> => {
    if (!days || typeof days !== 'object') return { '0': [] };

    // Collect numeric keys (as numbers)
    const keys = Object.keys(days);
    let maxIndex = -1;
    keys.forEach((k) => {
        const idx = parseInt(k, 10);
        if (!isNaN(idx) && idx > maxIndex) maxIndex = idx;
    });

    // If no numeric keys, but maybe object is array-like, try length
    if (maxIndex === -1) {
        // If days is an array, use its length
        if (Array.isArray(days)) {
            maxIndex = days.length - 1;
        } else {
            // Try to find any numeric-looking property
            for (const k of Object.keys(days)) {
                const idx = parseInt(k, 10);
                if (!isNaN(idx)) {
                    maxIndex = Math.max(maxIndex, idx);
                }
            }
        }
    }

    if (maxIndex < 0) return { '0': [] };

    const normalized: Record<string, any[]> = {};
    for (let i = 0; i <= maxIndex; i++) {
        const key = String(i);
        const val = Object.prototype.hasOwnProperty.call(days, key)
            ? days[key]
            : Object.prototype.hasOwnProperty.call(days, i)
            ? days[i]
            : [];
        normalized[key] = Array.isArray(val) ? val : [];
    }
    return normalized;
}

export const setDefaultScheduleData = () => {
    selectedScheduleData$.on.set(true);
    selectedScheduleData$.id.set(null);
    selectedScheduleData$.title.set('');
    selectedScheduleData$.description.set('');
    selectedScheduleData$.scheduleType.set('active');
    selectedScheduleData$.dayIndex.set(0);
    selectedScheduleData$.startDate.set(new Date(new Date().setHours(0, 0, 0, 0)));
    selectedScheduleData$.repeats.set(true);
    selectedScheduleData$.repeatRule.set({
        regular: {
            number: '1',
            unit: 'days',
        },
    })
    selectedScheduleData$.ends.set(false);
    selectedScheduleData$.endDate.set(new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(0, 0, 0, 0)));
    // Use string keys for days to ensure consistent behavior when reading/writing and
    // avoid accidentally losing trailing empty days.
    selectedScheduleData$.days.set({'0': []});

    initialScheduleIndex$.set(0);
    onPageChangeInitialScheduleIndexState$.set(0);
}

export const setScheduleData = (schedule: any) => {
    selectedScheduleData$.on.set(schedule.on);
    selectedScheduleData$.id.set(schedule.id);
    selectedScheduleData$.title.set(schedule.title);
    selectedScheduleData$.description.set(schedule.description);
    selectedScheduleData$.scheduleType.set(schedule.scheduleType);
    selectedScheduleData$.dayIndex.set(schedule.dayIndex);
    selectedScheduleData$.startDate.set(new Date(schedule.startDate));
    selectedScheduleData$.repeats.set(schedule.repeats);
    selectedScheduleData$.repeatRule.set(schedule.repeatRule);
    selectedScheduleData$.ends.set(schedule.ends);
    selectedScheduleData$.endDate.set(new Date(schedule.endDate));
    console.log('days: ', schedule.days);
    // Normalize days so keys are sequential strings '0'..'n' and missing indices
    // get empty arrays. This prevents losing days that are present but have
    // empty arrays when the object comes from storage or JSON.
    selectedScheduleData$.days.set(normalizeDays(schedule.days));
}

export const setScheduleDataByEventId = (eventId: string) => {
    const schedules = schedules$.schedules.get();
    const id = eventId.split('d')[0];
    const dayIndex = parseInt(eventId.split('d')[1], 10);
    const schedule = schedules.find((s: any) => s.id === id);
    if (schedule) {
        setScheduleData(schedule);
        onPageChangeInitialScheduleIndexState$.set(dayIndex);
        selectedScheduleData$.dayIndex.set(dayIndex);
    }
}

export const handleSave = () => {
        
    const repeatNumberRaw = selectedScheduleData$.repeatRule.get().regular.number;
    const repeatNumber = typeof repeatNumberRaw === 'string' ? parseInt(repeatNumberRaw, 10) : repeatNumberRaw;

    const newSchedule = {
    ...selectedScheduleData$.get(),
    id: getScheduleID(),
    repeatRule: {
        ...selectedScheduleData$.repeatRule.get(),
        regular: {
            ...selectedScheduleData$.repeatRule.get().regular,
            number: repeatNumber,
        },
    },
    modified: new Date(),
    };

    addToSchedules(newSchedule);
    // scheduleMultipleRepeatingNotifications()
};

// export const handleApply = () => {

//         const applySchedule = {
//             id: selectedScheduleData$.id.get(),
//             title: selectedScheduleData$.title.get(),
//             description: selectedScheduleData$.description.get(),
//             days: selectedScheduleData$.days.get(),
//         }

//         applySchedule(applySchedule, selectedScheduleData$.applydate.get());
// }

export const handleModify = () => {
    
    const repeatNumberRaw = selectedScheduleData$.repeatRule.get().regular.number;
    const repeatNumber = typeof repeatNumberRaw === 'string' ? parseInt(repeatNumberRaw, 10) : repeatNumberRaw;

    const modifiedSchedule = {
        ...selectedScheduleData$.get(),
        id: selectedScheduleData$.id.get() ?? getScheduleID(),
        repeatRule: {
            ...selectedScheduleData$.repeatRule.get(),
            regular: {
                ...selectedScheduleData$.repeatRule.get().regular,
                number: repeatNumber,
            },
        },
        modified: new Date(),
    };
    
    modifySchedule(modifiedSchedule);
    // scheduleMultipleRepeatingNotifications();
}

export const handleDelete = () => {
    const repeatNumberRaw = selectedScheduleData$.repeatRule.get().regular.number;
    const repeatNumber = typeof repeatNumberRaw === 'string' ? parseInt(repeatNumberRaw, 10) : repeatNumberRaw;

    const theSchedule = {
        ...selectedScheduleData$.get(),
        id: selectedScheduleData$.id.get() ?? getScheduleID(),
        repeatRule: {
            ...selectedScheduleData$.repeatRule.get(),
            regular: {
                ...selectedScheduleData$.repeatRule.get().regular,
                number: repeatNumber,
            },
        },
    };
    deleteSchedule(theSchedule);
    // scheduleMultipleRepeatingNotifications();
};

export const handleToggleSchedule = (schedule: any) => {
    const modifiedSchedule = {
        ...schedule,
        on: !schedule.on,
        modified: new Date,
    };
    
    modifySchedule(modifiedSchedule);
    // scheduleMultipleRepeatingNotifications();
}
import { observable } from "@legendapp/state";
import { addToSavedEvents, applySavedEvent, deleteSavedEvent, getSavedEventID, modifySavedEvent } from "./EventsStore";

export const selectedSavedEventData$ = observable({
    id: null,
    
    title: '',
    description: '',
    startDate: new Date(0),
    endDate: new Date(0),
    blank: false,
    eventType: 'saved',

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
});

export const handleAdd = () => {
    if (selectedSavedEventData$.startDate.get() > selectedSavedEventData$.endDate.get()) {
    alert("Start time is later than end time.");
    return
    }

    const newSavedEvent = {
        ...selectedSavedEventData$.get(),
        id: getSavedEventID(),
        eventType: 'saved' as const,
        modified: new Date(),
        repeats: false,
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
        }
    };

    addToSavedEvents(newSavedEvent as any);
}

export const handleApplySavedEvent = (applyDate: Date) => {
    const applyEvent = {
        ...selectedSavedEventData$.get(),
        id: selectedSavedEventData$.id.get() ?? getSavedEventID(),
        eventType: 'saved' as const,
    };

    applySavedEvent(applyEvent as any, applyDate);
}

export const handleModify = () => {
    if (selectedSavedEventData$.startDate.get() > selectedSavedEventData$.endDate.get()) {
        alert("Start time is later than end time.");
        return
    }
    const modifiedSavedEvent = {
        ...selectedSavedEventData$.get(),
        id: selectedSavedEventData$.id.get() ?? getSavedEventID(),
        eventType: 'saved' as const,
        modified: new Date(),
    };
    
    modifySavedEvent(modifiedSavedEvent as any);
}

export const handleDuplicate = () => {
    // console.log('Duplicate');
    // handleDuplicate();
}

export const handleDelete = () => {
    const toDelete = {
        ...selectedSavedEventData$.get(),
        id: selectedSavedEventData$.id.get() ?? getSavedEventID(),
        eventType: 'saved' as const,
    };
    deleteSavedEvent(toDelete as any);
};
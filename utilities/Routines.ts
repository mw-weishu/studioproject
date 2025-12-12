import { observable } from "@legendapp/state";
import { addToSavedRoutines, applySavedRoutine, deleteSavedRoutine, getRoutineID, modifySavedRoutine } from "./EventsStore";

export const selectedRoutineData$ = observable({
    title: '',
    description: '',
    days: {} as Record<string, any[]>,
    id: null,
    routineType: '',

    applydate: new Date(0),
});

export const selectedRoutineEventData$ = observable({
    id: null,
    
    title: '',
    description: '',
    startDate: new Date(0),
    endDate: new Date(0),
    eventType: '',
});

export const handleSave = () => {
        
    const newRoutine = {
    id: getRoutineID(),
    title: selectedRoutineData$.title.get(),
    description: selectedRoutineData$.description.get(),
    days: selectedRoutineData$.days.get(),
    routineType: 'default',
    modified: new Date(),
    };

    addToSavedRoutines(newRoutine);
};

export const handleApply = () => {

        const applyRoutine = {
            id: selectedRoutineData$.id.get(),
            title: selectedRoutineData$.title.get(),
            description: selectedRoutineData$.description.get(),
            days: selectedRoutineData$.days.get(),
        }

        applySavedRoutine(applyRoutine, selectedRoutineData$.applydate.get());
}

export const handleModify = () => {
    
    const modifiedRoutine = {
        id: selectedRoutineData$.id.get(),
        title: selectedRoutineData$.title.get(),
        description: selectedRoutineData$.description.get(),
        days: selectedRoutineData$.days.get(),
        routineType: 'default',
        modified: new Date(),
    };
    
    modifySavedRoutine(modifiedRoutine);
}

export const handleDuplicate = () => {
    // console.log('Duplicate');
    // handleDuplicate();
}

export const handleDelete = () => {
        const theRoutine = {
            id: selectedRoutineData$.id.get(),
            title: selectedRoutineData$.title.get(),
            description: selectedRoutineData$.description.get(),
            days: selectedRoutineData$.days.get(),
        };
        deleteSavedRoutine(theRoutine);
};
//
import { connect } from "react-redux";
import { NotesSectionComponent } from "./NotesSection.component";
import { requestSaveEventNote, updateEventNoteField } from "../../Notes/viewEventNotes.actions";

const mapStateToProps = state => {
    const notesSection = state.viewEventPage.notesSection || {};
    return {
        notes: state.notes.viewEvent || [],
        ready: !notesSection.isLoading,
        fieldValue: notesSection.fieldValue,
    };
};

const mapDispatchToProps = dispatch => ({
    onAddNote: note => {
        dispatch(requestSaveEventNote(note));
    },
    onUpdateNoteField: value => {
        dispatch(updateEventNoteField(value));
    },
});

// $FlowSuppress
// $FlowFixMe[missing-annot] automated comment
export const NotesSection = connect(mapStateToProps, mapDispatchToProps)(NotesSectionComponent);

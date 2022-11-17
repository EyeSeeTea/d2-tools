//
import * as React from "react";
import log from "loglevel";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import { connect } from "react-redux";
import i18n from "@dhis2/d2-i18n";
import { errorCreator } from "capture-core-utils";
import { validationStrategies } from "../../../metaData/RenderFoundation/renderFoundation.const";
import { saveValidationFailed, saveAbort } from "../actions/dataEntry.actions";
import { getDataEntryKey } from "../common/getDataEntryKey";
import {} from "../../../metaData";
import { MessagesDialogContents } from "./MessagesDialogContents";
import { makeGetWarnings, makeGetErrors } from "./withSaveHandler.selectors";
import { addEventSaveTypes } from "../../WidgetEnrollmentEventNew/DataEntry/addEventSaveTypes";
import { newEventSaveTypes } from "../../DataEntries/SingleEventRegistrationEntry/DataEntryWrapper/DataEntry/newEventSaveTypes";

const getSaveHandler = (InnerComponent, onIsCompleting, onFilterProps, onGetFormFoundation) => {
    class SaveHandlerHOC extends React.Component {
        constructor(props) {
            super(props);
            this.dataEntryFieldInstances = new Map();
            this.state = {
                messagesDialogOpen: false,
                waitForPromisesDialogOpen: false,
                waitForFieldValidations: false,
            };
        }

        componentDidUpdate(prevProps) {
            if (
                this.state.waitForPromisesDialogOpen &&
                this.props.inProgressList.length === 0 &&
                prevProps.inProgressList.length > 0
            ) {
                // eslint-disable-next-line react/no-did-update-set-state
                this.setState({ waitForPromisesDialogOpen: false, saveType: undefined });
                this.validateAndSave(this.state.saveType);
            } else if (this.state.waitForFieldValidations && this.props.sectionsInitialised) {
                // eslint-disable-next-line react/no-did-update-set-state
                this.setState({ waitForFieldValidations: false, saveType: undefined });
                this.validateAndSave(this.state.saveType);
            }
        }

        static errorMessages = {
            INNER_INSTANCE_NOT_FOUND: "Inner instance not found",
            FORM_INSTANCE_NOT_FOUND: "Form instance not found",
        };

        getDataEntryFieldInstances() {
            // $FlowFixMe[missing-annot] automated comment
            return Array.from(this.dataEntryFieldInstances.entries()).map(entry => entry[1]);
        }

        validateDataEntryFields() {
            const fieldInstance = this.getDataEntryFieldInstances();

            let fieldsValid = true;
            let index = 0;
            while (fieldInstance[index] && fieldsValid) {
                fieldsValid = fieldInstance[index].validateAndScrollToIfFailed();
                index += 1;
            }
            return fieldsValid;
        }

        showMessagesPopup(saveType) {
            this.setState({ messagesDialogOpen: true, saveType });
        }

        validateGeneralErrorsFromRules(isCompleting) {
            const validationStrategy = this.props.calculatedFoundation.validationStrategy;
            if (validationStrategy === validationStrategies.NONE) {
                return true;
            } else if (validationStrategy === validationStrategies.ON_COMPLETE) {
                return isCompleting ? !this.props.hasGeneralErrors : true;
            }

            return !this.props.hasGeneralErrors;
        }

        shouldComplete(saveType) {
            if (onIsCompleting) {
                return onIsCompleting(this.props);
            }
            return [addEventSaveTypes.COMPLETE, newEventSaveTypes.SAVEANDCOMPLETE].includes(saveType);
        }

        validateForm(saveType) {
            const formInstance = this.formInstance;
            if (!formInstance) {
                log.error(
                    errorCreator(SaveHandlerHOC.errorMessages.FORM_INSTANCE_NOT_FOUND)({
                        SaveButtonBuilder: this,
                    })
                );
                return {
                    error: true,
                    isValid: false,
                };
            }

            const isCompleting = this.shouldComplete(saveType);

            const isValid =
                formInstance.validateFormScrollToFirstFailedField({ isCompleting }) &&
                this.validateGeneralErrorsFromRules(isCompleting);

            return {
                isValid,
                error: false,
            };
        }

        validateAndSave(saveType) {
            const isDataEntryFieldsValid = this.validateDataEntryFields();
            if (!isDataEntryFieldsValid) {
                this.props.onSaveValidationFailed(this.props.itemId, this.props.id);
                return;
            }

            const { error: validateFormError, isValid: isFormValid } = this.validateForm(saveType);
            if (validateFormError) {
                return;
            }

            this.handleSaveValidationOutcome(saveType, isFormValid);
        }

        handleSaveAttempt = saveType => {
            const { inProgressList, sectionsInitialised } = this.props;
            if (inProgressList.length) {
                this.setState({ waitForPromisesDialogOpen: true, saveType });
            } else if (!sectionsInitialised) {
                this.setState({ waitForFieldValidations: true, saveType });
            } else {
                this.validateAndSave(saveType);
            }
        };

        handleSaveValidationOutcome(saveType, isFormValid) {
            const { onSaveValidationFailed, itemId, id, warnings, errors } = this.props;
            if (!isFormValid) {
                onSaveValidationFailed(itemId, id);
            } else if (
                this.isCompleting &&
                ((errors && errors.length > 0) || (warnings && warnings.length > 0))
            ) {
                this.showMessagesPopup(saveType);
            } else {
                this.handleSave(saveType);
            }
        }

        handleAbortDialog = () => {
            this.props.onSaveAbort(this.props.itemId, this.props.id);
            this.setState({ messagesDialogOpen: false });
        };

        handleSaveDialog = () => {
            this.handleSave(addEventSaveTypes.SAVE_WITHOUT_COMPLETING);
            this.setState({ messagesDialogOpen: false });
        };

        handleSave = saveType => {
            const { onSave, itemId, id, calculatedFoundation, warnings, errors } = this.props;
            if (
                saveType === addEventSaveTypes.COMPLETE &&
                ((errors && errors.length > 0) || (warnings && warnings.length > 0))
            ) {
                this.showMessagesPopup(saveType);
            } else {
                onSave(itemId, id, calculatedFoundation, saveType);
            }
        };

        getDialogWaitForUploadContents = () => (
            <div>{i18n.t("Some operations are still runnning. Please wait..")}</div>
        );

        // $FlowFixMe[missing-annot] automated comment
        setFormInstance = formInstance => {
            this.formInstance = formInstance;
        };

        // $FlowFixMe[missing-annot] automated comment
        setDataEntryFieldInstance = (dataEntryFieldInstance, id) => {
            this.dataEntryFieldInstances.set(id, dataEntryFieldInstance);
        };

        render() {
            const {
                itemId,
                onSave,
                onSaveValidationFailed,
                onSaveAbort,
                warnings,
                errors,
                hasGeneralErrors,
                inProgressList,
                calculatedFoundation,
                sectionsInitialised,
                ...passOnProps
            } = this.props;

            const filteredProps = onFilterProps ? onFilterProps(passOnProps) : passOnProps;
            this.isCompleting = !!(onIsCompleting && onIsCompleting(this.props));

            return (
                <div>
                    <InnerComponent
                        formRef={this.setFormInstance}
                        dataEntryFieldRef={this.setDataEntryFieldInstance}
                        onSave={this.handleSaveAttempt}
                        {...filteredProps}
                    />
                    <Dialog open={this.state.messagesDialogOpen} onClose={this.handleAbortDialog}>
                        <MessagesDialogContents
                            open={this.state.messagesDialogOpen}
                            onAbort={this.handleAbortDialog}
                            onSave={this.handleSaveDialog}
                            errors={errors}
                            warnings={warnings}
                            isCompleting={this.isCompleting}
                            validationStrategy={calculatedFoundation.validationStrategy}
                        />
                    </Dialog>
                    <Dialog open={this.state.waitForPromisesDialogOpen}>
                        <DialogTitle>{i18n.t("Operations running")}</DialogTitle>
                        <DialogContent>
                            <DialogContentText>{this.getDialogWaitForUploadContents()}</DialogContentText>
                        </DialogContent>
                    </Dialog>
                </div>
            );
        }
    }

    const makeStateToProps = () => {
        const getWarnings = makeGetWarnings();
        const getErrors = makeGetErrors();

        const mapStateToProps = (state, props) => {
            const itemId =
                state.dataEntries && state.dataEntries[props.id] && state.dataEntries[props.id].itemId;
            const key = getDataEntryKey(props.id, itemId);
            const generalErrors =
                state.rulesEffectsGeneralErrors[key] && state.rulesEffectsGeneralErrors[key].error;
            const foundation = onGetFormFoundation ? onGetFormFoundation(props) : props.formFoundation;
            const reduxSectionKeys = [...foundation.sections.values()].map(section => `${key}-${section.id}`);
            return {
                itemId,
                saveAttempted:
                    state.dataEntriesUI && state.dataEntriesUI[key] && state.dataEntriesUI[key].saveAttempted,
                warnings: getWarnings(state, props, { key, foundation }),
                errors: getErrors(state, props, { key, foundation }),
                hasGeneralErrors: generalErrors && generalErrors.length > 0,
                inProgressList: state.dataEntriesInProgressList[key] || [],
                calculatedFoundation: foundation,
                sectionsInitialised: reduxSectionKeys.every(reduxSectionKey => {
                    const reduxSection = state.formsSectionsFieldsUI[reduxSectionKey];
                    // $FlowFixMe
                    return (
                        reduxSection && Object.values(reduxSection).every(({ valid }) => valid !== undefined)
                    );
                }),
            };
        };

        // $FlowFixMe[not-an-object] automated comment
        return mapStateToProps;
    };

    const mapDispatchToProps = dispatch => ({
        onSaveValidationFailed: (itemId, id) => {
            dispatch(saveValidationFailed(itemId, id));
        },
        onSaveAbort: (itemId, id) => {
            dispatch(saveAbort(itemId, id));
        },
    });

    // $FlowFixMe
    return connect(makeStateToProps, mapDispatchToProps)(SaveHandlerHOC);
};

export const withSaveHandler = options => InnerComponent =>
    getSaveHandler(
        InnerComponent,
        options && options.onIsCompleting,
        options && options.onFilterProps,
        options && options.onGetFormFoundation
    );

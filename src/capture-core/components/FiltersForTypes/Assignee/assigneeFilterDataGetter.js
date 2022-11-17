//

export function getAssigneeFilterData(value) {
    return {
        assignedUserMode: value.mode,
        assignedUser: value.provided,
    };
}

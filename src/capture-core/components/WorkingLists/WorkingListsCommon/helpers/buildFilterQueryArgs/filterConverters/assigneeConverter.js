//

export function convertAssignee(sourceValue) {
    return {
        assignedUserMode: sourceValue.assignedUserMode,
        assignedUser: sourceValue.assignedUser && sourceValue.assignedUser.id,
    };
}

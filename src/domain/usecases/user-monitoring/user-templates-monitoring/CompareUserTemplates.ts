import _ from "lodash";
import { User, UserTemplateDiff } from "domain/entities/user-monitoring/user-templates-monitoring/Users";

export class CompareUserTemplates {
    constructor() {}

    private membershipKeys = ["userRoles", "userGroups"];

    private getNewProps(oldUserTemplate: User, newUserTemplate: User): Partial<User> {
        let newProps: Partial<User> = {};

        _.forOwn(newUserTemplate, (value, key) => {
            if (this.membershipKeys.includes(key)) {
                return;
            }

            if (!_.has(oldUserTemplate, key)) {
                newProps = _.set(newProps, key, value);
            } else {
                const oldValue = _.get(oldUserTemplate, key, undefined);
                if (!_.isEqual(value, oldValue)) {
                    if ((_.isObjectLike(oldValue) || _.isArrayLike(oldValue)) && _.isEmpty(oldValue)) {
                        newProps = _.set(newProps, key, value);
                    }
                }
            }
        });

        return newProps;
    }

    private compareMembershipProperties(oldUserTemplate: User, newUserTemplate: User): UserTemplateDiff {
        let changedPropsLost: Partial<User> = {};
        let changedPropsAdded: Partial<User> = {};
        let membershipChanges = {
            userRolesLost: [],
            userRolesAdded: [],
            userGroupsLost: [],
            userGroupsAdded: [],
        };

        _.forOwn(oldUserTemplate, (value, key) => {
            if (_.has(newUserTemplate, key)) {
                const newValue: any = _.get(newUserTemplate, key, undefined);

                if (!_.isEqual(value, newValue)) {
                    if (this.membershipKeys.includes(key)) {
                        membershipChanges = _.set(
                            membershipChanges,
                            `${key}Lost`,
                            _.differenceBy(value as any, newValue, "id")
                        );
                        membershipChanges = _.set(
                            membershipChanges,
                            `${key}Added`,
                            _.differenceBy(newValue, value as any, "id")
                        );
                    } else {
                        changedPropsLost = _.set(changedPropsLost, key, value);
                        changedPropsAdded = _.set(changedPropsAdded, key, newValue);
                    }
                }
            }
        });

        const newProps = this.getNewProps(oldUserTemplate, newUserTemplate);

        return {
            id: oldUserTemplate.id,
            username: oldUserTemplate.username,
            changedPropsLost: changedPropsLost,
            changedPropsAdded: changedPropsAdded,
            membershipChanges: membershipChanges,
            newProps: newProps,
        };
    }

    execute(oldUserTemplate: User, newUserTemplate: User): UserTemplateDiff {
        return this.compareMembershipProperties(oldUserTemplate, newUserTemplate);
    }
}

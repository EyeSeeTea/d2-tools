import _ from "lodash";
import { UserGroup, UserGroupDiff } from "domain/entities/user-monitoring/user-groups-monitoring/UserGroups";

export class CompareUserGroupsUseCase {
    constructor() {}

    private compareObjects(obj1: any, obj2: any): any {
        return _.reduce(
            obj1,
            (result, value, key) => {
                if (_.has(obj2, key)) {
                    const newValue = _.get(obj2, key);

                    if (!_.isEqual(value, newValue)) {
                        if (_.isObjectLike(value) && _.isObjectLike(newValue)) {
                            const nestedDiff = this.compareObjects(value, newValue);
                            if (!_.isEmpty(nestedDiff)) {
                                return _.set(result, key, nestedDiff);
                            }
                        } else {
                            return _.set(result, key, newValue);
                        }
                    }
                }
                return result;
            },
            {}
        );
    }

    private getNewProps(oldUserGroup: UserGroup, newUserGroup: UserGroup): Partial<UserGroup> {
        let newProps: Partial<UserGroup> = {};

        _.forOwn(newUserGroup, (value, key) => {
            if (!_.has(oldUserGroup, key)) {
                newProps = _.set(newProps, key, value);
            } else {
                const oldValue = _.get(oldUserGroup, key, undefined);
                if (!_.isEqual(value, oldValue)) {
                    if ((_.isObjectLike(oldValue) || _.isArrayLike(oldValue)) && _.isEmpty(oldValue)) {
                        newProps = _.set(newProps, key, value);
                    }
                }
            }
        });

        return newProps;
    }

    private compareUserGroupProperties(oldUserGroup: UserGroup, newUserGroup: UserGroup): UserGroupDiff {
        let changedPropsLost: Partial<UserGroup> = {};
        let changedPropsAdded: Partial<UserGroup> = {};
        let usersChanges = {
            users_Lost: [],
            users_Added: [],
        };

        _.forOwn(oldUserGroup, (value, key) => {
            if (_.has(newUserGroup, key)) {
                const newValue: any = _.get(newUserGroup, key, undefined);

                if (!_.isEqual(value, newValue)) {
                    if (key === "users") {
                        usersChanges = _.set(
                            usersChanges,
                            `${key}_Lost`,
                            _.differenceBy(value as any, newValue, "id")
                        );
                        usersChanges = _.set(
                            usersChanges,
                            `${key}_Added`,
                            _.differenceBy(newValue, value as any, "id")
                        );
                    } else {
                        changedPropsLost = _.set(changedPropsLost, key, value);
                        changedPropsAdded = _.set(changedPropsAdded, key, newValue);
                    }
                }
            }
        });

        const newProps = this.getNewProps(oldUserGroup, newUserGroup);

        return {
            id: oldUserGroup.id,
            name: oldUserGroup.name,
            changedPropsLost: changedPropsLost,
            changedPropsAdded: changedPropsAdded,
            usersChanges: usersChanges,
            newProps: newProps,
        };
    }

    execute(oldUserGroup: UserGroup, newUserGroup: UserGroup): UserGroupDiff {
        return this.compareUserGroupProperties(oldUserGroup, newUserGroup);
    }
}

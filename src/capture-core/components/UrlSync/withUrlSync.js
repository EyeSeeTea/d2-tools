//
/**
 * @namespace UrlSync
 */
import * as React from "react";
import { parse } from "query-string";
import { pageFetchesOrgUnitUsingTheOldWay } from "../../utils/url";

const getUrlSyncer = (InnerComponent, onGetSyncSpecification) =>
    class UrlSyncer extends React.Component {
        static getValueFromParam(param, id) {
            let value = null;
            if (param && param.length > 0) {
                const regExp = new RegExp(`${id}=`, "i");
                value = param[param.length - 1].replace(regExp, "").trim() || null;
            }
            return value;
        }

        static getNextProps(locationParams, syncSpecification) {
            const nextParams = Object.keys(locationParams).reduce((accNextParams, locationKey) => {
                const syncSpec = syncSpecification.find(s => s.urlParameterName === locationKey) || {};
                accNextParams[syncSpec.urlParameterName || locationKey] = locationParams[locationKey];
                return accNextParams;
            }, {});

            return nextParams;
        }

        componentDidMount() {
            this.triggerSyncCallback();
        }

        componentDidUpdate() {
            this.triggerSyncCallback();
        }

        update(updateData) {
            this.props.onUpdate(updateData);
        }

        noUpdateRequired() {
            this.props.onNoUpdateRequired && this.props.onNoUpdateRequired();
        }

        triggerSyncCallback() {
            if (this.queuedUpdate) {
                this.update({
                    nextProps: this.queuedUpdate.nextProps,
                    prevProps: this.props.stateParams || {},
                    nextPage: this.props.urlPage,
                    prevPage: this.props.statePage,
                });
                this.queuedUpdate = null;
            } else {
                this.noUpdateRequired();
            }
        }

        paramsNeedsUpdate(syncSpecifications, locationParams) {
            return syncSpecifications.some(spec => {
                const locationValue = locationParams[spec.urlParameterName];
                const propValue =
                    (this.props.stateParams && this.props.stateParams[spec.urlParameterName]) || undefined;
                return locationValue !== propValue;
            });
        }

        isOutOfSync() {
            const syncSpecification = onGetSyncSpecification(this.props);
            const {
                history: { location },
                statePage,
                urlPage,
            } = this.props;
            const locationParams = parse(location && location.search);
            const urlParamsAreOutOfSync = this.paramsNeedsUpdate(syncSpecification, locationParams);
            const urlPathnameIsOutOfSync = urlPage !== statePage;

            if (urlPathnameIsOutOfSync || urlParamsAreOutOfSync) {
                const nextProps = UrlSyncer.getNextProps(locationParams, syncSpecification);
                this.queuedUpdate = { nextProps };
                return true;
            }
            return false;
        }

        render() {
            const { onUpdate, urlParams, stateParams, urlPage, statePage, ...passOnProps } = this.props;
            const urlOutOfSync = this.isOutOfSync();

            if (urlOutOfSync && pageFetchesOrgUnitUsingTheOldWay(urlPage)) {
                return (
                    // $FlowFixMe[cannot-spread-inexact] automated comment
                    <InnerComponent urlOutOfSync {...passOnProps} />
                );
            }

            return <InnerComponent {...passOnProps} />;
        }
    };

/**
 * Compare values from the url params and the props (usually from the state) based on the sync specification. Calls onUpdate or onNoUpdateRequired accordingly. Additionally checks if the page has changed.
 * @alias withUrlSync
 * @memberof UrlSync
 * @example withUrlSync(props => [{ urlParameterName: 'programId' }])([InnerComponent])
 */
export const withUrlSync = onGetSyncSpecification => InnerComponent =>
    getUrlSyncer(InnerComponent, onGetSyncSpecification);

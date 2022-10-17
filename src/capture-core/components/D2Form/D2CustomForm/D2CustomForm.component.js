//
import * as React from "react";
import log from "loglevel";
import { walk, kinds } from "react-transform-tree";
import { errorCreator } from "capture-core-utils";

import { CustomForm } from "../../../metaData";

/**
 * Build the form based on the specs in custom form.
 *
 * @class D2CustomForm
 * @extends {React.Component<Props>}
 */
export class D2CustomForm extends React.Component {
    static getEventListenersForCurrentNode(nodeProps) {
        const eventListeners = Object.keys(nodeProps).filter(propName => propName.startsWith("on"));
        return eventListeners;
    }

    static getEventListenerSpecsForCurrentNode(eventListeners, nodeProps, id) {
        const eventListenerSpecsForCurrentNode = eventListeners.map(propName => {
            const handler = nodeProps[propName];
            const type = propName.replace(/^on/, "");
            return {
                id,
                type,
                handler,
            };
        });

        return eventListenerSpecsForCurrentNode;
    }

    static renderField(field, customFormElementProps, onRenderField) {
        return onRenderField({
            ...field,
            props: {
                ...field.props,
                customFormElementProps,
            },
        });
    }

    constructor(props) {
        super(props);
        this.preProcessSourceTree();
    }

    componentDidMount() {
        this.addScripts();
        this.addEventListeners();
    }

    componentWillUnmount() {
        this.removeEventListeners();
    }

    static errorMessages = {
        PRE_PROCESS_FAILED: "Could not pre process custom form source tree",
    };

    /**
     * Pre process the tree, extracting all event listeners. Event listeners will be added after the component is mounted.
     *
     * @memberof D2CustomForm
     */
    preProcessSourceTree() {
        const { specs } = this.props;
        const sourceTree = specs.data.elements;
        let autoId = 1;
        let eventListenerSpecs = [];
        let preProcessedSourceTree = [];
        try {
            // $FlowFixMe[incompatible-call] automated comment
            preProcessedSourceTree = walk(sourceTree, {
                [kinds.DOM_ELEMENT]: path => {
                    const { node } = path;
                    const { props: nodeProps } = node;
                    if (nodeProps) {
                        const eventListeners = D2CustomForm.getEventListenersForCurrentNode(nodeProps);
                        if (eventListeners.length > 0) {
                            const eventListenerSpecsForCurrentNode =
                                D2CustomForm.getEventListenerSpecsForCurrentNode(
                                    eventListeners,
                                    nodeProps,
                                    autoId
                                );
                            eventListenerSpecs = [...eventListenerSpecs, ...eventListenerSpecsForCurrentNode];
                            const passOnNodeProps = Object.keys(nodeProps).reduce((accPassOnProps, key) => {
                                if (!eventListeners.includes(key)) {
                                    accPassOnProps[key] = nodeProps[key];
                                }
                                return accPassOnProps;
                            }, {});

                            const clonedElement = React.cloneElement(
                                node,
                                {
                                    ...passOnNodeProps,
                                    "data-custom-form-id": autoId,
                                },

                                /* $FlowFixMe[incompatible-type] automated
                                 * comment */
                                // $FlowFixMe[prop-missing] automated comment
                                ...path.walkChildren()
                            );
                            autoId += 1;
                            return clonedElement;
                        }
                    }

                    return React.cloneElement(
                        node,
                        node.props,

                        // $FlowFixMe[incompatible-type] automated comment
                        // $FlowFixMe[prop-missing] automated comment
                        ...path.walkChildren()
                    );
                },
            });
        } catch (error) {
            log.error(errorCreator(D2CustomForm.errorMessages.PRE_PROCESS_FAILED)({ sourceTree, error }));
            eventListenerSpecs = [];
            preProcessedSourceTree = [];
        }

        this.eventListenerSpecs = eventListenerSpecs;
        this.preProcessedSourceTree = preProcessedSourceTree;
    }

    /**
     * Add scripts to the DOM
     *
     * @memberof D2CustomForm
     */
    addScripts() {
        const scripts = this.props.specs.data.scripts;
        scripts.forEach(scriptData => {
            const domScriptElement = document.createElement("script");
            domScriptElement.type = "text/javascript";
            domScriptElement.async = true;
            domScriptElement.innerHTML = scriptData;

            // $FlowFixMe[incompatible-use] automated comment
            document.body.appendChild(domScriptElement);
        });
    }

    /**
     *
     * Add event listeners
     *
     * @memberof D2CustomForm
     */
    addEventListeners() {
        const eventListenerSpecs = this.eventListenerSpecs;
        const specsWithHandlerRef = eventListenerSpecs.map(spec => {
            const handlerRef = () => {
                eval(spec.handler);
            }; //eslint-disable-line
            document
                .querySelector(`[data-custom-form-id="${spec.id}"]`)

                // $FlowFixMe[incompatible-use] automated comment
                .addEventListener(spec.type, handlerRef);

            return {
                ...spec,
                handlerRef,
            };
        });
        this.eventListenerSpecs = specsWithHandlerRef;
    }
    /**
     * Remove event listeners
     *
     * @memberof D2CustomForm
     */
    removeEventListeners() {
        this.eventListenerSpecs.forEach(spec => {
            document
                .querySelector(`[data-custom-form-id="${spec.id}"]`)

                // $FlowFixMe[incompatible-use] automated comment
                // $FlowFixMe[incompatible-call] automated comment
                .removeEventListener(spec.type, spec.handlerRef);
        });
    }

    /**
     * Transform the tree, replacing all placeholder FormField elements with the real field elements.
     *
     * @returns the transformed tree
     * @memberof D2CustomForm
     */
    transform() {
        const { fields, onRenderField } = this.props;
        const sourceTree = this.preProcessedSourceTree;

        // $FlowFixMe[incompatible-call] automated comment
        const transformedTree = walk(sourceTree, {
            [kinds.DOM_ELEMENT]: path => {
                const { node } = path;
                if (node.type === "FormField") {
                    const fieldId = node.props.id;
                    const field = fields.find(f => f.id === fieldId);
                    if (field) {
                        return D2CustomForm.renderField(
                            field,
                            node.props.customFormElementProps,
                            onRenderField
                        );
                    }
                    return null;
                }
                return path.defaultHandler();
            },
        });
        return transformedTree;
    }

    render() {
        const customFormElement = this.transform();
        return <div>{customFormElement}</div>;
    }
}

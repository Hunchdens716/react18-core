import { setInitialProperties } from "./ReactDOMComponent";
import { precacheFiberNode, updateFiberProps } from "./ReactDOMComponentTree";

export function shouldSetTextContent(type, props) {
    return typeof props.children === 'string' || typeof props.children === 'number'
}

export function createTextInstance(content) {
    return document.createTextNode(content);
}

export function createInstance(type, props, internalInstanceHandle) {
    const domElement = document.createElement(type);
    precacheFiberNode(internalInstanceHandle, domElement); // fiber节点
    updateFiberProps(domElement, props); // 属性
    return domElement;
}

export function appendInitialChild(parent, child) {
    parent.appendChild(child);
}

export function finalizeInitialChildren(domElement, type, props) {
    setInitialProperties(domElement, type, props);
}

export function insertBefore(parentInstance, child, beforeChild) {
    parentInstance.insertBefore(child, beforeChild);
}
import { getEventTarget } from "./getEventTarget";
import { getClosestInstanceFromNode } from "../client/ReactDOMComponentTree";
import { dispatchEventForPluginEventSystem } from "./DOMPluginEventSystem";
export function createEventListenerWrapperWithPriority(targetContainer, domEventName, eventSystemFlags) {
    const listenerWrapper = dispatchDiscreteEvent;

    return listenerWrapper.bind(null, domEventName, eventSystemFlags, targetContainer);
}

function dispatchDiscreteEvent(domEventName, eventSystemFlags, container, nativeEvent) {
    dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
}

function dispatchEvent(domEventName, eventSystemFlags, targetContainer, nativeEvent) {
    const nativeEventTarget = getEventTarget(nativeEvent); // 事件对象对应的dom元素
    const targetInst = getClosestInstanceFromNode(nativeEventTarget); // 目标实例 对应的fiber节点
    dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, targetInst, targetContainer);

}


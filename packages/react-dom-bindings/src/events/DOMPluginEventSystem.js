import { allNativeEvents } from "./EventRegistry";
import * as SimpleEventPlugin from "./plugins/SimpleEventPlugin";
import { IS_CAPTURE_PHASE } from "./EventSystemFlags";
import { createEventListenerWrapperWithPriority } from "./ReactDOMEventListener";
import { addEventCaptureListener, addEventBubbleListener } from "./EventListener";
import { getEventTarget } from "./getEventTarget";
import { HostComponent } from 'react-reconciler/src/ReactWorkTags';
import getListener from './getListener';
SimpleEventPlugin.registerEvents()
const listeningMarker = `_reactListening${Math.random().toString(36).slice(2)}`;

// rootContainerElement 容器节点 
// 整个事件的入口
export function listenToAllSupportedEvents(rootContinerElement) {
    // 注册一次就可以
    if (!rootContinerElement[listeningMarker]) {
        rootContinerElement[listeningMarker] = true;
        allNativeEvents.forEach(domEventName => {
            listenToNativeEvent(domEventName, true, rootContinerElement);
            listenToNativeEvent(domEventName, false, rootContinerElement);
        })
    }
}

export function listenToNativeEvent(domEventName, isCapturePhaseListener, target) {
    let eventSystemFlags = 0
    if (isCapturePhaseListener) {
        eventSystemFlags |= IS_CAPTURE_PHASE;
    }
    addTrappedEventListener(target, domEventName, eventSystemFlags, isCapturePhaseListener);
}

function addTrappedEventListener(targetContainer, domEventName, eventSystemFlags, isCapturePhaseListener) {
    const listener = createEventListenerWrapperWithPriority(targetContainer, domEventName, eventSystemFlags);
    if (isCapturePhaseListener) {
        addEventCaptureListener(targetContainer, domEventName, listener);
    } else {
        addEventBubbleListener(targetContainer, domEventName, listener);
    }
}

export function dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, targetInst, targetContainer) {
    dispatchEventForPlugins(domEventName, eventSystemFlags, nativeEvent, targetInst, targetContainer)
}

function dispatchEventForPlugins(domEventName, eventSystemFlags, nativeEvent, targetInst, targetContainer) {
    const nativeEventTarget = getEventTarget(nativeEvent);
    const dispatchQueue = [];
    extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer);
    processDispatchQueue(dispatchQueue, eventSystemFlags)
}

// 插件自己去实现
function extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer) {
    SimpleEventPlugin.extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer);
}

export function accumulateSinglePhaseListener(targetFiber, reactName, nativeEventType, isCapturePhase) {
    const captureName = reactName + 'Capture';
    const reactEventName = isCapturePhase ? captureName : reactName;
    const listeners = [];
    let instance = targetFiber;
    while (instance !== null) {
        const { stateNode, tag } = instance;
        if (tag === HostComponent && stateNode !== null) {
            const listener = getListener(instance, reactEventName);
            if (listener) {
                listeners.push(createDispatchListener(instance, listener, stateNode));
            }
        }
        instance = instance.return;
    }
    return listeners;
}

/**
 * 创建分发监听器
 * @param {Fiber} instance Fiber实例
 * @param {Function} listener 监听器函数
 * @param {Element} currentTarget 当前目标元素
 */
function createDispatchListener(instance, listener, currentTarget) {
    return { instance, listener, currentTarget }
}

function processDispatchQueue(dispatchQueue, eventSystemFlags) {
    // 判断是否在捕获阶段
    const inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;
    for (let i = 0; i < dispatchQueue.length; i++) {
        const { event, listeners } = dispatchQueue[i];
        processDispatchQueueItemsInOrder(event, listeners, inCapturePhase);
    }
}


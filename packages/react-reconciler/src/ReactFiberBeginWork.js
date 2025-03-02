import { HostComponent, HostRoot, HostText } from "./ReactWorkTags";
import { mountChildFibers, reconcilChildFibers } from "./ReactChildFiber";
import { processUpdateQueue } from "./ReactFiberClassUpdateQueue";
import { shouldSetTextContent } from "react-dom-bingdings/src/client/ReactDOMHostConfig";

function reconcileChildren(current, workInProgress, nextChildren) {
    if (current === null) {
        workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
    } else {
        workInProgress.child = reconcilChildFibers(workInProgress, current.child, nextChildren)
    }
}

function updateHostRoot(current, workInProgress) {
    processUpdateQueue(workInProgress)
    const nextState = workInProgress.memorizedState
    const nextChildren = nextState.element
    reconcileChildren(current, workInProgress, nextChildren)
    return workInProgress.child
}

function updateHostComponent() {
    const { type } = workInProgress;
    const nextProps = workInProgress.pendingProps;
    let nextChildren = nextProps.children;
    const isDirectTextChild = shouldSetTextContent(type, nextProps);
    if (isDirectTextChild) {
        nextChildren = null;
    }
    reconcileChildren(current, workInProgress, nextChildren);
    return workInProgress.child;
}

export function begineWork(current, workInProgress) {
    switch (workInProgress.tag) {
        case HostRoot:
            return updateHostRoot(current, workInProgress);
        case HostComponent:
            return updateHostComponent(current, workInProgress);
        case HostText:
            return null;
        default:
            return null;
    }
}
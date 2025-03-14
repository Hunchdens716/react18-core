import { NoFlags, Update } from "./ReactFiberFlags";
import { FunctionComponent, HostComponent, HostRoot, HostText } from "./ReactWorkTags";
import {
    createTextInstance,
    createInstance,
    appendInitialChild,
    finalizeInitialChildren,
    prepareUpdate
} from "react-dom-bindings/src/client/ReactDOMHostConfig"

function appendAllChildren(parent, workInProgress) {
    // 深度优先遍历
    let node = workInProgress.child;
    while (node) {
        if (node.tag === HostComponent || node.tag === HostText) {
            appendInitialChild(parent, node.stateNode)
        } else if (node.child !== null) {
            // 先处理子的
            node = node.child;
            continue;
        }
        if (node === workInProgress) {
            return;
        }
        while (node.sibiling === null) {
            if (node.return === null || node.return === workInProgress) {
                return;
            }
            node = node.return;
        }
        // 再处理兄弟
        node = node.sibiling;
    }
}

function markUpdate(workInProgress) {
    workInProgress.flags |= Update;
}

function updateHostComponent(current, workInProgress, type, newProps) {
    const oldProps = current.memorizedProps;
    const instance = workInProgress.stateNode;
    const updatePayload = prepareUpdate(instance, type, oldProps, newProps);
    workInProgress.updateQueue = updatePayload;
    if (updatePayload) {
        markUpdate(workInProgress);
    }
}

export function completeWork(current, workInProgress) {
    const newProps = workInProgress.pendingProps;
    switch (workInProgress.tag) {
        case HostRoot:
            bubbleProperties(workInProgress)
            break;
        case HostComponent:
            const { type } = workInProgress;
            if (current !== null && workInProgress.stateNode !== null) {
                // 复用
                updateHostComponent(current, workInProgress, type, newProps);
            } else {
                const instance = createInstance(type, newProps, workInProgress);
                appendAllChildren(instance, workInProgress);
                workInProgress.stateNode = instance;
                finalizeInitialChildren(instance, type, newProps);
            }
            bubbleProperties(workInProgress)
            break;
        case FunctionComponent:
            bubbleProperties(workInProgress)
            break;
        case HostText:
            const newText = newProps;
            workInProgress.stateNode = createTextInstance(newText);
            bubbleProperties(workInProgress)
            break;
    }
}

function bubbleProperties(completedWork) {
    let subtreeFlags = NoFlags;
    let child = completedWork.child;
    while (child != null) {
        subtreeFlags |= child.subtreeFlags;
        subtreeFlags |= child.flags;
        child = child.sibiling;
    }
    completedWork.subtreeFlags = subtreeFlags;
}
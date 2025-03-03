import { MutationMask, Placement } from "./ReactFiberFlags";
import { FunctionComponent, HostComponent, HostRoot, HostText } from "./ReactWorkTags";
import { appendInitialChild, insertBefore } from "react-dom-bindings/src/client/ReactDOMHostConfig"

function recursivelyTraverMutationEffects(root, parentFiber) {
    if (parentFiber.subtreeFlags & MutationMask) {
        let { child } = parentFiber;
        while (child !== null) {
            commitMutationEffectsOnFiber(child, root);
            child = child.sibiling;
        }
    }
}

export function commitMutationEffectsOnFiber(finishedWork, root) {
    switch (finishedWork.tag) {
        case FunctionComponent:
        case HostRoot:
        case HostComponent:
        case HostText: {
            recursivelyTraverMutationEffects(root, finishedWork);
            // 核心
            commitReconciliationEffects(finishedWork);
        }
    }
}

function isHostParent(fiber) {
    return fiber.tag === HostComponent || fiber.tag === HostRoot;
}

/**
 * 函数组件这种没有parentFiber
 */
function getHostParentFiber(fiber) {
    let parent = fiber.return;
    while (parent != null) {
        if (isHostParent(parent)) {
            return parent;
        }
        parent = parent.return;
    }
}

function commitReconciliationEffects(finishedWork) {
    const { flags } = finishedWork;
    if (flags & Placement) {
        commitPlacement(finishedWork);
    }
}

function getHostsibiling(fiber) {
    let node = fiber;
    sibiling: while (true) {
        while (node.sibiling === null) {
            if (node.return === null || isHostParent(node.return)) {
                return null;
            }
            node = node.return;
        }
        node = node.sibiling;
        while (node.tag !== HostComponent && node.tag !== HostText) {
            if (node.flags & Placement) {
                continue sibiling
            } else {
                node = node.child;
            }
        }
        if (!(node.flags & Placement)) {
            return node.stateNode;
        }
    }
}

function commitPlacement(finishedWork) {
    const parentFiber = getHostParentFiber(finishedWork);
    switch (parentFiber.tag) {
        case HostComponent: {
            const parent = parentFiber.stateNode;
            const before = getHostsibiling(finishedWork);
            insertOrAppendPlacementNode(finishedWork, before, parent);
            break;
        }
        case HostRoot: {
            const parent = parentFiber.stateNode.containerInfo;
            const before = getHostsibiling(finishedWork);
            insertOrAppendPlacementNode(finishedWork, before, parent);
            break;
        }
    }
}

function insertOrAppendPlacementNode(node, before, parent) {
    const { tag } = node;
    const isHost = tag === HostComponent || tag === HostText;
    if (isHost) {
        const { stateNode } = node;
        if (before) {
            insertBefore(parent, stateNode, before);
        } else {
            appendInitialChild(parent, stateNode)
        }
    } else {
        const { child } = node;
        if (child != null) {
            insertOrAppendPlacementNode(child, before, parent);
            let { sibiling } = child
            while (sibiling !== null) {
                insertOrAppendPlacementNode(sibiling, before, parent);
                sibiling = sibiling.sibiling
            }
        }
    }
}

import { MutationMask, Passive, Placement, Update, LayoutMask } from "./ReactFiberFlags";
import { FunctionComponent, HostComponent, HostRoot, HostText } from "./ReactWorkTags";
import { appendInitialChild, insertBefore, commitUpdate } from "react-dom-bindings/src/client/ReactDOMHostConfig"
import { HasEffect as HookHasEffect, Passive as HookPassive, Layout as HookLayout } from "./ReactHookEffectTags";

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
    const flags = finishedWork.flags;
    const current = finishedWork.alternate;
    switch (finishedWork.tag) {
        case FunctionComponent:
        case HostRoot:
        case HostText: {
            recursivelyTraverMutationEffects(root, finishedWork);
            // 核心
            commitReconciliationEffects(finishedWork);
        }
            break;
        case HostComponent: {
            recursivelyTraverMutationEffects(root, finishedWork);
            // 核心
            commitReconciliationEffects(finishedWork);
            if (flags & Update) {
                const instance = finishedWork.stateNode;
                if (instance !== null) {
                    const newProps = finishedWork.memorizedProps;
                    const oldProps = current !== null ? current.memorizedProps : newProps;
                    const type = finishedWork.type
                    const updatePayload = finishedWork.updateQueue;
                    finishedWork.updateQueue = null;
                    if (updatePayload) {
                        commitUpdate(instance, updatePayload, type, oldProps, newProps, finishedWork);
                    }
                }
            }
            break;
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



export function commitPassiveMountEffects(root, finishedWork) { // create
    commitPassiveMountOnFiber(root, finishedWork);
}

function commitPassiveMountOnFiber(finishRoot, finishedWork) {
    const flags = finishedWork.flags;
    switch (finishedWork.tag) {
        case HostRoot: {
            recursivelyTraversePassiveMountEffects(finishRoot, finishedWork);
            break;
        }
        case FunctionComponent: {
            recursivelyTraversePassiveMountEffects(finishRoot, finishedWork);
            if (flags & Passive) {
                commitHookPassiveMountEffects(finishedWork, HookHasEffect | HookPassive)
            }
            break;
        }
    }
}

function recursivelyTraversePassiveMountEffects(root, parentFiber) {
    if (parentFiber.subtreeFlags & Passive) {
        let child = parentFiber.child;
        while (child !== null) {
            commitPassiveMountOnFiber(root, child);
            child = child.sibiling;
        }
    }
}

function commitHookPassiveMountEffects(finishedWork, hookFlags) {
    commitHookEffectListMount(hookFlags, finishedWork);
}

function commitHookEffectListMount(flags, finishedWork) {
    const updateQueue = finishedWork.updateQueue;
    const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
    if (lastEffect !== null) {
        const firstEffect = lastEffect.next;
        let effect = firstEffect;
        do {
            if (effect.tag & flags === flags) {
                const create = effect.create;
                effect.destroy = create()
            }
            effect = effect.next;
        } while (effect !== firstEffect)
    }
}

export function commitPassiveUnmountEffects(root, finishedWork) { // destroy
    commitPassiveUnmountOnFiber(root, finishedWork);
}

function commitPassiveUnmountOnFiber(root, finishedWork) {
    const flags = finishedWork.flags;
    switch (finishedWork.tag) {
        case HostRoot: {
            recursivelyTraversePassiveUnMountEffects(root, finishedWork);
            break;
        }
        case FunctionComponent: {
            recursivelyTraversePassiveUnMountEffects(root, finishedWork);
            if (flags & Passive) {
                commitHookPassiveUnMountEffects(finishedWork, HookHasEffect | HookPassive)
            }
            break;
        }
    }
}

function recursivelyTraversePassiveUnMountEffects(root, parentFiber) {
    if (parentFiber.subtreeFlags & Passive) {
        let child = parentFiber.child;
        while (child !== null) {
            commitPassiveUnmountOnFiber(root, child);
            child = child.sibiling;
        }
    }
}

function commitHookPassiveUnMountEffects(finishedWork, hookFlags) {
    commitHookEffectListUnMount(hookFlags, finishedWork);
}

function commitHookEffectListUnMount(flags, finishedWork) {
    const updateQueue = finishedWork.updateQueue;
    const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
    if (lastEffect !== null) {
        const firstEffect = lastEffect.next;
        let effect = firstEffect;
        do {
            if (effect.tag & flags === flags) {
                const destroy = effect.destroy;
                if (destroy !== undefined) {
                    destroy();
                }
            }
            effect = effect.next;
        } while (effect !== firstEffect)
    }
}

export function commitLayoutEffects(finishedWork, root) {
    const current = finishedWork.alternate;
    commitLayoutEffectOnFiber(root, current, finishedWork);
}

function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork) {
    const flags = finishedWork.flags;
    switch (finishedWork.tag) {
        case HostRoot:
            recursivelyTraverLayoutEffects(finishedRoot, finishedWork);
            break;
        case FunctionComponent:
            recursivelyTraverLayoutEffects(finishedRoot, finishedWork);
            if (flags & LayoutMask) {
                commitHookLayoutEffects(finishedWork, HookHasEffect | HookLayout);
            }
            break;
    }
}

function recursivelyTraverLayoutEffects(root, parentFiber) {
    if (parentFiber.subtreeFlags & LayoutMask) {
        let child = parentFiber.child;
        while (child !== null) {
            const current = child.alternate
            commitLayoutEffectOnFiber(root, current, child);
            child = child.sibiling;
        }
    }
}


function commitHookLayoutEffects(finishedWork, hookFlags) {
    commitHookEffectListMount(hookFlags, finishedWork);
}
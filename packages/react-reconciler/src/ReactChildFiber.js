import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { createFiberFromElement, createFiberFromText, createWorkInProgress } from "./ReactFiber";
import { ChildDeletion, Placement } from "./ReactFiberFlags";
import { HostComponent, HostText } from "./ReactWorkTags";

function createChildReconciler(shouldTrackSideEffects) {

    function useFiber(fiber, pendingProps) {
        const clone = createWorkInProgress(fiber, pendingProps);
        clone.index = 0;
        clone.sibiling = null;
        return clone;
    }

    function deleteChild(returnFiber, childToDelete) {
        if (!shouldTrackSideEffects) return;
        const deletions = returnFiber.deletions;
        if (deletions === null) {
            returnFiber.deletions = [childToDelete];
            returnFiber.flags |= ChildDeletion;
        } else {
            returnFiber.deletions.push(childToDelete);
        }
    }

    function deleteRemainingChildren(returnFiber, currentFirstChild) {
        if (!shouldTrackSideEffects) return;
        let childToDelete = currentFirstChild;
        while (childToDelete !== null) {
            deleteChild(returnFiber, childToDelete);
            childToDelete = childToDelete.sibiling;
        }
        return null;
    }


    function reconcilSingleElement(returnFiber, currentFirstFiber, element) {
        // 拿到key
        const key = element.key;
        let child = currentFirstFiber;
        while (child !== null) {
            if (child.key === key) {
                if (child.type === element.type) {
                    // 单节点 可以复用 删除剩下的fiber
                    deleteRemainingChildren(returnFiber, child.sibiling);
                    const existing = useFiber(child, element.props);
                    existing.return = returnFiber;
                    return existing;
                } else {
                    deleteRemainingChildren(returnFiber, child);
                }
            } else {
                deleteChild(returnFiber, child);
            }
            child = child.sibiling;
        }

        const created = createFiberFromElement(element);
        created.return = returnFiber;
        return created;
    }

    function placeChild(newFiber, lastPlaceIndex, index) {
        newFiber.index = index;
        if (!shouldTrackSideEffects) {
            return lastPlaceIndex

        }
        const current = newFiber.alternate;
        if (current !== null) {
            // 复用的
            const oldIndex = current.index;
            newFiber.flags |= Placement;
            if (oldIndex < lastPlaceIndex) {
                newFiber.flags |= Placement;
                return lastPlaceIndex;
            } else {
                return oldIndex;
            }
        } else {
            newFiber.flags |= Placement;
            return lastPlaceIndex;
        }
    }

    function createChild(returnFiber, newChild) {
        if ((typeof newChild === 'string' && newChild !== "") || typeof newChild === 'numbaer') {
            const created = createFiberFromText(`${newChild}`);
            created.return = returnFiber;
            return created;
        }
        if (typeof newChild === 'object' && newChild !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE:
                    const created = createFiberFromElement(newChild);
                    created.return = returnFiber;
                    return created;
                default:
                    break;
            }
        }
        return null;
    }

    function updateElement(returnFiber, current, element) {
        const elementType = element.type;
        if (current !== null) {
            if (current.type === elementType) {
                const existing = useFiber(current, element.props);
                existing.return = returnFiber;
                return existing;
            }
        }
        const created = createFiberFromElement(element);
        created.return = returnFiber;
        return created;
    }

    function updateSlot(returnFiber, oldFiber, newChild) {
        const key = oldFiber !== null ? oldFiber.key : null;
        if (newChild !== null && typeof newChild === "object") {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE:
                    if (newChild.key === key) {
                        return updateElement(returnFiber, oldFiber, newChild);
                    }
                default:
                    return null;
            }
        }
        return null;
    }

    function mapRemainingChildren(returnFiber, currentFirstChild) {
        const existingChildren = new Map();
        let existingChild = currentFirstChild;
        while (existingChild !== null) {
            if (existingChild.key !== null) {
                existingChildren.set(existingChild.key, existingChild);
            } else {
                existingChildren.set(existingChild.index, existingChild);
            }
            existingChild = existingChild.sibiling;
        }
        return existingChildren;
    }

    function udpateTextNode(returnFiber, current, textContent) {
        if (current === null || current.tag !== HostText) {
            const created = createFiberFromText(textContent);
            create.return = returnFiber;
            return created;
        } else {
            const existing = useFiber(current, textContent);
            existing.return = returnFiber;
            return existing
        }
    }

    function updateFromMap(existingChildren, returnFiber, newIndex, newChild) {
        if ((typeof newChild === "string" && newChild !== "") || typeof newChild === "number") {
            const matchedFiber = existingChildren.get(newIndex) || null;
            return udpateTextNode(returnFiber, matchedFiber, newChild + "");
        }
        if (typeof newChild === "object" && newChild !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE: {
                    const matchedFiber = existingChildren.get(newChild.key === null ? newIndex : newChild.key) || null;
                    return updateElement(returnFiber, matchedFiber, newChild);
                }
            }
        }
    }

    // currentFirstFiber 老的第一个fiber节点
    function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
        let resultingFirstChild = null;
        let previousNewFiber = null;
        let newIndex = 0;
        let oldFiber = currentFirstChild;
        let nextOldFiber = null;
        // TODO: 第一套方案
        for (; oldFiber !== null && newIndex < newChildren.length; newIndex++) {
            nextOldFiber = oldFiber.sibiling;
            const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIndex]);
            // key不相同终止
            if (newFiber === null) {
                break;
            }
            if (shouldTrackSideEffects) {
                // key相同 type不同 没复用成功
                if (oldFiber && newFiber.alternate === null) {
                    deleteChild(returnFiber, oldFiber)
                }
            }
            lastPlaceIndex = placeChild(newFiber, lastPlaceIndex, newIndex);
            if (previousNewFiber === null) {
                resultingFirstChild = newFiber
            } else {
                previousNewFiber.sibiling = newFiber;
            }
            previousNewFiber = newFiber;
            oldFiber = nextOldFiber;
        }

        // TOOD: 第二套方案
        if (oldFiber === null) {
            for (; newIndex < newChildren.length; newIndex++) {
                const newFiber = createChild(returnFiber, newChildren[newIndex]);
                // 没有可服用场景下执行的逻辑
                if (newFiber === null) continue;
                placeChild(newFiber, newIndex);
                if (previousNewFiber === null) {
                    resultingFirstChild = newFiber
                } else {
                    previousNewFiber.sibiling = newFiber;
                }
                previousNewFiber = newFiber;
            }
        }

        // TODO 第三套方案 剩下的老节点还没有经过比较，且新fiber还没有创建完成
        const existingChildren = mapRemainingChildren(returnFiber, oldFiber);

        for (; newIndex < newChildren.length; newIndex++) {
            const newFiber = updateFromMap(existingChildren, returnFiber, newIndex, newChildren[newIndex]);
            if (newFiber !== null) {
                if (shouldTrackSideEffects) {
                    if (newFiber.alternate !== null) {
                        // 复用成功
                        existingChildren.delete(newFiber.key === null ? newIndex : newFiber.key);
                    }
                }
            }
            // 最后一个复用不用改变位置的fiber节点的位置
            lastPlaceIndex = placeChild(newFiber, lastPlaceIndex, newIndex);
            if (previousNewFiber === null) {
                resultingFirstChild = newFiber
            } else {
                previousNewFiber.sibiling = newFiber;
            }
            previousNewFiber = newFiber;
        }

        return resultingFirstChild;
    }

    function placeSingleChild(newFiber) {
        if (shouldTrackSideEffects) {
            newFiber.flags |= Placement;
        }
        return newFiber;
    }

    function reconcilChildFibers(returnFiber, currentFirstFiber, newChild) {
        // dom diff的主要逻辑 
        // 单节点情况
        if (typeof newChild === 'object' && newChild !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE:
                    return placeSingleChild(reconcilSingleElement(returnFiber, currentFirstFiber, newChild));
                default:
                    break;
            }
        }
        // 数组
        if (Array.isArray(newChild)) {
            return reconcileChildrenArray(returnFiber, currentFirstFiber, newChild);
        }
        return null;
    }
    return reconcilChildFibers;
}

export const mountChildFibers = createChildReconciler(false);

export const reconcilChildFibers = createChildReconciler(true);

// 18之前 dom diff 是虚拟dom之间diff
// 18是 老fiber节点 和 新虚拟DOM的比较 (比较是否可以复用)

// key相同 type也相同 可以复用
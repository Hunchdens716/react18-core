import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { createFiberFromElement, createFiberFromText } from "./ReactFiber";
import { Placement } from "./ReactFiberFlags";

function createChildReconciler(shouldTrackSideEffects) {
    function reconcilSingleElement(returnFiber, currentFirstFiber, element) {
        const created = createFiberFromElement(element);
        created.return = returnFiber;
        return created;
    }

    function placeChild(newFiber, index) {
        newFiber.index = index;
        if (shouldTrackSideEffects) {
            newFiber.flags |= Placement;
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

    function reconcileChildrenArray(returnFiber, currentFirstFiber, newChildren) {
        let resultingFirstChild = null;
        let previousNewFiber = null;
        let newIndex = 0
        for (; newIndex < newChildren.length; newIndex++) {
            const newFiber = createChild(returnFiber, newChildren[newIndex]);
            if (newFiber === null) continue;
            placeChild(newFiber, newIndex);
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
        if (typeof newChild === 'object' && newChild !== null) {
            switch (newChild.$$typeof) {
                case REACT_ELEMENT_TYPE:
                    return placeSingleChild(reconcilSingleElement(returnFiber, currentFirstFiber, newChild));
                default:
                    break;
            }
        }
        if (Array.isArray(newChild)) {
            return reconcileChildrenArray(returnFiber, currentFirstFiber, newChild);
        }
        return null;
    }
    return reconcilChildFibers;
}

export const mountChildFibers = createChildReconciler(false);

export const reconcilChildFibers = createChildReconciler(true);
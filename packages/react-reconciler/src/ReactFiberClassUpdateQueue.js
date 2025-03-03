import { markUpdateLaneFromFiberToRoot } from "./ReactFiberConcurrentUpdates";
import { assign } from "shared/assign";

export function initialUpdateQueue(fiber) {
    const queue = {
        shared: {
            pending: null
        }
    }
    fiber.updateQueue = queue
}

export function createUpdate() {
    const update = {

    }

    return update
}

export function enqueueUpdate(fiber, update) {
    const updateQueue = fiber.updateQueue;
    const pending = updateQueue.shared.pending;

    if (pending === null) {
        update.next = update
    } else {
        // 循环链表
        update.next = pending.next;
        pending.next = update
    }
    updateQueue.shared.pending = update;

    return markUpdateLaneFromFiberToRoot(fiber)
}
export function processUpdateQueue(workInProgress) {
    const queue = workInProgress.updateQueue
    const pendingQueue = queue.shared.pending
    if (pendingQueue !== null) {
        queue.shared.pending = null;
        const lastPendingUpdate = pendingQueue;
        const firstPendingUpdate = lastPendingUpdate.next;

        lastPendingUpdate.next = null;
        let newState = workInProgress.memorizedState;
        let update = firstPendingUpdate
        while (update) {
            newState = getStateFromUpdate(update, newState);
            update = update.next;
        }
        workInProgress.memorizedState = newState;
    }

}

function getStateFromUpdate(update, prevState) {
    const { payload } = update;
    return assign({}, prevState, payload)
}
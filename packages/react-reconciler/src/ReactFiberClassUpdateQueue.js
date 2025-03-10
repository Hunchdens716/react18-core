import { markUpdateLaneFromFiberToRoot, enqueueConcurrentClassUpdate } from "./ReactFiberConcurrentUpdates";
import { assign } from "shared/assign";

// 定义状态更新的类型标签
export const UpdateState = 0;

export function initialUpdateQueue(fiber) {
    const queue = { 
        baseState: fiber.memoizedState,
        firstBaseUpdate: null,
        lastBaseUpdate: null,
        shared: {
            pending: null
        }
    }
    fiber.updateQueue = queue
}

export function createUpdate(lane) {
    const update = {
        tag: UpdateState,
        lane,
        next: null
    }

    return update
}

export function enqueueUpdate(fiber, update, lane) {
    // const updateQueue = fiber.updateQueue;
    // const pending = updateQueue.shared.pending;

    // if (pending === null) {
    //     update.next = update
    // } else {
    //     // 循环链表
    //     update.next = pending.next;
    //     pending.next = update
    // }
    // updateQueue.shared.pending = update;

    // return markUpdateLaneFromFiberToRoot(fiber)
    const updateQueue = fiber.updateQueue;
    const sharedQueue = updateQueue.shared;
    return enqueueConcurrentClassUpdate(fiber, sharedQueue, update, lane);
}
export function processUpdateQueue(workInProgress, nextProps, renderLanes) {
    const queue = workInProgress.updateQueue;
    let firstBaseUpdate = queue.firstBaseUpdate;
    let lastBaseUpdate = queue.lastBaseUpdate;
    const pendingQueue = queue.shared.pending;
    if (pendingQueue !== null) {
      queue.shared.pending = null;
      const lastPendingUpdate = pendingQueue;
      const firstPendingUpdate = lastPendingUpdate.next;
      lastPendingUpdate.next = null;
      if (lastBaseUpdate === null) {
        firstBaseUpdate = firstPendingUpdate;
      } else {
        lastBaseUpdate.next = firstPendingUpdate;
      }
      lastBaseUpdate = lastPendingUpdate;
    }
    if (firstBaseUpdate !== null) {
      let newState = queue.baseState;
      let newLanes = NoLanes;
      let newBaseState = null;
      let newFirstBaseUpdate = null;
      let newLastBaseUpdate = null;
      let update = firstBaseUpdate;
      do {
        const updateLane = update.lane;
        // renderLanes 当前渲染的优先级
        if (!isSubsetOfLanes(renderLanes, updateLane)) {
          const clone = {
            id: update.id,
            lane: updateLane,
            payload: update.payload
          };
          if (newLastBaseUpdate === null) {
            newFirstBaseUpdate = newLastBaseUpdate = clone;
            newBaseState = newState;
          } else {
            newLastBaseUpdate = newLastBaseUpdate.next = clone;
          }
          newLanes = mergeLanes(newLanes, updateLane);
        } else {
          if (newLastBaseUpdate !== null) {
            const clone = {
              id: update.id,
              lane: 0,
              payload: update.payload
            };
            newLastBaseUpdate = newLastBaseUpdate.next = clone;
          }
          newState = getStateFromUpdate(update, newState);
        }
        update = update.next;
      } while (update);
      if (!newLastBaseUpdate) {
        newBaseState = newState;
      }
      queue.baseState = newBaseState;
      queue.firstBaseUpdate = newFirstBaseUpdate;
      queue.lastBaseUpdate = newLastBaseUpdate;
      workInProgress.lanes = newLanes;
      workInProgress.memoizedState = newState;
    }
    // const queue = workInProgress.updateQueue
    // const pendingQueue = queue.shared.pending
    // if (pendingQueue !== null) {
    //     queue.shared.pending = null;
    //     const lastPendingUpdate = pendingQueue;
    //     const firstPendingUpdate = lastPendingUpdate.next;

    //     lastPendingUpdate.next = null;
    //     let newState = workInProgress.memorizedState;
    //     let update = firstPendingUpdate
    //     while (update) {
    //         newState = getStateFromUpdate(update, newState);
    //         update = update.next;
    //     }
    //     workInProgress.memorizedState = newState;
    // }

}

function getStateFromUpdate(update, prevState) {
    const { payload } = update;
    return assign({}, prevState, payload)
}
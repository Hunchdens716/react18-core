import { 
    cheduleCallback as Scheduler_scheduleCallback,
    shouldYield,
    ImmediatePriority as ImmediateSchedulerPriority,
    UserBlockingPriority as UserBlockingSchedulerPriority,
    NormalPriority as NormalSchedulerPriority,
    IdlePriority as IdleSchedulerPriority,
} from "scheduler";
import { createWorkInProgress } from "./ReactFiber";
import { begineWork } from "./ReactFiberBeginWork";
import { completeWork } from "./ReactFiberCompleteWork";
import { MutationMask, NoFlags, Passive } from "./ReactFiberFlags";
import {
    commitMutationEffectsOnFiber,
    commitPassiveMountEffects,
    commitPassiveUnmountEffects,
    commitLayoutEffects
} from "./ReactFiberCommitWork";
import { finishQueueingConcurrentUpdates } from "./ReactFiberConcurrentUpdates";
import { getCurrentUpdatePriority } from "./ReactEventPriorities";
import { getHighestPriorityLanes, getNextLanes, markRootUpdated, NoLane, NoLanes, SyncLane } from "./ReactFiberLane";

let workInProgressRoot = null;
let workInProgressRenderLanes = NoLanes;

let workInProgress = null;
let rootDoesHavePassiveEffect = false;
let rootWithPendingPassiveEffects = null;
export function scheduleUpdateOnFiber(root, fiber, lane) {
    markRootUpdated(root, lane);
    ensureRootIsScheduled(root);
}

function ensureRootIsScheduled(root) {
    const nexLanes = getNextLanes(root);
    let newCallbackPriority = getHighestPriorityLanes(nexLanes);
    if (newCallbackPriority === SyncLane) {

    } else {
        let schedulerPriorityLevel;
        switch (lanesToEventPriority(nextLanes)) {
          case DiscreteEventPriority:
            schedulerPriorityLevel = ImmediateSchedulerPriority;
            break;
          case ContinuousEventPriority:
            schedulerPriorityLevel = UserBlockingSchedulerPriority;
            break;
          case DefaultEventPriority:
            schedulerPriorityLevel = NormalSchedulerPriority;
            break;
          case IdleEventPriority:
            schedulerPriorityLevel = IdleSchedulerPriority;
            break;
          default:
            schedulerPriorityLevel = NormalSchedulerPriority;
            break;
        }
        scheduleCallback(schdulerPriorityLevel, performConcurrentWorkOnRoot.bind(null, root));
    }
    // scheduleCallback(performConcurrentWorkOnRoot.bind(null, root));
    
}

function performConcurrentWorkOnRoot(root, timeout) {
    const nextLanes = getNextLanes(root, NoLanes);
    if (nextLanes === NoLanes) {
        return null
    }
    // fiber构建处理
    renderRootSync(root, nextLanes);

    root.finishedWork = root.current.alternate;

    commitRoot(root) // 渲染好的挂载到页面上

}

function renderRootSync(root, renderLanes) {
    prepareFreshStack(root, renderLanes);

    workLoopSync()
}

// 提交根节点
function commitRoot(root) {
    const { finishedWork } = root;

    if ((finishedWork.subtreeFlags & Passive) !== NoFlags || finishedWork.flags & Passive !== NoFlags) {
        if (!rootDoesHavePassiveEffect) {
            rootDoesHavePassiveEffect = true;
            // scheduleCallback(flushPassiveEffect);
            scheduleCallback(NormalSchedulerPriority, flushPassiveEffect);
        }
    }

    const subtreeHasEffects = (finishedWork.subtreeFlags & MutationMask) != NoFlags;
    const rootHasEffect = (finishedWork.flags & MutationMask) != NoFlags;
    if (subtreeHasEffects || rootHasEffect) {
        commitMutationEffectsOnFiber(finishedWork, root);
        commitLayoutEffects(finishedWork, root);
        if (rootDoesHavePassiveEffect) {
            rootDoesHavePassiveEffect = false;
            rootWithPendingPassiveEffects = root;
        }
    }
    root.current = finishedWork;
}

function flushPassiveEffect() {
    if (rootWithPendingPassiveEffects !== null) {
        const root = rootWithPendingPassiveEffects;
        commitPassiveUnmountEffects(root, root.current);
        commitPassiveMountEffects(root, root.current);
    }
}

function prepareFreshStack(root, renderLanes) {
    if (root !== workInProgressRoot || workInProgressRenderLanes !== renderLanes) {
        workInProgress = createWorkInProgress(root.current, null);
    }
    // 创建alternate fiber树
    // workInProgress = createWorkInProgress(root.current, null);
    workInProgressRenderLanes = renderLanes;
    finishQueueingConcurrentUpdates();
}

function workLoopSync() {
    while (workInProgress !== null) {
        preformUnitOfWork(workInProgress);
    }
}

function preformUnitOfWork(unitOfWork) {
    const current = unitOfWork.alternate;
    const next = begineWork(current, unitOfWork); // 返回子fiber
    unitOfWork.memorizedProps = unitOfWork.pendingProps;

    // workInProgress = null;
    if (next === null) {
        completeUnitOfWork(unitOfWork);
    } else {
        workInProgress = next;
    }
}

function completeUnitOfWork(unitOfWork) {
    let completedWork = unitOfWork;
    do {
        const current = completedWork.alternate;
        const returnFiber = completedWork.return;

        completeWork(current, completedWork);

        const sibilingFiber = completedWork.sibiling;
        if (sibilingFiber !== null) {
            // 重新回去遍历
            workInProgress = sibilingFiber;
            return;
        }
        // 去执行父节点
        completedWork = returnFiber;
        workInProgress = completedWork;
    } while (completedWork !== null)
}

export function requestUpdateLane() {
    const updateLane = getCurrentUpdatePriority();
    if (updateLane !== NoLane) {
        return updateLane;
    }

    const eventLane = getCurrentEventPriority(); 
    return eventLane;
}
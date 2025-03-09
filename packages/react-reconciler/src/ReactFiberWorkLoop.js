import { scheduleCallback } from "scheduler";
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

let workInProgress = null;
let rootDoesHavePassiveEffect = false;
let rootWithPendingPassiveEffects = null;
export function scheduleUpdateOnFiber(root) {
    // 
    ensureRootIsScheduled(root);
}

function ensureRootIsScheduled(root) {
    scheduleCallback(performConcurrentWorkOnRoot.bind(null, root));
}

function performConcurrentWorkOnRoot(root) {
    // fiber构建处理
    renderRootSync(root);

    root.finishedWork = root.current.alternate;

    commitRoot(root) // 渲染好的挂载到页面上

}

function renderRootSync(root) {
    prepareFreshStack(root);

    workLoopSync()
}

// 提交根节点
function commitRoot(root) {
    const { finishedWork } = root;

    if ((finishedWork.subtreeFlags & Passive) !== NoFlags || finishedWork.flags & Passive !== NoFlags) {
        if (!rootDoesHavePassiveEffect) {
            rootDoesHavePassiveEffect = true;
            scheduleCallback(flushPassiveEffect);
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

function prepareFreshStack(root) {
    // 创建alternate fiber树
    workInProgress = createWorkInProgress(root.current, null);
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
import { scheduleCallback } from "scheduler";
import { createWorkInProgress } from "./ReactFiber";
import { begineWork } from "./ReactFiberBeginWork";
import { completeWork } from "./ReactFiberCompleteWork";
import { MutationMask, NoFlags } from "./ReactFiberFlags";
import { commitMutationEffectsOnFiber } from "./ReactFiberCommitWork";

let workInProgress = null;
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
    const subtreeHasEffects = (finishedWork.subtreeFlags & MutationMask) != NoFlags;
    const rootHasEffect = (finishedWork.flags & MutationMask) != NoFlags;
    if (subtreeHasEffects || rootHasEffect) {
        commitMutationEffectsOnFiber(finishedWork, root);
    }
    root.current = finishedWork;
}

function prepareFreshStack(root) {
    // 创建alternate fiber树
    workInProgress = createWorkInProgress(root.current, null);
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
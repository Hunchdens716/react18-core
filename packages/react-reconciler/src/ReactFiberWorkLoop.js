import { scheduleCallback } from "scheduler";
import { createWorkInProgress } from "./ReactFiber";
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

    root.finishedWork  = root.current.alternate;

    // commitRoot(root) // 渲染好的挂载到页面上

}

function renderRootSync(root) {
    prepareFreshStack(root);

    workLoopSync()
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
    const next = begineWork(current, unitOfWork);
    unitOfWork.memorizedProps = unitOfWork.pendingProps;
    if (next === null) {
        completeUnitOfWork(unitOfWork);
    } else {
        workInProgress = next;
    }
}

function completeUnitOfWork(unitOfWork) {
    console.log("开始complete阶段")
}
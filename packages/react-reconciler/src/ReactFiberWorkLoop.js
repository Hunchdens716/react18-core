import { scheduleCallback } from "scheduler";

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
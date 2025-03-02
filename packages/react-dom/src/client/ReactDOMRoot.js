import { createContainer, updateContainer } from "react-reconciler/src/ReactFiberReconciler";

function ReactDOMRoot(internalRoot) {
    this._internalRoot = internalRoot;
}

ReactDOMRoot.prototype.render = function(children) {
    /**
     * 渲染阶段 begineWork completeWork
     * 提交阶段 commitWork 
     * 
     * 虚拟dom -> fiber树 -> 真实dom
     * begineWork 虚拟dom -> fiber树 挂载上去
     * completeWork fiber树 —> 真实dom 
     * commitWork 挂载上去
     */
    const root = this._internalRoot;
    updateContainer(children, root);
}

export function createRoot(container) {
    const root = createContainer(container);
    return new ReactDOMRoot(root);
}
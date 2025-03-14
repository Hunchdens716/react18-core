// import assign from "shared/assign";

// 定义两个返回特定布尔值的函数
function functionThatReturnsTrue() {
    return true;
}
function functionThatReturnsFalse() {
    return false;
}

// 定义一个接口，用来表示鼠标事件的某些属性
const MouseEventInterface = {
    clientX: 0,
    clientY: 0
}

/**
 * 创建一个合成事件类。
 * 
 * @param {Object} Interface - 事件接口，定义了事件应有的属性。
 * @returns {function} - 返回的函数是一个合成事件类的构造器。
 */
function createSyntheticEvent(Interface) {
    /**
     * SyntheticBaseEvent 类表示一个合成事件。
     * 
     * @param {string} reactName - React事件的名称。
     * @param {string} reactEventType - React事件类型。
     * @param {Object} targetInst - 目标实例。
     * @param {Event} nativeEvent - 原生的浏览器事件对象。
     * @param {Object} nativeEventTarget - 原生事件的目标对象。
     */
    function SyntheticBaseEvent(
        reactName, reactEventType, targetInst, nativeEvent, nativeEventTarget) {
        this._reactName = reactName;
        this.type = reactEventType;
        this._targetInst = targetInst;
        this.nativeEvent = nativeEvent;
        this.target = nativeEventTarget;
        // 对于接口中定义的每一个属性，都将其值从原生事件对象中拷贝过来
        for (const propName in Interface) {
            if (!Interface.hasOwnProperty(propName)) {
                continue;
            }
            this[propName] = nativeEvent[propName]
        }
        // 初始状态下，事件的默认行为不被阻止，事件传播也没有被停止
        this.isDefaultPrevented = functionThatReturnsFalse;
        this.isPropagationStopped = functionThatReturnsFalse;
        return this;
    }
    // 为合成事件类的原型添加 preventDefault 和 stopPropagation 方法
    Object.assign(SyntheticBaseEvent.prototype, {
        preventDefault() {
            const event = this.nativeEvent;
            if (event.preventDefault) {
                event.preventDefault();
            } else {
                event.returnValue = false;
            }
            this.isDefaultPrevented = functionThatReturnsTrue;
        },
        stopPropagation() {
            const event = this.nativeEvent;
            if (event.stopPropagation) {
                event.stopPropagation();
            } else {
                event.cancelBubble = true;
            }
            this.isPropagationStopped = functionThatReturnsTrue;
        }
    });
    return SyntheticBaseEvent;
}

// 使用鼠标事件接口创建一个合成鼠标事件类
export const SyntheticMouseEvent = createSyntheticEvent(MouseEventInterface);
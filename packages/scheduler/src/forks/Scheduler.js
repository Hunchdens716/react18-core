import { push, peek, pop } from './SchedulerMinHeap';
import {
  ImmediatePriority, UserBlockingPriority, NormalPriority, LowPriority,
  IdlePriority
} from './SchedulerPriorities';

/**
 * 获取当前时间
 * @returns {number} 当前时间，以毫秒为单位
 */
function getCurrentTime() {
  return performance.now();
}

var maxSigned31BitInt = 1073741823;
var IMMEDIATE_PRIORITY_TIMEOUT = -1;
var USER_BLOCKING_PRIORITY_TIMEOUT = 250;
var NORMAL_PRIORITY_TIMEOUT = 5000;
var LOW_PRIORITY_TIMEOUT = 10000;
var IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;
let taskIdCounter = 1;
const taskQueue = [];
let scheduleHostCallback = null;
let startTime = -1;
let currentTask = null;
const frameInterval = 5;

const channel = new MessageChannel();
var port2 = channel.port2;
var port1 = channel.port1;
port1.onmessage = performWorkUntilDeadline;

/**
 * 调度回调函数
 * @param {ImmediatePriority | UserBlockingPriority | NormalPriority | LowPriority | IdlePriority} priorityLevel - 优先级
 * @param {Function} callback - 要执行的回调函数
 * @returns {Object} 新创建的任务对象
 */
export function scheduleCallback(priorityLevel, callback) {
  const currentTime = getCurrentTime();
  const startTime = currentTime;
  let timeout;
  switch (priorityLevel) {
    case ImmediatePriority:
      timeout = IMMEDIATE_PRIORITY_TIMEOUT;
      break;
    case UserBlockingPriority:
      timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
      break;
    case IdlePriority:
      timeout = IDLE_PRIORITY_TIMEOUT;
      break;
    case LowPriority:
      timeout = LOW_PRIORITY_TIMEOUT;
      break;
    case NormalPriority:
    default:
      timeout = NORMAL_PRIORITY_TIMEOUT;
      break;
  }
  const expirationTime = startTime + timeout; // 过期时间 
  const newTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: expirationTime
  }
  push(taskQueue, newTask);
  requestHostCallback(workLoop);
  return newTask;
}

/**
 * 判断是否应该交还控制权给主机
 * @returns {boolean} 如果应该交还控制权给主机，则返回 true；否则返回 false
 */
function shouldYieldToHost() {
  const timeElapsed = getCurrentTime() - startTime;
  // 浏览器时间间隙小于5s
  if (timeElapsed < frameInterval) {
    return false;
  }
  return true;
}

/**
 * 工作循环，执行任务队列中的任务
 * @param {number} startTime - 工作循环的开始时间
 * @returns {boolean} 如果还有未完成的任务，返回 true；否则返回 false
 */
function workLoop(startTime) {
  let currentTime = startTime;
  currentTask = peek(taskQueue);
  while (currentTask !== null) {
    if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
      break;
    }
    const callback = currentTask.callback;
    if (typeof callback === 'function') {
      currentTask.callback = null;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      const continuationCallback = callback(didUserCallbackTimeout);
      if (typeof continuationCallback === 'function') {
        // 停了又开始执行
        currentTask.callback = continuationCallback;
        return true;
      }
      if (currentTask === peek(taskQueue)) {
        pop(taskQueue);
      }
    } else {
      pop(taskQueue);
    }
    currentTask = peek(taskQueue);
  }
  // 之前的break,没有完成执行完
  if (currentTask !== null) {
    return true;
  }
  return false;
}

/**
 * 请求主机回调
 * @param {Function} workLoop - 工作循环函数
 */
function requestHostCallback(workLoop) {
  scheduleHostCallback = workLoop;
  schedulePerformWorkUntilDeadline();
}

/**
 * 安排执行工作直到截止时间
 */
function schedulePerformWorkUntilDeadline() {
    // 类似setTimeout的宏任务 
  port2.postMessage(null);
}

/**
 * 执行工作直到截止时间
 */
function performWorkUntilDeadline() {
  if (scheduleHostCallback) {
    startTime = getCurrentTime();
    let hasMoreWork = true;
    try {
      hasMoreWork = scheduleHostCallback(startTime);
    } finally {
      if (hasMoreWork) {
        // 如果有任务
        schedulePerformWorkUntilDeadline();
      } else {
        scheduleHostCallback = null;
      }
    }
  }
}

export {
  scheduleCallback as unstable_scheduleCallback,
  shouldYieldToHost as unstable_shouldYield,
  ImmediatePriority as unstable_ImmediatePriority,
  UserBlockingPriority as unstable_UserBlockingPriority,
  NormalPriority as unstable_NormalPriority,
  LowPriority as unstable_LowPriority,
  IdlePriority as unstable_IdlePriority
}
/**
 * 状态显示管理模块
 */

/**
 * 显示状态消息
 * @param {string} message - 要显示的消息
 * @param {string} type - 消息类型 ('info', 'success', 'error')
 */
export function showStatus(message, type = 'info') {
    const statusArea = document.getElementById('statusArea');
    statusArea.className = `status-${type}`;
    statusArea.innerHTML = message;
}

/**
 * 追加状态消息
 * @param {string} message - 要追加的消息
 */
export function appendStatus(message) {
    const statusArea = document.getElementById('statusArea');
    statusArea.innerHTML += message;
}

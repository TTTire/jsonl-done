/**
 * 日期工具模块
 */

/**
 * 格式化日期为 YYYYMMDD 格式
 * @param {string} dateString - 日期字符串 (ISO 格式)
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

/**
 * 获取今天的日期 (ISO 格式)
 * @returns {string} 今天的日期字符串
 */
export function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

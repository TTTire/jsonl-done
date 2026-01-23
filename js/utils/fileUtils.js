/**
 * 文件处理工具模块
 */

/**
 * 下载文件
 * @param {string} content - 文件内容
 * @param {string} fileName - 文件名
 */
export function downloadFile(content, fileName) {
    const blob = new Blob([content], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * 将数组按指定大小分块
 * @param {Array} array - 要分块的数组
 * @param {number} chunkSize - 每块的大小
 * @returns {Array<Array>} 分块后的数组
 */
export function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

/**
 * 计算 UTF-8 字符串的字节长度
 * @param {string} str - 要计算的字符串
 * @returns {number} 字节长度
 */
export function utf8ByteLength(str) {
    return new TextEncoder().encode(str).length;
}

/**
 * 读取文件内容
 * @param {File} file - 文件对象
 * @returns {Promise<string>} 文件内容
 */
export function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsText(file);
    });
}

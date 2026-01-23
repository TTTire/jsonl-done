/**
 * 文件信息生成模块
 */

import { functionConfig } from '../config/functionConfig.js';

/**
 * 生成处理信息
 * @param {File} file - 原始文件
 * @param {number} totalLines - 总行数
 * @param {Array<string>} selectedFunctions - 选中的功能列表
 * @param {number} totalFiles - 生成文件数量
 * @param {Object} options - 处理选项
 */
export function generateFileInfo(file, totalLines, selectedFunctions, totalFiles, options) {
    const functionDescriptions = selectedFunctions.map(func => {
        const config = functionConfig[func];
        let desc = `• ${config.name}: ${config.description}`;

        if (func === 'dateInsert') desc += ` (插入日期: ${options.currentDate})`;
        if (func === 'promptTruncate') desc += ` (截断长度: ${options.truncateLength}字符)`;
        if (func === 'fileSplit') desc += ` (每份文件: ${options.splitCount}行)`;

        return desc;
    }).join('<br>');

    const fileInfo = `
        <div class="file-info">
            <strong>处理摘要：</strong><br>
            • 原始文件：${file.name}<br>
            • 总行数：${totalLines}<br>
            • 生成文件：${totalFiles} 个<br>
            • 启用功能：<br>${functionDescriptions}
        </div>
    `;

    // 追加到状态区域
    const statusArea = document.getElementById('statusArea');
    statusArea.innerHTML += fileInfo;
}

/**
 * 生成过滤功能的处理信息
 * @param {File} file - 原始文件
 * @param {number} totalLines - 总行数
 * @param {Array<string>} selectedFunctions - 选中的功能列表
 * @param {Object} filterResult - 过滤结果 {retained, filtered}
 */
export function generateFilterFileInfo(file, totalLines, selectedFunctions, filterResult) {
    const functionDescriptions = selectedFunctions.map(func => {
        const config = functionConfig[func];
        let desc = `• ${config.name}: ${config.description}`;

        if (func === 'rowSizeFilter') desc += ` (阈值: ${document.getElementById('maxRowSizeInput').value} MB)`;
        if (func === 'promptLengthFilter') desc += ` (限制: 20480 字节)`;

        return desc;
    }).join('<br>');

    const fileInfo = `
        <div class="file-info">
            <strong>处理摘要：</strong><br>
            • 原始文件：${file.name}<br>
            • 总行数：${totalLines}<br>
            • 保留行数：${filterResult.retained.length} 行<br>
            • 过滤行数：${filterResult.filtered.length} 行<br>
            • 启用功能：<br>${functionDescriptions}
        </div>
    `;

    // 追加到状态区域
    const statusArea = document.getElementById('statusArea');
    statusArea.innerHTML += fileInfo;
}

/**
 * 主处理流程编排模块
 * 负责协调所有功能模块的执行
 */

import { processors } from '../modules/index.js';
import { showStatus } from '../ui/statusManager.js';

/**
 * 验证处理选项
 * @param {Array<string>} selectedFunctions - 选中的功能列表
 * @param {Object} options - 处理选项
 * @throws {Error} 如果验证失败
 */
function validateOptions(selectedFunctions, options) {
    if (selectedFunctions.includes('dateInsert') && !options.currentDate) {
        throw new Error('请选择插入日期');
    }

    if (selectedFunctions.includes('promptTruncate') && (!options.truncateLength || options.truncateLength < 1)) {
        throw new Error('请输入有效的截断长度');
    }

    if (selectedFunctions.includes('fileSplit') && (!options.splitCount || options.splitCount < 1)) {
        throw new Error('请输入有效的切分行数');
    }

    if (selectedFunctions.includes('rowSizeFilter') && (!options.maxRowSize || options.maxRowSize < 0.001)) {
        throw new Error('请输入有效的大小阈值');
    }
}

/**
 * 处理文件的主流程
 * @param {File} file - 文件对象
 * @param {Array<string>} selectedFunctions - 选中的功能列表
 * @param {Object} options - 处理选项
 * @returns {Promise<Object>} 处理结果 { processedObjects, chunks, filterResult }
 */
export async function processFile(file, selectedFunctions, options) {
    // 验证输入
    validateOptions(selectedFunctions, options);

    // 检测是否有过滤功能
    const hasFilterFunction = selectedFunctions.includes('rowSizeFilter') ||
                              selectedFunctions.includes('promptLengthFilter');

    // 解析文件
    showStatus('正在解析文件内容...', 'info');
    const jsonObjects = await import('./fileParser.js').then(m => m.parseJsonlFile(file));
    showStatus(`成功解析 ${jsonObjects.length} 行数据，正在处理...`, 'info');

    // 准备处理选项
    const processOptions = {
        currentDate: selectedFunctions.includes('dateInsert') ? options.currentDate : null,
        truncateLength: selectedFunctions.includes('promptTruncate') ? options.truncateLength : null,
        splitCount: selectedFunctions.includes('fileSplit') ? options.splitCount : null,
        maxRowSize: selectedFunctions.includes('rowSizeFilter') ? options.maxRowSize : null,
        maxPromptLength: selectedFunctions.includes('promptLengthFilter') ? 20480 : null,
        splitEnabled: selectedFunctions.includes('fileSplit'),
        isFilterResult: false,
        file: file,
        fieldConfig: options.fieldConfig || null
    };

    // 首先声明 processedObjects
    let processedObjects = [...jsonObjects];
    let filterResult = { retained: [], filtered: [] };

    // 应用字段重排和重命名（首先执行）
    if (processOptions.fieldConfig) {
        showStatus('正在应用字段配置...', 'info');
        processedObjects = processedObjects.map(obj => processors.fieldReorder.process(obj, processOptions));
    }

    // 先执行过滤功能（如果有）
    if (hasFilterFunction) {
        filterResult = { retained: processedObjects, filtered: [] };

        if (selectedFunctions.includes('rowSizeFilter')) {
            showStatus('正在按数据行大小过滤...', 'info');
            const result = processors.rowSizeFilter.processAll(filterResult.retained, processOptions);
            filterResult.retained = result.retained;
            filterResult.filtered = [...filterResult.filtered, ...result.filtered];
        }

        if (selectedFunctions.includes('promptLengthFilter')) {
            showStatus('正在按 prompt 长度过滤...', 'info');
            const result = processors.promptLengthFilter.processAll(filterResult.retained, processOptions);
            filterResult.retained = result.retained;
            filterResult.filtered = [...filterResult.filtered, ...result.filtered];
        }

        // 对过滤后的保留数据继续处理
        processedObjects = filterResult.retained;
    }

    // 执行其他功能（日期插入、Reference 字段添加、Prompt 截断）
    if (selectedFunctions.includes('dateInsert')) {
        showStatus('正在插入日期...', 'info');
        processedObjects = processedObjects.map(obj => processors.dateInsert.process(obj, processOptions));
    }

    if (selectedFunctions.includes('referenceField')) {
        showStatus('正在添加reference字段...', 'info');
        processedObjects = processedObjects.map(obj => processors.referenceField.process(obj, processOptions));
    }

    if (selectedFunctions.includes('promptTruncate')) {
        showStatus('正在截断prompt字段...', 'info');
        processedObjects = processedObjects.map(obj => processors.promptTruncate.process(obj, processOptions));
    }

    // 处理文件切分
    let chunks;
    if (selectedFunctions.includes('fileSplit')) {
        showStatus('正在切分文件...', 'info');
        chunks = processors.fileSplit.process(processedObjects, processOptions);
    } else {
        chunks = [processedObjects];
    }

    return {
        processedObjects,
        chunks,
        filterResult,
        hasFilterFunction,
        processOptions
    };
}

/**
 * 执行批量下载
 * @param {Array|Object} chunks - 数据块或过滤结果
 * @param {Object} options - 处理选项
 */
export function executeDownload(chunks, options) {
    processors.batchDownload.execute(chunks, options);
}

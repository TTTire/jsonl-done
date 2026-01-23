/**
 * 模块注册中心
 * 统一导入和导出所有处理模块
 */

// 导入处理器模块
import dateInsertProcessor from './processors/dateInsertProcessor.js';
import promptTruncateProcessor from './processors/promptTruncateProcessor.js';
import referenceFieldProcessor from './processors/referenceFieldProcessor.js';
import rowSizeFilterProcessor from './processors/rowSizeFilterProcessor.js';
import promptLengthFilterProcessor from './processors/promptLengthFilterProcessor.js';

// 导入文件操作模块
import fileSplitModule from './fileOperations/fileSplitModule.js';
import batchDownloadModule from './fileOperations/batchDownloadModule.js';

/**
 * 所有处理器模块的注册表
 */
export const processors = {
    dateInsert: dateInsertProcessor,
    promptTruncate: promptTruncateProcessor,
    referenceField: referenceFieldProcessor,
    rowSizeFilter: rowSizeFilterProcessor,
    promptLengthFilter: promptLengthFilterProcessor,
    fileSplit: fileSplitModule,
    batchDownload: batchDownloadModule
};

/**
 * 注册新的处理器模块
 * @param {string} name - 处理器名称
 * @param {Object} processor - 处理器对象
 */
export function registerProcessor(name, processor) {
    processors[name] = processor;
}

/**
 * 获取处理器模块
 * @param {string} name - 处理器名称
 * @returns {Object|undefined} 处理器对象
 */
export function getProcessor(name) {
    return processors[name];
}

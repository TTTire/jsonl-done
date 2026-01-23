/**
 * 文件切分模块
 * 按指定行数将处理后的数据切分成多个文件
 */

import { chunkArray } from '../../utils/fileUtils.js';

export default {
    name: '文件切分',
    description: '按指定行数将处理后的数据切分成多个文件',

    /**
     * 处理对象数组（切分功能）
     * @param {Array} processedObjects - 要切分的对象数组
     * @param {Object} options - 处理选项
     * @param {number} options.splitCount - 每份文件的行数
     * @returns {Array<Array>} 切分后的数组
     */
    process(processedObjects, options) {
        const splitCount = options.splitCount || 100;
        return chunkArray(processedObjects, splitCount);
    }
};

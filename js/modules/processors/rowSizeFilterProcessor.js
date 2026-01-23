/**
 * 数据行大小过滤处理器
 * 过滤掉超过指定大小的数据行
 */

import { utf8ByteLength } from '../../utils/fileUtils.js';

export default {
    name: '数据行大小过滤',
    description: '过滤掉超过指定大小的数据行',

    /**
     * 处理对象数组（过滤功能）
     * @param {Array} objects - 要处理的对象数组
     * @param {Object} options - 处理选项
     * @param {number} options.maxRowSize - 最大行大小（MB）
     * @returns {Object} 包含 retained 和 filtered 数组的对象
     */
    processAll(objects, options) {
        const maxSizeBytes = options.maxRowSize * 1024 * 1024;
        const retained = [];
        const filtered = [];

        objects.forEach(obj => {
            const jsonString = JSON.stringify(obj);
            const byteSize = utf8ByteLength(jsonString);

            if (byteSize > maxSizeBytes) {
                filtered.push(obj);
            } else {
                retained.push(obj);
            }
        });

        return { retained, filtered };
    }
};

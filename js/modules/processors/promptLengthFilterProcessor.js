/**
 * Prompt 长度过滤处理器
 * 过滤掉 prompt 字段超过指定长度的数据行
 */

import { utf8ByteLength } from '../../utils/fileUtils.js';

export default {
    name: 'Prompt 长度过滤',
    description: '过滤掉 prompt 字段超过 20480 字节的数据行',

    /**
     * 处理对象数组（过滤功能）
     * @param {Array} objects - 要处理的对象数组
     * @param {Object} options - 处理选项
     * @param {number} options.maxPromptLength - 最大 prompt 长度（字节）
     * @returns {Object} 包含 retained 和 filtered 数组的对象
     */
    processAll(objects, options) {
        const maxLength = options.maxPromptLength;
        const retained = [];
        const filtered = [];

        objects.forEach(obj => {
            const promptLength = obj.prompt ? utf8ByteLength(obj.prompt) : 0;

            if (promptLength > maxLength) {
                filtered.push(obj);
            } else {
                retained.push(obj);
            }
        });

        return { retained, filtered };
    }
};

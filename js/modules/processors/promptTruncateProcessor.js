/**
 * Prompt 截断处理器
 * 将 prompt 字段截断为指定字符数
 */

export default {
    name: 'Prompt截断',
    description: '将 prompt 字段截断为指定字符数',

    /**
     * 处理单个对象
     * @param {Object} obj - 要处理的对象
     * @param {Object} options - 处理选项
     * @param {number} options.truncateLength - 截断长度
     * @returns {Object} 处理后的对象
     */
    process(obj, options) {
        const truncateLength = options.truncateLength || 10;
        const newObj = { ...obj };

        if (obj.prompt) {
            newObj.prompt = obj.prompt.substring(0, truncateLength);
        }

        return newObj;
    }
};

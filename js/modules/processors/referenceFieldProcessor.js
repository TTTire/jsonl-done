/**
 * Reference 字段添加处理器
 * 将完整的 prompt 内容保存到 reference 字段
 */

export default {
    name: 'Reference字段添加',
    description: '将完整的 prompt 内容保存到 reference 字段',

    /**
     * 处理单个对象
     * @param {Object} obj - 要处理的对象
     * @param {Object} options - 处理选项
     * @returns {Object} 处理后的对象
     */
    process(obj, options) {
        const newObj = { ...obj };

        if (obj.prompt) {
            newObj.reference = obj.prompt;
        } else {
            newObj.reference = '';
        }

        return newObj;
    }
};

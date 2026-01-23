/**
 * 日期插入处理器
 * 在 internal_id 字段最后一个下划线前插入日期
 */

export default {
    name: '日期插入',
    description: '在 internal_id 字段最后一个下划线前插入用户选择的日期',

    /**
     * 处理单个对象
     * @param {Object} obj - 要处理的对象
     * @param {Object} options - 处理选项
     * @param {string} options.currentDate - 要插入的日期 (YYYYMMDD 格式)
     * @returns {Object} 处理后的对象
     */
    process(obj, options) {
        const originalInternalId = obj['internal_id'] || 'unknown';
        const currentDate = options.currentDate;

        let newInternalId;
        if (originalInternalId !== 'unknown') {
            const lastUnderscoreIndex = originalInternalId.lastIndexOf('_');
            if (lastUnderscoreIndex !== -1) {
                const beforeLastUnderscore = originalInternalId.substring(0, lastUnderscoreIndex);
                const afterLastUnderscore = originalInternalId.substring(lastUnderscoreIndex);
                newInternalId = `${beforeLastUnderscore}_${currentDate}${afterLastUnderscore}`;
            } else {
                newInternalId = `${originalInternalId}_${currentDate}`;
            }
        } else {
            newInternalId = `unknown_${currentDate}`;
        }

        return { ...obj, 'internal_id': newInternalId };
    }
};

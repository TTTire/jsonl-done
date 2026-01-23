/**
 * 字段重排处理器
 * 根据字段编辑器的配置重新排列和重命名字段
 */

export default {
    name: '字段重排',
    description: '根据字段编辑器的配置重新排列和重命名字段',

    /**
     * 处理单个对象
     * @param {Object} obj - 要处理的对象
     * @param {Object} options - 处理选项
     * @param {Object} options.fieldConfig - 字段配置对象
     * @returns {Object} 处理后的对象
     */
    process(obj, options) {
        // 如果没有字段配置，直接返回原对象
        if (!options.fieldConfig) {
            return obj;
        }

        const { fieldMapping, fieldOrder, deletedFields, newFields } = options.fieldConfig;
        const result = {};

        // 按指定顺序构建新对象
        fieldOrder.forEach(originalName => {
            // 处理新增字段
            if (newFields && newFields.hasOwnProperty(originalName)) {
                const fieldConfig = newFields[originalName];
                let fieldValue;

                if (fieldConfig && typeof fieldConfig === 'object' && fieldConfig.isDynamic) {
                    // 动态模式：从源字段复制值
                    fieldValue = this.getValueByPath(obj, fieldConfig.sourceField);
                } else {
                    // 固定值模式（向后兼容字符串类型）
                    fieldValue = typeof fieldConfig === 'object' ? fieldConfig.defaultValue : fieldConfig;
                }

                // 使用映射后的名称
                const newName = fieldMapping[originalName] || originalName;
                result[newName] = fieldValue;
                return;
            }

            // 跳过已删除的字段
            if (deletedFields && deletedFields.includes(originalName)) return;

            // 通过路径获取值（支持嵌套字段）
            const value = this.getValueByPath(obj, originalName);
            if (value === undefined) return;

            // 使用映射后的名称
            const newName = fieldMapping[originalName] || originalName;
            result[newName] = value;
        });

        return result;
    },

    /**
     * 通过路径获取对象中的值
     * 支持嵌套访问，如 "user.name" -> obj.user.name
     * @param {Object} obj - 源对象
     * @param {string} path - 字段路径，用点分隔
     * @returns {*} 字段值，如果路径不存在则返回 undefined
     */
    getValueByPath(obj, path) {
        const keys = path.split('.');
        let value = obj;

        for (const key of keys) {
            if (value === null || value === undefined) {
                return undefined;
            }
            value = value[key];
        }

        return value;
    }
};

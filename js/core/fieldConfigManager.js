/**
 * 字段配置管理器
 * 管理字段映射、顺序、删除状态，支持 localStorage 持久化
 */

const STORAGE_KEY_PREFIX = 'jsonl_field_config_';

/**
 * 字段配置管理器类
 */
export class FieldConfigManager {
    constructor() {
        this.config = {
            originalFields: [],      // 原始字段列表
            fieldMapping: {},         // 字段映射 { original: renamed }
            fieldOrder: [],           // 字段顺序
            deletedFields: [],        // 已删除字段
            newFields: {}            // 新增字段 { fieldName: defaultValue }
        };
    }

    /**
     * 初始化字段配置
     * @param {Array<string>} fields - 字段名数组
     */
    initializeConfig(fields) {
        this.config.originalFields = [...fields];
        this.config.fieldOrder = [...fields];
        this.config.fieldMapping = {};
        fields.forEach(field => {
            this.config.fieldMapping[field] = field;
        });
        this.config.deletedFields = [];
        this.config.newFields = {};
    }

    /**
     * 更新字段映射（重命名）
     * @param {string} originalName - 原始字段名
     * @param {string} newName - 新字段名
     * @returns {boolean} 是否有变化
     */
    updateFieldMapping(originalName, newName) {
        // 检查是否与其他字段重名
        const existingOriginal = Object.keys(this.config.fieldMapping).find(
            key => key !== originalName && this.config.fieldMapping[key] === newName
        );

        if (existingOriginal) {
            throw new Error(`字段名 "${newName}" 已被使用`);
        }

        if (this.config.fieldMapping[originalName] !== newName) {
            this.config.fieldMapping[originalName] = newName;
            return true;
        }
        return false;
    }

    /**
     * 删除字段
     * @param {string} fieldName - 字段名
     * @returns {boolean} 是否成功删除
     */
    deleteField(fieldName) {
        if (!this.config.deletedFields.includes(fieldName)) {
            this.config.deletedFields.push(fieldName);
            // 从字段顺序中移除
            this.config.fieldOrder = this.config.fieldOrder.filter(f => f !== fieldName);
            return true;
        }
        return false;
    }

    /**
     * 恢复已删除的字段
     * @param {string} fieldName - 字段名
     */
    restoreField(fieldName) {
        this.config.deletedFields = this.config.deletedFields.filter(f => f !== fieldName);
        // 恢复到字段顺序末尾
        if (!this.config.fieldOrder.includes(fieldName)) {
            this.config.fieldOrder.push(fieldName);
        }
    }

    /**
     * 更新字段顺序
     * @param {Array<string>} newOrder - 新的字段顺序
     */
    updateFieldOrder(newOrder) {
        // 过滤掉已删除的字段，保留原始字段和新字段
        this.config.fieldOrder = newOrder.filter(f =>
            !this.config.deletedFields.includes(f) ||
            this.config.newFields.hasOwnProperty(f)
        );
    }

    /**
     * 新增字段
     * @param {string} fieldName - 字段名
     * @param {*} defaultValue - 默认值
     * @param {string|null} sourceField - 源字段名（用于动态复制值）
     * @returns {boolean} 是否成功添加
     */
    addNewField(fieldName, defaultValue = '', sourceField = null) {
        // 检查字段名是否已存在
        if (this.config.fieldMapping.hasOwnProperty(fieldName) ||
            this.config.newFields.hasOwnProperty(fieldName)) {
            throw new Error(`字段名 "${fieldName}" 已存在`);
        }

        if (sourceField !== null) {
            // 动态字段模式：从源字段复制值
            this.config.newFields[fieldName] = {
                defaultValue: defaultValue,
                sourceField: sourceField,
                isDynamic: true
            };
        } else {
            // 固定值模式
            this.config.newFields[fieldName] = defaultValue;
        }
        this.config.fieldOrder.push(fieldName);
        return true;
    }

    /**
     * 移除新增的字段
     * @param {string} fieldName - 字段名
     * @returns {boolean} 是否成功移除
     */
    removeNewField(fieldName) {
        if (this.config.newFields.hasOwnProperty(fieldName)) {
            delete this.config.newFields[fieldName];
            this.config.fieldOrder = this.config.fieldOrder.filter(f => f !== fieldName);
            return true;
        }
        return false;
    }

    /**
     * 更新新增字段的默认值
     * @param {string} fieldName - 字段名
     * @param {*} defaultValue - 新的默认值
     */
    updateNewFieldDefault(fieldName, defaultValue) {
        if (this.config.newFields.hasOwnProperty(fieldName)) {
            this.config.newFields[fieldName] = defaultValue;
        }
    }

    /**
     * 重置配置到初始状态
     */
    resetConfig() {
        this.config.fieldMapping = {};
        this.config.originalFields.forEach(f => {
            this.config.fieldMapping[f] = f;
        });
        this.config.fieldOrder = [...this.config.originalFields];
        this.config.deletedFields = [];
        this.config.newFields = {};
    }

    /**
     * 获取当前配置
     * @returns {Object} 配置对象
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * 检查配置是否有修改
     * @returns {boolean} 是否有修改
     */
    hasChanges() {
        // 检查是否有字段被重命名
        const hasRenamed = Object.entries(this.config.fieldMapping).some(
            ([original, renamed]) => original !== renamed
        );

        // 检查是否有字段被删除
        const hasDeleted = this.config.deletedFields.length > 0;

        // 检查是否有新增字段
        const hasNew = Object.keys(this.config.newFields).length > 0;

        // 检查字段顺序是否变化
        const hasReordered = JSON.stringify(this.config.fieldOrder) !==
            JSON.stringify(this.config.originalFields);

        return hasRenamed || hasDeleted || hasNew || hasReordered;
    }

    /**
     * 应用字段映射到数据对象
     * @param {Object} obj - 原始数据对象
     * @returns {Object} 处理后的对象
     */
    applyMapping(obj) {
        const result = {};

        // 按顺序处理字段
        this.config.fieldOrder.forEach(originalName => {
            // 处理新增字段
            if (this.config.newFields.hasOwnProperty(originalName)) {
                result[originalName] = this.config.newFields[originalName];
                return;
            }

            // 跳过已删除的字段
            if (this.config.deletedFields.includes(originalName)) return;

            // 跳过对象中不存在的字段
            if (!(originalName in obj)) return;

            // 使用映射后的名称
            const newName = this.config.fieldMapping[originalName] || originalName;
            result[newName] = obj[originalName];
        });

        return result;
    }

    // ========== localStorage 方法 ==========

    /**
     * 保存配置到 localStorage
     * @param {string} fileIdentifier - 文件标识符
     */
    saveConfig(fileIdentifier) {
        try {
            const key = STORAGE_KEY_PREFIX + fileIdentifier;
            const data = JSON.stringify(this.config);
            localStorage.setItem(key, data);
        } catch (error) {
            console.warn('保存配置失败:', error);
        }
    }

    /**
     * 从 localStorage 加载配置
     * @param {string} fileIdentifier - 文件标识符
     * @returns {boolean} 是否成功加载
     */
    loadConfig(fileIdentifier) {
        try {
            const key = STORAGE_KEY_PREFIX + fileIdentifier;
            const data = localStorage.getItem(key);

            if (data) {
                const loaded = JSON.parse(data);
                // 合并加载的配置
                this.config = { ...this.config, ...loaded };
                return true;
            }
        } catch (error) {
            console.warn('加载配置失败:', error);
        }
        return false;
    }

    /**
     * 检查是否有已保存的配置
     * @param {string} fileIdentifier - 文件标识符
     * @returns {boolean} 是否有已保存的配置
     */
    hasSavedConfig(fileIdentifier) {
        try {
            const key = STORAGE_KEY_PREFIX + fileIdentifier;
            return localStorage.getItem(key) !== null;
        } catch (error) {
            return false;
        }
    }

    /**
     * 清除已保存的配置
     * @param {string} fileIdentifier - 文件标识符
     */
    clearSavedConfig(fileIdentifier) {
        try {
            const key = STORAGE_KEY_PREFIX + fileIdentifier;
            localStorage.removeItem(key);
        } catch (error) {
            console.warn('清除配置失败:', error);
        }
    }

    /**
     * 清除所有已保存的配置
     */
    clearAllSavedConfigs() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(STORAGE_KEY_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.warn('清除所有配置失败:', error);
        }
    }
}

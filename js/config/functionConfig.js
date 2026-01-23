/**
 * 功能配置模块
 * 定义所有可用功能及其元数据
 */

export const functionConfig = {
    dateInsert: {
        name: '日期插入',
        description: '在 internal_id 字段插入日期',
        dependencies: ['dateInput']
    },
    promptTruncate: {
        name: 'Prompt截断',
        description: '截断 prompt 字段',
        dependencies: ['truncateLengthInput']
    },
    referenceField: {
        name: 'Reference字段添加',
        description: '添加 reference 字段',
        dependencies: []
    },
    fileSplit: {
        name: '文件切分',
        description: '切分文件',
        dependencies: ['splitCountInput']
    },
    batchDownload: {
        name: '批量下载',
        description: '批量下载文件',
        dependencies: []
    },
    rowSizeFilter: {
        name: '数据行大小过滤',
        description: '按数据行大小过滤',
        dependencies: ['maxRowSizeInput']
    },
    promptLengthFilter: {
        name: 'Prompt 长度过滤',
        description: '按 prompt 长度过滤（固定 20480 字节）',
        dependencies: []
    }
};

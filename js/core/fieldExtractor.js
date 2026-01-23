/**
 * 字段提取器
 * 从 JSONL 文件中提取所有字段信息
 */

import { readFile } from '../utils/fileUtils.js';

/**
 * 字段提取器类
 */
export class FieldExtractor {
    /**
     * 从 JSONL 文件中提取所有字段
     * @param {File} file - JSONL 文件
     * @param {number} sampleLines - 采样行数，默认 100
     * @returns {Promise<Array<FieldInfo>>} 字段信息数组
     */
    static async extractFields(file, sampleLines = 100) {
        const content = await readFile(file);
        const lines = content.split('\n').filter(line => line.trim());

        if (lines.length === 0) {
            throw new Error('文件为空');
        }

        // 采样前 N 行或全部（如果少于 N 行）
        const sampleSize = Math.min(lines.length, sampleLines);
        const fieldsMap = new Map();

        for (let i = 0; i < sampleSize; i++) {
            try {
                const obj = JSON.parse(lines[i]);
                // 递归提取所有嵌套字段
                FieldExtractor.extractNestedFields(obj, fieldsMap, [], 0);
            } catch (error) {
                console.warn(`解析第 ${i + 1} 行失败:`, error);
            }
        }

        if (fieldsMap.size === 0) {
            throw new Error('未能从文件中提取到任何字段');
        }

        return Array.from(fieldsMap.values());
    }

    /**
     * 递归提取嵌套字段
     * @param {*} obj - 当前对象
     * @param {Map} fieldsMap - 字段映射表
     * @param {Array<string>} path - 当前路径
     * @param {number} depth - 嵌套深度
     */
    static extractNestedFields(obj, fieldsMap, path, depth) {
        if (obj === null || typeof obj !== 'object') {
            return;
        }

        // 如果是数组，只处理第一个元素来推断字段结构
        if (Array.isArray(obj)) {
            if (obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null) {
                // 对于数组，使用 [0] 作为路径的一部分
                FieldExtractor.extractNestedFields(obj[0], fieldsMap, [...path, '[0]'], depth);
            }
            return;
        }

        // 遍历对象的所有键
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            const currentPath = [...path, key];
            const pathString = currentPath.join('.');

            // 如果是嵌套对象，继续递归
            if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                // 先记录这个对象本身作为一个字段
                if (!fieldsMap.has(pathString)) {
                    fieldsMap.set(pathString, {
                        originalName: pathString,
                        displayName: key,
                        sampleValue: FieldExtractor.formatSampleValue(value),
                        type: FieldExtractor.detectType(value),
                        depth: depth,
                        fullPath: currentPath,
                        isNested: true
                    });
                }
                // 递归提取子字段
                FieldExtractor.extractNestedFields(value, fieldsMap, currentPath, depth + 1);
            } else {
                // 非嵌套值，直接记录
                if (!fieldsMap.has(pathString)) {
                    fieldsMap.set(pathString, {
                        originalName: pathString,
                        displayName: key,
                        sampleValue: FieldExtractor.formatSampleValue(value),
                        type: FieldExtractor.detectType(value),
                        depth: depth,
                        fullPath: currentPath,
                        isNested: depth > 0
                    });
                }
            }
        });
    }

    /**
     * 格式化示例值
     * @param {*} value - 要格式化的值
     * @returns {string} 格式化后的字符串
     */
    static formatSampleValue(value) {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (typeof value === 'string') {
            // 截取前 15 个字符
            const truncated = value.length > 15 ? value.substring(0, 15) + '...' : value;
            // 如果包含换行符，只显示第一行
            const firstLine = truncated.split('\n')[0];
            return firstLine;
        }
        if (typeof value === 'object') return '[Object/Array]';
        return String(value);
    }

    /**
     * 检测字段类型
     * @param {*} value - 要检测的值
     * @returns {string} 类型名称
     */
    static detectType(value) {
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    }

    /**
     * 获取文件哈希（用于存储配置）
     * @param {File} file - 文件对象
     * @returns {string} 文件标识符
     */
    static getFileIdentifier(file) {
        // 使用文件名和大小作为标识符
        return `${file.name}_${file.size}`;
    }
}

/**
 * @typedef {Object} FieldInfo
 * @property {string} originalName - 原始字段名
 * @property {string} displayName - 显示名称
 * @property {string} sampleValue - 示例值
 * @property {string} type - 字段类型
 */

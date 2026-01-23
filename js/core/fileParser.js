/**
 * 文件解析模块
 * 负责解析 JSONL 格式的文件
 */

import { readFile } from '../utils/fileUtils.js';

/**
 * 解析 JSONL 文件
 * @param {File} file - 文件对象
 * @returns {Promise<Array<Object>>} 解析后的对象数组
 * @throws {Error} 如果解析失败
 */
export async function parseJsonlFile(file) {
    const fileContent = await readFile(file);
    const lines = fileContent.split('\n').filter(line => line.trim());
    const jsonObjects = [];

    for (let i = 0; i < lines.length; i++) {
        try {
            jsonObjects.push(JSON.parse(lines[i]));
        } catch (error) {
            throw new Error(`第 ${i + 1} 行JSON解析失败: ${error.message}`);
        }
    }

    return jsonObjects;
}

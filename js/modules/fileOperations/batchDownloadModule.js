/**
 * 批量下载模块
 * 自动下载所有生成的文件
 */

import { downloadFile } from '../../utils/fileUtils.js';

export default {
    name: '批量下载',
    description: '自动下载所有生成的文件',

    /**
     * 执行批量下载
     * @param {Array|Object} chunks - 要下载的数据块或过滤结果
     * @param {Object} options - 处理选项
     * @param {File} options.file - 原始文件对象
     * @param {boolean} options.splitEnabled - 是否启用了文件切分
     * @param {boolean} options.isFilterResult - 是否为过滤结果
     */
    execute(chunks, options) {
        const file = options.file;

        // 处理双文件模式（过滤功能）
        if (options.isFilterResult) {
            const { retained, filtered } = chunks;
            const originalFileName = file.name.replace('.jsonl', '');

            if (retained.length > 0) {
                const retainedContent = retained.map(obj => JSON.stringify(obj)).join('\n');
                setTimeout(() => {
                    downloadFile(retainedContent, `${originalFileName}_retained.jsonl`);
                }, 0);
            }

            if (filtered.length > 0) {
                const filteredContent = filtered.map(obj => JSON.stringify(obj)).join('\n');
                setTimeout(() => {
                    downloadFile(filteredContent, `${originalFileName}_filtered.jsonl`);
                }, 100);
            }

            return;
        }

        // 原有的单文件/多文件下载逻辑
        const totalFiles = chunks.length;
        chunks.forEach((chunk, index) => {
            const originalFileName = file.name.replace('.jsonl', '');
            const fileName = options.splitEnabled ?
                `${originalFileName}_part_${index + 1}.jsonl` :
                `${originalFileName}_processed.jsonl`;

            const jsonlContent = chunk.map(obj => JSON.stringify(obj)).join('\n');

            setTimeout(() => {
                downloadFile(jsonlContent, fileName);
            }, index * 100);
        });
    }
};

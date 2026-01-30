/**
 * JSONL 终极工具箱 - 主入口文件
 */

import { getTodayDate } from './utils/dateUtils.js';
import { showStatus } from './ui/statusManager.js';
import {
    getSelectedFunctions,
    initFunctionSelector,
    updateCheckboxStyle,
    toggleDependencySettings,
    updateSelectedFunctionsDisplay,
    handleFunctionDependencies
} from './ui/functionSelector.js';
import { generateFileInfo, generateFilterFileInfo } from './ui/fileInfoGenerator.js';
import { processFile, executeDownload } from './core/processor.js';
import { initFieldEditor, getFieldConfigManager, resetFields, showAddFieldDialog } from './ui/fieldEditor.js';

// 获取 DOM 元素
const fileInput = document.getElementById('fileInput');
const dateInput = document.getElementById('dateInput');
const truncateLengthInput = document.getElementById('truncateLengthInput');
const splitCountInput = document.getElementById('splitCountInput');
const processButton = document.getElementById('processButton');
const fieldEditorToggle = document.getElementById('fieldEditorToggle');
const fieldEditorSection = document.getElementById('fieldEditorSection');

/**
 * 应用状态管理
 */
const AppState = {
    current: 'initial',

    /**
     * 切换应用状态
     * @param {string} newState - 新状态: 'initial' | 'file-selected' | 'field-editor-active'
     */
    setState(newState) {
        const wrapper = document.getElementById('appWrapper');
        const functionSection = document.getElementById('functionSection');
        const fieldEditorSection = document.getElementById('fieldEditorSection');
        const processButton = document.getElementById('processButton');

        // 移除所有状态类
        wrapper.classList.remove('state-initial', 'state-file-selected');

        switch(newState) {
            case 'initial':
                wrapper.classList.add('state-initial');
                functionSection.style.display = 'none';
                fieldEditorSection.style.display = 'none';
                processButton.style.display = 'none';
                break;

            case 'file-selected':
                wrapper.classList.add('state-file-selected');
                functionSection.style.display = 'block';
                fieldEditorSection.style.display = 'none';
                processButton.style.display = 'block';
                break;

            case 'field-editor-active':
                wrapper.classList.add('state-file-selected');
                functionSection.style.display = 'block';
                fieldEditorSection.style.display = 'block';
                processButton.style.display = 'block';
                break;
        }

        this.current = newState;
    },

    /**
     * 获取当前状态
     * @returns {string} 当前状态
     */
    getState() {
        return this.current;
    }
};

/**
 * 主处理函数
 * 处理文件并执行选中的功能
 */
async function handleProcessButtonClick() {
    try {
        const file = fileInput.files[0];
        if (!file) {
            showStatus('请选择一个JSONL文件', 'error');
            return;
        }

        const selectedFunctions = getSelectedFunctions();
        const fieldConfigManager = getFieldConfigManager();
        const hasFieldConfig = fieldConfigManager && fieldConfigManager.hasChanges();

        if (selectedFunctions.length === 0 && !hasFieldConfig) {
            showStatus('请至少选择一个功能或调整字段配置', 'error');
            return;
        }

        // 准备处理选项
        const options = {
            currentDate: selectedFunctions.includes('dateInsert') ?
                dateInput.value : null,
            truncateLength: selectedFunctions.includes('promptTruncate') ?
                parseInt(truncateLengthInput.value) : null,
            splitCount: selectedFunctions.includes('fileSplit') ?
                parseInt(splitCountInput.value) : null,
            maxRowSize: selectedFunctions.includes('rowSizeFilter') ?
                parseFloat(document.getElementById('maxRowSizeInput').value) : null,
            fieldConfig: fieldConfigManager ? fieldConfigManager.getConfig() : null
        };

        processButton.disabled = true;
        processButton.textContent = '处理中...';

        // 执行处理流程
        const result = await processFile(file, selectedFunctions, options);

        showStatus('数据处理完成，正在准备下载...', 'info');

        // 直接执行下载（默认行为）
        // 如果有过滤功能，输出双文件模式
        if (result.hasFilterFunction) {
            result.processOptions.isFilterResult = true;
            executeDownload(result.filterResult, result.processOptions);

            setTimeout(() => {
                showStatus(
                    `处理完成！保留 ${result.filterResult.retained.length} 行，过滤 ${result.filterResult.filtered.length} 行。`,
                    'success'
                );
                generateFilterFileInfo(file, result.processedObjects.length, selectedFunctions, result.filterResult);
            }, 300);
        } else {
            executeDownload(result.chunks, result.processOptions);

            setTimeout(() => {
                showStatus(`处理完成！成功生成并下载了 ${result.chunks.length} 个文件。`, 'success');
                generateFileInfo(file, result.processedObjects.length, selectedFunctions, result.chunks.length, result.processOptions);
            }, result.chunks.length * 100 + 500);
        }

    } catch (error) {
        showStatus(`处理过程中发生错误: ${error.message}`, 'error');
        console.error('Error:', error);
    } finally {
        processButton.disabled = false;
        processButton.textContent = '处理并下载';
    }
}

/**
 * 初始化应用
 */
export function initApp() {
    // 设置默认日期
    dateInput.value = getTodayDate();

    // 设置初始状态
    AppState.setState('initial');

    // 初始化复选框状态
    document.querySelectorAll('.checkbox-item input[type="checkbox"]').forEach(checkbox => {
        updateCheckboxStyle(checkbox);
        toggleDependencySettings(checkbox.id, checkbox.checked);
    });

    // 初始化功能选择器
    initFunctionSelector();

    // 处理依赖关系
    handleFunctionDependencies();

    // 更新功能显示
    updateSelectedFunctionsDisplay();

    // 绑定主处理按钮事件
    processButton.addEventListener('click', handleProcessButtonClick);

    // 绑定文件选择事件
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            showStatus(`已选择文件: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`, 'info');

            // 切换到文件已选择状态
            AppState.setState('file-selected');

            // 检查字段编辑器复选框
            if (fieldEditorToggle.checked) {
                // 初始化字段编辑器
                try {
                    showStatus('正在读取字段信息...', 'info');
                    await initFieldEditor(file);
                    // 切换到字段编辑器激活状态
                    AppState.setState('field-editor-active');
                    showStatus('字段信息已加载，您可以调整字段配置', 'success');
                } catch (error) {
                    showStatus(`读取字段失败: ${error.message}`, 'error');
                }
            }
        } else {
            // 文件被清除，返回初始状态
            AppState.setState('initial');
        }
    });

    // 绑定字段编辑器复选框事件
    fieldEditorToggle.addEventListener('change', async (e) => {
        if (e.target.checked) {
            // 启用字段编辑器
            const file = fileInput.files[0];
            if (file) {
                try {
                    showStatus('正在读取字段信息...', 'info');
                    await initFieldEditor(file);
                    // 切换到字段编辑器激活状态
                    AppState.setState('field-editor-active');
                    showStatus('字段信息已加载，您可以调整字段配置', 'success');
                } catch (error) {
                    showStatus(`读取字段失败: ${error.message}`, 'error');
                }
            } else {
                showStatus('请先选择文件', 'error');
                e.target.checked = false;
            }
        } else {
            // 禁用字段编辑器
            fieldEditorSection.style.display = 'none';
            // 返回文件已选择状态
            if (fileInput.files[0]) {
                AppState.setState('file-selected');
            } else {
                AppState.setState('initial');
            }
        }
    });

    // 绑定字段编辑器按钮事件
    const addFieldBtn = document.getElementById('addFieldBtn');
    const resetFieldsBtn = document.getElementById('resetFieldsBtn');

    if (addFieldBtn) {
        addFieldBtn.addEventListener('click', showAddFieldDialog);
    }

    if (resetFieldsBtn) {
        resetFieldsBtn.addEventListener('click', resetFields);
    }

    // 显示初始状态
    showStatus('请选择JSONL文件，选择需要的功能，然后点击"处理并下载"按钮。', 'info');

    // 初始化主题
    initTheme();
}

/**
 * 初始化主题功能
 */
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;

    // 从 localStorage 加载主题偏好，默认深色主题
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        html.classList.add('light-theme');
    }

    // 绑定主题切换事件
    themeToggle.addEventListener('click', () => {
        // 添加旋转动画类
        themeToggle.classList.add('rotating');

        // 切换主题
        const isLight = html.classList.toggle('light-theme');
        const themeName = isLight ? 'light' : 'dark';

        // 保存到 localStorage
        localStorage.setItem('theme', themeName);

        // 移除旋转动画类
        setTimeout(() => {
            themeToggle.classList.remove('rotating');
        }, 500);
    });
}

// DOM 加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);

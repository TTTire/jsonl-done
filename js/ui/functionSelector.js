/**
 * 功能选择器 UI 管理模块
 */

import { functionConfig } from '../config/functionConfig.js';

/**
 * 获取选中的功能列表
 * @returns {Array<string>} 选中的功能名称数组
 */
export function getSelectedFunctions() {
    const selected = [];
    const checkboxes = document.querySelectorAll('.checkbox-item input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const functionName = checkbox.id;
            selected.push(functionName);
        }
    });

    return selected;
}

/**
 * 更新已选择功能显示
 */
export function updateSelectedFunctionsDisplay() {
    const selected = getSelectedFunctions();
    const selectedFunctions = document.getElementById('selectedFunctions');
    const selectedFunctionsList = document.getElementById('selectedFunctionsList');

    if (selected.length === 0) {
        selectedFunctions.style.display = 'none';
        return;
    }

    selectedFunctions.style.display = 'block';
    const selectedHtml = selected.map(func =>
        `<div class="selected-function-item">• ${functionConfig[func].name}</div>`
    ).join('');

    selectedFunctionsList.innerHTML = selectedHtml;
}

/**
 * 显示/隐藏依赖设置
 * @param {string} functionName - 功能名称
 * @param {boolean} show - 是否显示
 */
export function toggleDependencySettings(functionName, show) {
    const config = functionConfig[functionName];
    if (!config) return;

    config.dependencies.forEach(depId => {
        const element = document.getElementById(`${functionName}Settings`);
        if (element) {
            element.style.display = show ? 'block' : 'none';
        }
    });
}

/**
 * 更新复选框样式
 * @param {HTMLInputElement} checkbox - 复选框元素
 */
export function updateCheckboxStyle(checkbox) {
    const parent = checkbox.closest('.checkbox-item');
    if (checkbox.checked) {
        parent.classList.add('checked');
    } else {
        parent.classList.remove('checked');
    }
}

/**
 * 处理功能依赖关系
 * 控制批量下载功能的启用/禁用状态
 */
export function handleFunctionDependencies() {
    const rowSizeFilterEnabled = document.getElementById('rowSizeFilter').checked;
    const promptLengthFilterEnabled = document.getElementById('promptLengthFilter').checked;
    const fileSplitEnabled = document.getElementById('fileSplit').checked;
    const batchDownloadCheckbox = document.getElementById('batchDownload');

    // 检测是否启用了过滤功能
    const hasFilterFunction = rowSizeFilterEnabled || promptLengthFilterEnabled;

    // 如果文件切分启用，批量下载自动启用且不可取消
    if (fileSplitEnabled) {
        batchDownloadCheckbox.checked = true;
        batchDownloadCheckbox.disabled = true;
        batchDownloadCheckbox.closest('.checkbox-item').style.opacity = '0.6';
        batchDownloadCheckbox.closest('.checkbox-item').style.cursor = 'not-allowed';
    } else if (hasFilterFunction) {
        // 过滤功能启用时，批量下载自动启用且不可取消
        batchDownloadCheckbox.checked = true;
        batchDownloadCheckbox.disabled = true;
        batchDownloadCheckbox.closest('.checkbox-item').style.opacity = '0.6';
        batchDownloadCheckbox.closest('.checkbox-item').style.cursor = 'not-allowed';
    } else {
        batchDownloadCheckbox.disabled = false;
        batchDownloadCheckbox.closest('.checkbox-item').style.opacity = '1';
        batchDownloadCheckbox.closest('.checkbox-item').style.cursor = 'pointer';
    }
}

/**
 * 初始化功能选择器
 */
export function initFunctionSelector() {
    // 为所有复选框添加事件监听器
    document.querySelectorAll('.checkbox-item input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const functionName = e.target.id;
            const isChecked = e.target.checked;

            updateCheckboxStyle(e.target);
            toggleDependencySettings(functionName, isChecked);
            updateSelectedFunctionsDisplay();
            handleFunctionDependencies();
        });
    });
}

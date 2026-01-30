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
 * 显示/隐藏依赖设置（带平滑动画）
 * @param {string} functionName - 功能名称
 * @param {boolean} show - 是否显示
 */
export function toggleDependencySettings(functionName, show) {
    const config = functionConfig[functionName];
    if (!config) return;

    config.dependencies.forEach(depId => {
        const element = document.getElementById(`${functionName}Settings`);
        if (!element) return;

        // 移除旧的事件监听器
        if (element._animationHandler) {
            element.removeEventListener('animationend', element._animationHandler);
            element._animationHandler = null;
        }

        // 移除所有状态类
        element.classList.remove('showing', 'hiding', 'visible');

        if (show) {
            // 显示：先设为 block，再触发动画
            element.style.display = 'block';

            // 强制重绘以确保动画触发
            void element.offsetWidth;

            // 添加显示动画类
            element.classList.add('showing');

            // 使用 animationend 事件监听动画完成
            element._animationHandler = () => {
                element.classList.remove('showing');
                element.classList.add('visible');
                element.removeEventListener('animationend', element._animationHandler);
                element._animationHandler = null;
            };
            element.addEventListener('animationend', element._animationHandler);
        } else {
            // 隐藏：检查是否可见
            const isVisible = element.classList.contains('visible') ||
                            (!element.classList.contains('hiding') && element.style.display !== 'none');

            if (isVisible) {
                element.classList.add('hiding');

                // 使用 animationend 事件监听动画完成
                element._animationHandler = () => {
                    element.classList.remove('hiding');
                    element.style.display = 'none';
                    element.removeEventListener('animationend', element._animationHandler);
                    element._animationHandler = null;
                };
                element.addEventListener('animationend', element._animationHandler);
            } else {
                // 已经隐藏，直接设置
                element.style.display = 'none';
            }
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
 * 批量下载功能已移除，下载现在是默认行为
 * 此函数保留用于未来可能的其他功能依赖关系
 */
export function handleFunctionDependencies() {
    // 下载现在是默认行为，无需额外处理
    // 此函数保留用于未来可能的其他功能依赖关系
}

/**
 * 初始化功能选择器
 */
export function initFunctionSelector() {
    // 初始化：将所有依赖设置面板设为隐藏
    document.querySelectorAll('.checkbox-dependency').forEach(el => {
        el.style.display = 'none';
    });

    // 为所有复选框添加事件监听器
    document.querySelectorAll('.checkbox-item').forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');

        // 点击复选框本身（原有逻辑）
        checkbox.addEventListener('change', (e) => {
            const functionName = e.target.id;
            const isChecked = e.target.checked;

            updateCheckboxStyle(e.target);
            toggleDependencySettings(functionName, isChecked);
            updateSelectedFunctionsDisplay();
            handleFunctionDependencies();
        });

        // 点击整个标签项时触发复选框
        item.addEventListener('click', (e) => {
            // 如果点击的是复选框本身，不需要处理（已有 change 事件）
            if (e.target === checkbox) {
                return;
            }
            // 点击其他区域时，切换复选框状态
            checkbox.checked = !checkbox.checked;
            // 手动触发 change 事件以执行原有逻辑
            checkbox.dispatchEvent(new Event('change'));
        });
    });
}

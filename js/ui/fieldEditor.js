/**
 * 字段编辑器 UI 模块
 * 负责字段编辑器的渲染和交互
 */

import { FieldExtractor } from '../core/fieldExtractor.js';
import { FieldConfigManager } from '../core/fieldConfigManager.js';

// 全局变量
let fieldConfigManager = null;
let currentFileIdentifier = null;
let dragManager = null;

/**
 * 初始化字段编辑器
 * @param {File} file - 上传的文件
 * @returns {Promise<FieldConfigManager>} 字段配置管理器实例
 */
export async function initFieldEditor(file) {
    const section = document.getElementById('fieldEditorSection');
    const fieldList = document.getElementById('fieldList');
    const fieldCount = document.getElementById('fieldCount');
    const confirmBtn = document.getElementById('confirmFieldsBtn');

    try {
        // 获取文件标识符
        currentFileIdentifier = FieldExtractor.getFileIdentifier(file);

        // 初始化配置管理器
        if (!fieldConfigManager) {
            fieldConfigManager = new FieldConfigManager();
        }

        // 提取字段
        const fields = await FieldExtractor.extractFields(file);
        const fieldNames = fields.map(f => f.originalName);

        // 尝试加载已保存的配置
        const hasSavedConfig = fieldConfigManager.hasSavedConfig(currentFileIdentifier);
        if (hasSavedConfig) {
            // 加载已保存的配置
            fieldConfigManager.loadConfig(currentFileIdentifier);
        } else {
            // 初始化新配置
            fieldConfigManager.initializeConfig(fieldNames);
        }

        // 渲染字段列表
        renderFieldList(fields);

        // 显示字段统计
        fieldCount.textContent = fields.length;

        // 显示编辑器区域
        section.style.display = 'block';

        // 初始化拖拽管理器
        if (dragManager) {
            dragManager.destroy();
        }
        dragManager = new FieldDragManager('fieldList');

        // 设置自动保存
        setupAutoSave();

        return fieldConfigManager;
    } catch (error) {
        console.error('初始化字段编辑器失败:', error);

        // 显示详细错误（不自动消失）
        const statusArea = document.getElementById('statusArea');
        statusArea.className = 'status-error';
        statusArea.textContent = `❌ ${error.message}`;
        statusArea.style.fontSize = '13px';
        statusArea.style.whiteSpace = 'pre-line';

        // 在字段编辑区域显示持久错误提示
        const fieldList = document.getElementById('fieldList');
        fieldList.innerHTML = `
            <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
                <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
                <div style="font-weight: 500; margin-bottom: 8px;">字段读取失败</div>
                <div style="font-size: 12px;">${error.message.replace(/\n/g, '<br>')}</div>
                <div style="font-size: 11px; margin-top: 12px; color: var(--text-muted);">
                    提示: 请确保文件格式正确，前几行包含有效的 JSON 数据
                </div>
            </div>
        `;
        fieldList.style.display = 'block';

        throw error;
    }
}

/**
 * 渲染字段列表
 * @param {Array<FieldInfo>} fields - 字段信息数组
 */
function renderFieldList(fields) {
    const fieldList = document.getElementById('fieldList');
    const config = fieldConfigManager.getConfig();

    // 保存当前字段到全局变量供新增字段对话框使用
    window.currentFields = fields;

    // 清空现有列表
    fieldList.innerHTML = '';

    // 按 config 中的顺序渲染字段
    config.fieldOrder.forEach(originalName => {
        const fieldInfo = fields.find(f => f.originalName === originalName);
        const isNewField = config.newFields && config.newFields.hasOwnProperty(originalName);

        const fieldCard = createFieldCard(
            fieldInfo || { originalName, displayName: originalName, sampleValue: isNewField ? config.newFields[originalName] : '', type: 'custom' },
            isNewField
        );
        fieldList.appendChild(fieldCard);
    });

    // 设置字段交互
    setupFieldInteractions();
}

/**
 * 创建字段卡片元素
 * @param {FieldInfo} fieldInfo - 字段信息
 * @param {boolean} isNewField - 是否为新增字段
 * @returns {HTMLElement} 字段卡片元素
 */
function createFieldCard(fieldInfo, isNewField = false) {
    const config = fieldConfigManager.getConfig();
    const displayName = config.fieldMapping[fieldInfo.originalName] || fieldInfo.originalName;
    const isDeleted = config.deletedFields.includes(fieldInfo.originalName);

    const card = document.createElement('div');
    card.className = 'field-card';
    if (isDeleted) card.classList.add('field-deleted');
    card.draggable = true;
    card.dataset.fieldName = fieldInfo.originalName;
    card.dataset.isNewField = isNewField;

    // 添加类型标签
    const typeLabel = getTypeLabel(fieldInfo.type);

    // 计算嵌套深度相关的样式
    const depth = fieldInfo.depth || 0;
    const indentStyle = depth > 0 ? `style="padding-left: ${depth * 20}px;"` : '';
    const depthIndicator = depth > 0 ? `<span class="field-depth-indicator">${'　'.repeat(depth)}└</span>` : '';
    const fullPathDisplay = fieldInfo.fullPath ? fieldInfo.fullPath.join('.') : fieldInfo.originalName;

    card.innerHTML = `
        <div class="field-card-header" ${indentStyle}>
            ${depthIndicator}
            <div class="drag-handle" title="拖拽排序">⋮⋮</div>
            <input type="text" class="field-name-input" value="${escapeHtml(displayName)}"
                   data-original-name="${fieldInfo.originalName}" placeholder="字段名"
                   title="完整路径: ${escapeHtml(fullPathDisplay)}" />
            <span class="field-type-badge type-${fieldInfo.type}">${typeLabel}</span>
            <button class="field-delete-btn" title="删除字段" data-field-name="${fieldInfo.originalName}">×</button>
        </div>
        <div class="field-card-preview" ${indentStyle}>
            <span class="field-preview-label">示例:</span>
            <span class="field-preview-value">${escapeHtml(fieldInfo.sampleValue || '(空)')}</span>
            ${isNewField ? '<span class="field-new-badge">新增</span>' : ''}
        </div>
    `;

    // 为所有数组类型添加悬停提示
    console.log('检查字段类型:', fieldInfo.type, '字段名:', fieldInfo.originalName);
    if (fieldInfo.type === 'array') {
        console.log('✅ 为数组字段添加事件监听器:', fieldInfo.originalName);
        card.addEventListener('mouseenter', (e) => {
            console.log('🔥 mouseenter 触发:', fieldInfo.originalName);
            showArrayTooltip(e, fieldInfo);
        });
        card.addEventListener('mouseleave', () => {
            console.log('🔥 mouseleave 触发');
            hideArrayTooltip();
        });
    }

    return card;
}

/**
 * 获取类型标签
 * @param {string} type - 类型名称
 * @returns {string} 类型标签
 */
function getTypeLabel(type) {
    const labels = {
        'string': '文本',
        'number': '数字',
        'boolean': '布尔',
        'object': '对象',
        'array': '数组',
        'null': '空',
        'undefined': '未定义',
        'custom': '自定义'
    };
    return labels[type] || type;
}

/**
 * 设置字段交互事件
 */
function setupFieldInteractions() {
    const fieldList = document.getElementById('fieldList');

    // 字段名输入框事件
    fieldList.addEventListener('input', (e) => {
        if (e.target.classList.contains('field-name-input')) {
            const input = e.target;
            const originalName = input.dataset.originalName;
            const newName = input.value.trim();

            try {
                fieldConfigManager.updateFieldMapping(originalName, newName);
                autoSaveConfig();
            } catch (error) {
                // 恢复原值
                input.value = fieldConfigManager.config.fieldMapping[originalName];
                showNotification(error.message, 'error');
            }
        }
    });

    // 删除按钮事件
    fieldList.addEventListener('click', (e) => {
        if (e.target.classList.contains('field-delete-btn')) {
            const fieldName = e.target.dataset.fieldName;
            const card = e.target.closest('.field-card');
            const isNewField = card.dataset.isNewField === 'true';

            if (isNewField) {
                // 新增字段直接删除
                fieldConfigManager.removeNewField(fieldName);
                card.remove();
                updateFieldCount();
            } else {
                // 原有字段需要确认
                confirmDeleteField(fieldName);
            }
        }
    });
}

/**
 * 确认删除字段
 * @param {string} fieldName - 字段名
 */
function confirmDeleteField(fieldName) {
    // 创建确认对话框
    const overlay = document.createElement('div');
    overlay.className = 'confirm-dialog-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.innerHTML = `
        <div class="confirm-dialog-title">确认删除字段</div>
        <div class="confirm-dialog-content">
            确定要删除字段 <strong>"${escapeHtml(fieldName)}"</strong> 吗？
            <br><br>
            <small style="color: var(--text-secondary)">删除后该字段不会出现在输出文件中，可通过重置按钮恢复。</small>
        </div>
        <div class="confirm-dialog-actions">
            <button class="confirm-dialog-btn cancel-btn">取消</button>
            <button class="confirm-dialog-btn confirm-btn">确认删除</button>
        </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // 绑定事件
    const cancelBtn = dialog.querySelector('.cancel-btn');
    const confirmBtn = dialog.querySelector('.confirm-btn');

    const closeDialog = () => {
        overlay.remove();
    };

    cancelBtn.addEventListener('click', closeDialog);

    confirmBtn.addEventListener('click', () => {
        deleteField(fieldName);
        closeDialog();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeDialog();
    });
}

/**
 * 执行删除字段
 * @param {string} fieldName - 字段名
 */
function deleteField(fieldName) {
    fieldConfigManager.deleteField(fieldName);

    // 更新 UI
    const card = document.querySelector(`.field-card[data-field-name="${fieldName}"]`);
    if (card) {
        card.classList.add('field-deleted');
        card.style.opacity = '0.5';
        card.querySelector('.field-name-input').disabled = true;
    }

    updateFieldCount();
    autoSaveConfig();
}

/**
 * 显示新增字段对话框
 */
export function showAddFieldDialog() {
    // 创建对话框
    const overlay = document.createElement('div');
    overlay.className = 'confirm-dialog-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.innerHTML = `
        <div class="confirm-dialog-title">新增字段</div>
        <div class="confirm-dialog-content">
            <label for="newFieldName" style="display: block; margin-bottom: 8px;">字段名:</label>
            <input type="text" id="newFieldName" class="dialog-input" placeholder="输入字段名" />

            <label style="display: block; margin: 16px 0 8px;">值来源:</label>
            <div style="display: flex; gap: 16px; margin-bottom: 12px;">
                <label class="radio-label">
                    <input type="radio" name="valueType" value="fixed" checked />
                    <span>固定值</span>
                </label>
                <label class="radio-label">
                    <input type="radio" name="valueType" value="dynamic" />
                    <span>从字段复制</span>
                </label>
            </div>

            <!-- 固定值输入 -->
            <div id="fixedValueContainer">
                <input type="text" id="newFieldValue" class="dialog-input" placeholder="输入默认值（可选）" />
            </div>

            <!-- 字段选择器 -->
            <div id="dynamicValueContainer" style="display: none;">
                <select id="sourceFieldSelect" class="dialog-input">
                    <option value="">选择源字段...</option>
                </select>
            </div>
        </div>
        <div class="confirm-dialog-actions">
            <button class="confirm-dialog-btn cancel-btn">取消</button>
            <button class="confirm-dialog-btn confirm-btn">添加</button>
        </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // 聚焦输入框
    const nameInput = dialog.querySelector('#newFieldName');
    const valueInput = dialog.querySelector('#newFieldValue');
    const sourceFieldSelect = dialog.querySelector('#sourceFieldSelect');
    const fixedContainer = dialog.querySelector('#fixedValueContainer');
    const dynamicContainer = dialog.querySelector('#dynamicValueContainer');
    nameInput.focus();

    // 单选按钮切换逻辑
    const radioButtons = dialog.querySelectorAll('input[name="valueType"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'fixed') {
                fixedContainer.style.display = 'block';
                dynamicContainer.style.display = 'none';
            } else {
                fixedContainer.style.display = 'none';
                dynamicContainer.style.display = 'block';
                populateFieldSelect();
            }
        });
    });

    // 填充字段选择器
    function populateFieldSelect() {
        const currentFields = window.currentFields || [];
        sourceFieldSelect.innerHTML = '<option value="">选择源字段...</option>';
        currentFields.forEach(field => {
            const option = document.createElement('option');
            option.value = field.originalName;
            option.textContent = `${field.displayName} (${escapeHtml(field.sampleValue || '(空)')})`;
            sourceFieldSelect.appendChild(option);
        });
    }

    // 绑定事件
    const cancelBtn = dialog.querySelector('.cancel-btn');
    const confirmBtn = dialog.querySelector('.confirm-btn');

    const closeDialog = () => {
        overlay.remove();
    };

    cancelBtn.addEventListener('click', closeDialog);

    const addField = () => {
        const fieldName = nameInput.value.trim();
        const valueType = dialog.querySelector('input[name="valueType"]:checked').value;

        if (!fieldName) {
            showNotification('请输入字段名', 'error');
            nameInput.focus();
            return;
        }

        try {
            if (valueType === 'fixed') {
                // 固定值模式
                const defaultValue = valueInput.value;
                fieldConfigManager.addNewField(fieldName, defaultValue);
            } else {
                // 动态字段模式
                const sourceField = sourceFieldSelect.value;
                if (!sourceField) {
                    showNotification('请选择源字段', 'error');
                    return;
                }
                fieldConfigManager.addNewField(fieldName, '', sourceField);
            }

            // 添加新字段卡片到列表
            const fieldList = document.getElementById('fieldList');
            const fieldCard = createFieldCard({
                originalName: fieldName,
                displayName: fieldName,
                sampleValue: valueType === 'dynamic' ? `← ${sourceFieldSelect.value}` : (valueInput.value || '(空)'),
                type: 'custom'
            }, true);
            fieldList.appendChild(fieldCard);

            updateFieldCount();
            autoSaveConfig();
            closeDialog();
            showNotification(`字段 "${fieldName}" 已添加`, 'success');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    confirmBtn.addEventListener('click', addField);

    // 支持回车确认
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const valueType = dialog.querySelector('input[name="valueType"]:checked').value;
            if (valueType === 'fixed') {
                valueInput.focus();
            } else {
                sourceFieldSelect.focus();
            }
        }
    });
    valueInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addField();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeDialog();
    });
}

/**
 * 重置字段配置
 */
export function resetFields() {
    if (!confirm('确定要重置所有字段配置吗？这将恢复到原始状态。')) {
        return;
    }

    fieldConfigManager.resetConfig();

    // 重新读取文件并渲染
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (file) {
        initFieldEditor(file);
    }

    // 清除保存的配置
    if (currentFileIdentifier) {
        fieldConfigManager.clearSavedConfig(currentFileIdentifier);
    }

    showNotification('字段配置已重置', 'success');
}

/**
 * 更新字段计数
 */
function updateFieldCount() {
    const config = fieldConfigManager.getConfig();
    const activeCount = config.fieldOrder.length - config.deletedFields.length;
    const fieldCount = document.getElementById('fieldCount');
    fieldCount.textContent = activeCount;
}

/**
 * 设置自动保存
 */
function setupAutoSave() {
    // 监听字段顺序变化
    document.addEventListener('fieldOrderChanged', () => {
        if (dragManager) {
            const newOrder = dragManager.getFieldOrder();
            fieldConfigManager.updateFieldOrder(newOrder);
            autoSaveConfig();
        }
    });
}

/**
 * 自动保存配置
 */
function autoSaveConfig() {
    if (currentFileIdentifier) {
        fieldConfigManager.saveConfig(currentFileIdentifier);
    }
}

/**
 * 显示通知
 * @param {string} message - 消息内容
 * @param {string} type - 类型：success, error, info
 */
function showNotification(message, type = 'info') {
    const statusArea = document.getElementById('statusArea');
    statusArea.className = `status-${type}`;
    statusArea.textContent = message;

    setTimeout(() => {
        statusArea.className = '';
        statusArea.textContent = '';
    }, 3000);
}

/**
 * HTML 转义
 * @param {string} str - 要转义的字符串
 * @returns {string} 转义后的字符串
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * 获取当前字段配置管理器
 * @returns {FieldConfigManager} 字段配置管理器实例
 */
export function getFieldConfigManager() {
    return fieldConfigManager;
}

/**
 * 拖拽管理器类
 */
class FieldDragManager {
    constructor(fieldListId) {
        this.fieldList = document.getElementById(fieldListId);
        this.draggedItem = null;
        this.init();
    }

    init() {
        this.fieldList.addEventListener('dragstart', this.handleDragStart.bind(this));
        this.fieldList.addEventListener('dragend', this.handleDragEnd.bind(this));
        this.fieldList.addEventListener('dragover', this.handleDragOver.bind(this));
        this.fieldList.addEventListener('drop', this.handleDrop.bind(this));
        this.fieldList.addEventListener('dragenter', this.handleDragEnter.bind(this));
        this.fieldList.addEventListener('dragleave', this.handleDragLeave.bind(this));
    }

    handleDragStart(e) {
        const card = e.target.closest('.field-card');
        if (!card || card.classList.contains('field-deleted')) return;

        this.draggedItem = card;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', card.innerHTML);
    }

    handleDragEnd(e) {
        if (this.draggedItem) {
            this.draggedItem.classList.remove('dragging');
        }
        document.querySelectorAll('.field-card').forEach(card => {
            card.classList.remove('drag-over');
        });

        // 触发字段顺序更新事件
        this.dispatchFieldOrderChanged();
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const afterElement = this.getDragAfterElement(e.clientY);
        const draggable = document.querySelector('.dragging');
        if (draggable) {
            if (afterElement == null) {
                this.fieldList.appendChild(draggable);
            } else {
                this.fieldList.insertBefore(draggable, afterElement);
            }
        }
    }

    handleDrop(e) {
        e.preventDefault();
    }

    handleDragEnter(e) {
        const card = e.target.closest('.field-card');
        if (card && card !== this.draggedItem && !card.classList.contains('field-deleted')) {
            card.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        const card = e.target.closest('.field-card');
        if (card) {
            card.classList.remove('drag-over');
        }
    }

    getDragAfterElement(y) {
        const draggableElements = [...this.fieldList.querySelectorAll('.field-card:not(.dragging):not(.field-deleted)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    dispatchFieldOrderChanged() {
        const event = new CustomEvent('fieldOrderChanged', {
            detail: { fieldOrder: this.getFieldOrder() }
        });
        document.dispatchEvent(event);
    }

    getFieldOrder() {
        return [...this.fieldList.querySelectorAll('.field-card')]
            .map(card => card.dataset.fieldName);
    }

    destroy() {
        // 清理事件监听器
        this.fieldList.replaceWith(this.fieldList.cloneNode(true));
    }
}

/**
 * 切换字段值下拉菜单
 * @param {Array<FieldInfo>} fields - 字段信息数组
 * @param {HTMLElement} button - 触发按钮
 */
function toggleFieldDropdown(fields, button) {
    closeFieldDropdown();

    const dropdown = document.createElement('div');
    dropdown.className = 'field-value-dropdown';

    if (fields.length === 0) {
        dropdown.innerHTML = '<div class="field-value-dropdown-item" style="color: var(--text-muted);">暂无字段</div>';
    } else {
        fields.forEach(field => {
            const item = document.createElement('div');
            item.className = 'field-value-dropdown-item';
            item.innerHTML = `
                <div class="field-dropdown-name">${escapeHtml(field.displayName)}</div>
                <div class="field-dropdown-value">${escapeHtml(field.sampleValue || '(空)')}</div>
            `;
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const valueInput = document.getElementById('newFieldValue');
                if (valueInput) {
                    valueInput.value = field.sampleValue || '';
                }
                closeFieldDropdown();
            });
            dropdown.appendChild(item);
        });
    }

    button.style.position = 'relative';
    button.appendChild(dropdown);
}

/**
 * 关闭字段值下拉菜单
 */
function closeFieldDropdown() {
    const existing = document.querySelector('.field-value-dropdown');
    if (existing) {
        existing.remove();
    }
}

/**
 * ========== 数组悬停提示功能 ==========
 */

let arrayTooltip = null;
let tooltipTimer = null;

/**
 * 显示数组悬停提示
 * @param {Event} event - 鼠标事件
 * @param {FieldInfo} fieldInfo - 字段信息
 */
function showArrayTooltip(event, fieldInfo) {
    console.log('showArrayTooltip 被调用, fieldInfo:', fieldInfo);
    // 清除之前的定时器
    if (tooltipTimer) {
        clearTimeout(tooltipTimer);
    }

    // 保存当前元素的引用，避免 setTimeout 后 event.currentTarget 变成 null
    const targetElement = event.currentTarget;

    // 延迟显示，避免快速划过时频繁触发
    tooltipTimer = setTimeout(() => {
        console.log('300ms 延迟后，准备创建 tooltip');
        createTooltip(targetElement, fieldInfo);
    }, 300);
}

/**
 * 创建并显示 tooltip
 * @param {HTMLElement} targetElement - 目标元素
 * @param {FieldInfo} fieldInfo - 字段信息
 */
function createTooltip(targetElement, fieldInfo) {
    console.log('createTooltip 被调用, targetElement:', targetElement, 'fieldInfo:', fieldInfo);
    // 移除已存在的 tooltip
    hideArrayTooltip();

    const { arrayInfo, originalName, displayName } = fieldInfo;
    console.log('arrayInfo:', arrayInfo);

    // 检查是否有有效的数组结构信息
    const hasArrayInfo = arrayInfo && arrayInfo.itemStructure && arrayInfo.itemStructure.length > 0;
    const itemLength = arrayInfo?.length || 0;

    // 创建 tooltip 元素
    const tooltip = document.createElement('div');
    tooltip.className = 'field-array-tooltip';

    // 构建 itemStructure HTML
    let itemStructureHtml = '';
    if (hasArrayInfo) {
        itemStructureHtml = arrayInfo.itemStructure.map(item => {
            const typeLabel = getTypeLabel(item.type);
            return `
                <div class="tooltip-item">
                    <span class="bullet">•</span>
                    <span class="item-name">${escapeHtml(item.name)}</span>
                    <span class="item-type">${typeLabel}</span>
                </div>
            `;
        }).join('');
    } else {
        // 没有结构信息的情况（空数组或简单类型数组）
        itemStructureHtml = `
            <div class="tooltip-item">
                <span class="bullet">•</span>
                <span class="item-name">(空数组或简单类型数组)</span>
            </div>
        `;
    }

    tooltip.innerHTML = `
        <div class="tooltip-title">${escapeHtml(displayName || originalName)} (数组)</div>
        <div class="tooltip-content">
            <div class="tooltip-row">
                <span class="tooltip-label">📊 长度:</span>
                <span class="tooltip-value">${itemLength} 项</span>
            </div>
            <div class="tooltip-row" style="margin-top: 12px;">
                <span class="tooltip-label">📦 数组项结构:</span>
            </div>
            ${itemStructureHtml}
        </div>
    `;

    // 先添加到 DOM，这样才能获取正确的尺寸
    document.body.appendChild(tooltip);
    console.log('✅ tooltip 已添加到 DOM, 元素:', tooltip);

    // 获取位置信息
    const cardRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    console.log('📍 cardRect:', cardRect, 'tooltipRect:', tooltipRect);
    console.log('🖥️ window尺寸:', window.innerWidth, 'x', window.innerHeight);

    // 显示在字段右侧
    let top = cardRect.top;
    let left = cardRect.right + 8;
    console.log('📍 初始位置:', { top, left });

    // 获取侧边栏宽度（320px）
    const sidebarWidth = 320;

    // 计算可用空间（考虑侧边栏）
    const availableRightSpace = window.innerWidth - left;
    const availableLeftSpace = cardRect.left - sidebarWidth;

    // 优先显示在右侧，如果右侧空间不足且左侧空间充足，才显示在左侧
    if (availableRightSpace < tooltipRect.width && availableLeftSpace > tooltipRect.width) {
        left = cardRect.left - tooltipRect.width - 8;
        console.log('⬅️ 右侧空间不足，切换到左侧');
    }

    // 如果右侧和左侧都不足，确保tooltip至少不会被侧边栏遮挡
    if (left < sidebarWidth + 16) {
        left = sidebarWidth + 16;
        console.log('➡️ 调整位置以避开侧边栏');
    }

    // 如果下方空间不足，向上调整
    if (top + tooltipRect.height > window.innerHeight - 16) {
        top = window.innerHeight - tooltipRect.height - 16;
        console.log('⬆️ 下方空间不足，向上调整');
    }
    if (top < 16) {
        top = 16;
        console.log('⬆️ 调整到最小 top 值');
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    console.log('📍 最终位置:', { top, left });
    console.log('🎨 tooltip 最终样式:', {
        top: tooltip.style.top,
        left: tooltip.style.left,
        display: tooltip.style.display,
        visibility: tooltip.style.visibility,
        opacity: tooltip.style.opacity,
        zIndex: tooltip.style.zIndex
    });

    arrayTooltip = tooltip;
}

/**
 * 隐藏数组悬停提示
 */
function hideArrayTooltip() {
    if (tooltipTimer) {
        clearTimeout(tooltipTimer);
        tooltipTimer = null;
    }
    if (arrayTooltip) {
        arrayTooltip.remove();
        arrayTooltip = null;
    }
}

// 导出拖拽管理器供外部使用
export { FieldDragManager };

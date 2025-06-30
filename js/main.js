// /js/main.js (最终初始化修正版)

import { elements, createEl } from './dom.js';
import { state, setCurrentLayout } from './state.js';
import { layouts } from './layouts.js';
import { renderCanvas } from './canvas.js';
import { applyCanvasStyles } from './ui.js';
import * as actions from './actions.js';

(function() {
    const authorizedDomain = 'img.ops-coffee.cn';
    const currentHostname = window.location.hostname;

    if (currentHostname && currentHostname !== authorizedDomain && currentHostname !== 'localhost' && currentHostname !== '12.0.0.1') {
        window.location.href = `https://${authorizedDomain}`;
    }
})();

function generateLayoutThumbnails() {
    elements.layoutContainer.innerHTML = '';
    const grouped = {};
    for (const id in layouts) {
        const layout = layouts[id];
        if (!grouped[layout.g]) grouped[layout.g] = [];
        grouped[layout.g].push({ id, ...layout });
    }
    Object.keys(grouped).sort((a,b) => a - b).forEach(num => {
        const title = createEl('h4', 'layout-group-title');
        title.textContent = `${num} 张图片`;
        elements.layoutContainer.appendChild(title);
        const container = createEl('div', 'layout-thumbnail-grid');
        grouped[num].forEach(layout => {
            const thumb = createLayoutThumbnail(layout.id, layout);
            if (layout.id === state.currentLayoutId) thumb.classList.add('active');
            container.appendChild(thumb);
        });
        elements.layoutContainer.appendChild(container);
    });
}

function createLayoutThumbnail(id, layout) {
    const thumb = createEl('div', 'layout-thumbnail');
    thumb.dataset.layout = id;
    const grid = createEl('div', 'thumbnail-grid');
    grid.style.gridTemplateColumns = `repeat(${layout.gr[1]}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${layout.gr[0]}, 1fr)`;
    const cells = layout.c || Array.from({ length: layout.gr[0] * layout.gr[1] }, () => ({ r: 1, c: 1 }));
    cells.forEach(c => {
        const cell = createEl('div', 'thumbnail-cell');
        cell.style.gridRowEnd = `span ${c.r}`;
        cell.style.gridColumnEnd = `span ${c.c}`;
        if (c.s) {
            cell.style.gridRowStart = c.s[0];
            cell.style.gridColumnStart = c.s[1];
        }
        grid.appendChild(cell);
    });
    thumb.appendChild(grid);
    return thumb;
}

function initializeEventListeners() {
    // 模式切换
    elements.layoutModeBtn.addEventListener('click', () => actions.setMode('layout'));
    elements.stitchingModeBtn.addEventListener('click', () => actions.setMode('stitching'));

    // 拼图控件
    elements.stitchingUploadBtn.addEventListener('click', () => elements.stitchingUploadInput.click());
    elements.stitchingUploadInput.addEventListener('change', (e) => actions.processAndUploadMultipleFiles(e.target.files));
    elements.stitchingDirectionBtns.addEventListener('click', e => {
        const button = e.target.closest('button');
        if (button) actions.setStitchingDirection(button.dataset.direction);
    });
    elements.stitchingUploadBtn.addEventListener('dragover', e => e.preventDefault());
    elements.stitchingUploadBtn.addEventListener('drop', e => {
        e.preventDefault();
        actions.processAndUploadMultipleFiles(e.dataTransfer.files);
    });

    // 布局控件
    elements.layoutContainer.addEventListener('click', e => {
        const thumb = e.target.closest('.layout-thumbnail');
        if (thumb) actions.selectNewLayout(thumb.dataset.layout);
    });

    // 右侧边栏控件
    elements.aspectRatioBtns.addEventListener('click', e => {
        const button = e.target.closest('button');
        if (button) actions.updateAspectRatio(button);
    });
    elements.spacingSlider.addEventListener('input', applyCanvasStyles);
    elements.radiusSlider.addEventListener('input', applyCanvasStyles);
    elements.colorPicker.addEventListener('input', applyCanvasStyles);
    elements.shuffleBtn.addEventListener('click', actions.shuffleImages);
    elements.downloadBtn.addEventListener('click', actions.downloadCollage);

    // 窗口尺寸变化
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        if (state.currentMode === 'layout') {
             resizeTimeout = setTimeout(() => {
                import('./canvas.js').then(({ createGutters }) => {
                    createGutters();
                });
             }, 150);
        }
    });
}

function init() {
    // 1. 静态UI生成和事件绑定
    generateLayoutThumbnails();
    initializeEventListeners();

    // 2. 直接设置应用的初始UI状态
    elements.layoutModeBtn.classList.add('active');
    elements.stitchingModeBtn.classList.remove('active');
    elements.layoutControls.classList.remove('hidden');
    elements.stitchingControls.classList.add('hidden');
    elements.canvasSettings.classList.remove('hidden');
    
    // 3. 手动设置默认的宽高比（1:1）
    const defaultRatioBtn = elements.aspectRatioBtns.querySelector('[data-ratio="1/1"]');
    if (defaultRatioBtn) {
        defaultRatioBtn.classList.add('active');
        // 核心修正：确保操作的是 layoutWrapper
        elements.layoutWrapper.style.aspectRatio = '1/1';
    }

    // 4. 在所有状态和样式都准备好后，执行首次渲染
    renderCanvas();

    console.log(
        '%c 免费在线拼图工具 %c by ops-coffee.cn ',
        'background: #0052cc; color: #fff; padding: 5px; border-radius: 5px 0 0 5px;',
        'background: #f4f5f7; color: #42526e; padding: 5px; border-radius: 0 5px 5px 0;'
    );
    console.log('感谢使用！如果您对这个工具有任何建议，欢迎联系我们。微信公众号搜索：运维咖啡吧');
}

document.addEventListener('DOMContentLoaded', init);

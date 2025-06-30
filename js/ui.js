// /js/ui.js (最终修正版)

import { elements } from './dom.js';
import { state } from './state.js'; // 需要引入 state 来判断当前模式

export function showToast(message, type = 'success') {
    elements.toast.textContent = message;
    elements.toast.className = 'fixed bottom-5 right-5 text-white py-2 px-4 rounded-lg shadow-xl translate-x-[120%] transition-transform duration-300';
    const colors = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500' };
    elements.toast.classList.add(colors[type] || 'bg-gray-500');
    elements.toast.classList.remove('translate-x-[120%]');
    setTimeout(() => {
        elements.toast.classList.add('translate-x-[120%]');
    }, 3000);
}

/**
 * [核心修正] 使样式应用函数能够兼容两种模式
 */
export function applyCanvasStyles() {
    const spacing = elements.spacingSlider.value;
    const radius = elements.radiusSlider.value;
    const bgColor = elements.colorPicker.value;

    elements.spacingValue.textContent = spacing;
    elements.radiusValue.textContent = radius;

    // 根据当前模式，选择正确的元素进行样式操作
    if (state.currentMode === 'layout') {
        const wrapper = elements.layoutWrapper;
        const grid = elements.layoutGrid;
        
        wrapper.style.backgroundColor = bgColor;
        // 在布局模式，内边距和间距都作用于网格本身
        grid.style.padding = `${spacing}px`;
        grid.style.gap = `${spacing}px`;
        
        grid.querySelectorAll('.grid-cell').forEach(cell => {
            cell.style.borderRadius = `${radius}px`;
        });

    } else { // Stitching mode
        const wrapper = elements.stitchingWrapper;
        const grid = elements.stitchingGrid;
        
        // 在拼图模式，背景色和内边距作用于外部容器，形成画框效果
        wrapper.style.backgroundColor = bgColor;
        wrapper.style.padding = `${spacing}px`; 
        grid.style.gap = `${spacing}px`; // gap 是图片之间的间距
        
        grid.querySelectorAll('img').forEach(img => {
            img.style.borderRadius = `${radius}px`;
        });
    }
}

export function applyImageToCell(cellId, imageUrl) {
    const cell = document.getElementById(cellId);
    if (!cell) return;
    cell.style.backgroundImage = `url(${imageUrl})`;
    if(cell.querySelector('label')) {
        cell.querySelector('label').innerHTML = '';
    }
}

export function clearImageFromCell(cellId) {
    const cell = document.getElementById(cellId);
    if (!cell) return;
    cell.style.backgroundImage = '';
    if(cell.querySelector('label')) {
        cell.querySelector('label').innerHTML = ICONS.upload;
    }
}

export function updateShuffleButton() {
    let imageCount = 0;
    if (state.currentMode === 'layout') {
        imageCount = Object.keys(state.imagesData).length;
    } else {
        imageCount = state.stitchingImages.length;
    }
    elements.shuffleBtn.disabled = imageCount < 2;
}

// /js/actions.js (修正版)

import { state, setCurrentLayout } from './state.js';
import { elements, createEl } from './dom.js';
import { renderCanvas, createGutters } from './canvas.js';
import { showToast, applyImageToCell, clearImageFromCell, updateShuffleButton } from './ui.js';

// --- 模式管理 ---
export function setMode(mode) {
    if (mode === state.currentMode) return;
    state.currentMode = mode;

    // 更新UI元素的可见性
    const isLayout = mode === 'layout';
    elements.layoutControls.classList.toggle('hidden', !isLayout);
    elements.stitchingControls.classList.toggle('hidden', isLayout);
    elements.canvasSettings.classList.toggle('hidden', !isLayout);
    elements.layoutWrapper.classList.toggle('hidden', !isLayout);
    elements.stitchingWrapper.classList.toggle('hidden', isLayout);
    
    // 更新Tab按钮的激活状态
    elements.layoutModeBtn.classList.toggle('active', isLayout);
    elements.stitchingModeBtn.classList.toggle('active', !isLayout);

    updateShuffleButton();
    renderCanvas();
}

export function setStitchingDirection(direction) {
    if (direction === state.stitchingDirection) return;
    state.stitchingDirection = direction;

    document.querySelector('#stitching-direction-btns .active').classList.remove('active');
    document.querySelector(`#stitching-direction-btns [data-direction="${direction}"]`).classList.add('active');

    renderCanvas();
}


// --- 核心功能 ---
export function selectNewLayout(newLayoutId) {
    if (state.currentMode !== 'layout' || newLayoutId === state.currentLayoutId) return;
    
    elements.layoutContainer.querySelector('.active')?.classList.remove('active');
    elements.layoutContainer.querySelector(`[data-layout="${newLayoutId}"]`)?.classList.add('active');
    
    setCurrentLayout(newLayoutId);
    renderCanvas();
}

export function updateAspectRatio(button) {
    if (state.currentMode !== 'layout') return;

    elements.aspectRatioBtns.querySelector('.active')?.classList.remove('active');
    button.classList.add('active');
    
    const ratio = button.dataset.ratio;
    // 核心修正：确保操作的是 layoutWrapper
    elements.layoutWrapper.style.aspectRatio = ratio;
    elements.layoutWrapper.style.height = 'auto';
    elements.layoutWrapper.style.minHeight = '0';
    setTimeout(createGutters, 100);
}

export function processAndUploadMultipleFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    const imageFiles = Array.from(fileList).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
        showToast('未选择有效的图片文件', 'error');
        return;
    }

    if (state.currentMode === 'layout') {
        const allCellIds = Array.from(document.querySelectorAll('#layout-grid .grid-cell')).map(cell => cell.id);
        const emptyCellIds = allCellIds.filter(id => !state.imagesData[id]);
        if (emptyCellIds.length === 0) {
            showToast('没有空的格子可以放置图片', 'error');
            return;
        }
        const limit = Math.min(imageFiles.length, emptyCellIds.length);
        let imagesUploadedCount = 0;
        for (let i = 0; i < limit; i++) {
            const file = imageFiles[i];
            const cellId = emptyCellIds[i];
            const reader = new FileReader();
            reader.onload = e => {
                state.imagesData[cellId] = e.target.result;
                applyImageToCell(cellId, e.target.result);
                imagesUploadedCount++;
                if (imagesUploadedCount === limit) {
                    updateShuffleButton();
                    const message = `成功上传 ${limit} 张图片。` + (imageFiles.length > limit ? ` 已忽略 ${imageFiles.length - limit} 张多余的图片。` : '');
                    showToast(message, 'success');
                }
            };
            reader.readAsDataURL(file);
        }
    } else { // 拼图模式
        const readerPromises = imageFiles.map(file => {
            return new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        });

        Promise.all(readerPromises).then(newImages => {
            state.stitchingImages = newImages; 
            showToast(`成功选择 ${newImages.length} 张图片`, 'success');
            updateShuffleButton();
            renderCanvas();
        });
    }
}

export function shuffleImages() {
    let imageCount = 0;
    if (state.currentMode === 'layout') {
        const imageDataEntries = Object.entries(state.imagesData);
        imageCount = imageDataEntries.length;
        if (imageCount < 2) return;
        
        const urls = imageDataEntries.map(entry => entry[1]);
        for (let i = urls.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [urls[i], urls[j]] = [urls[j], urls[i]];
        }
        
        imageDataEntries.forEach(([cellId], index) => {
            state.imagesData[cellId] = urls[index];
            applyImageToCell(cellId, urls[index]);
        });

    } else { // 拼图模式
        imageCount = state.stitchingImages.length;
        if (imageCount < 2) return;
        for (let i = state.stitchingImages.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [state.stitchingImages[i], state.stitchingImages[j]] = [state.stitchingImages[j], state.stitchingImages[i]];
        }
        renderCanvas();
    }

    if (imageCount > 1) {
        showToast('图片已随机排序', 'info');
    }
}

export function swapImages(sourceCellId, targetCellId) {
    if (state.currentMode !== 'layout' || !targetCellId) return;

    const sourceImage = state.imagesData[sourceCellId];
    const targetImage = state.imagesData[targetCellId];

    state.imagesData[targetCellId] = sourceImage;
    applyImageToCell(targetCellId, sourceImage);

    if (targetImage) {
        state.imagesData[sourceCellId] = targetImage;
        applyImageToCell(sourceCellId, targetImage);
    } else {
        delete state.imagesData[sourceCellId];
        clearImageFromCell(sourceCellId);
    }
}

export function removeImage(cellId) {
    if (state.currentMode !== 'layout') return;
    delete state.imagesData[cellId];
    clearImageFromCell(cellId);
    updateShuffleButton();
}

export function downloadCollage() {
    const targetWrapper = state.currentMode === 'layout' ? elements.layoutWrapper : elements.stitchingWrapper;
    const targetGrid = state.currentMode === 'layout' ? elements.layoutGrid : elements.stitchingGrid;
    
    targetGrid.querySelectorAll('.gutter').forEach(g => g.style.display = 'none');
    showToast('正在生成高清晰度图片...', 'info');

    const options = {
        useCORS: true,
        backgroundColor: elements.colorPicker.value,
        scale: 3,
        width: targetGrid.scrollWidth,
        height: targetGrid.scrollHeight,
    };
    
    // 截图目标应该是包含所有内容的 Grid
    html2canvas(targetGrid, options).then(canvas => {
        targetGrid.querySelectorAll('.gutter').forEach(g => g.style.display = 'block');
        
        const link = createEl('a');
        link.download = `${state.currentMode}-collage-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('图片已成功保存！', 'success');
    }).catch(err => {
        console.error("截图失败:", err);
        showToast('截图失败，请重试', 'error');
        targetGrid.querySelectorAll('.gutter').forEach(g => g.style.display = 'block');
    });
}

// /js/canvas.js

import { layouts } from './layouts.js';
import { state } from './state.js';
import { elements, createEl, ICONS } from './dom.js';
import { applyCanvasStyles, applyImageToCell, clearImageFromCell } from './ui.js';
import * as actions from './actions.js';

export function renderCanvas() {
    applyCanvasStyles();

    if (state.currentMode === 'layout') {
        elements.layoutWrapper.classList.remove('hidden');
        elements.stitchingWrapper.classList.add('hidden');
        renderLayoutMode();
    } else {
        elements.layoutWrapper.classList.add('hidden');
        elements.stitchingWrapper.classList.remove('hidden');
        renderStitchingMode();
    }
}

function renderLayoutMode() {
    const collageGrid = elements.layoutGrid; // 使用 layoutGrid
    collageGrid.innerHTML = '';
    
    Object.assign(collageGrid.style, {
        display: 'grid',
        flexDirection: ''
    });

    const layout = layouts[state.currentLayoutId];
    if (!layout) return;

    const [rows, cols] = layout.gr;
    state.colFractions = Array(cols).fill(1);
    state.rowFractions = Array(rows).fill(1);
    
    collageGrid.style.gridTemplateRows = state.rowFractions.map(f => `${f}fr`).join(' ');
    collageGrid.style.gridTemplateColumns = state.colFractions.map(f => `${f}fr`).join(' ');

    const cells = layout.c || Array.from({ length: rows * cols }, () => ({ r: 1, c: 1 }));
    const oldImagesData = { ...state.imagesData };
    state.imagesData = {};

    cells.forEach((cellInfo, i) => {
        const cellId = `cell-${i}`;
        const cell = createCell(cellId);
        
        cell.style.gridRowEnd = `span ${cellInfo.r}`;
        cell.style.gridColumnEnd = `span ${cellInfo.c}`;
        if (cellInfo.s) {
            cell.style.gridRowStart = cellInfo.s[0];
            cell.style.gridColumnStart = cellInfo.s[1];
        }
        
        collageGrid.appendChild(cell);
        
        if (oldImagesData[cellId]) {
            state.imagesData[cellId] = oldImagesData[cellId];
            applyImageToCell(cellId, state.imagesData[cellId]);
        }
    });

    setTimeout(createGutters, 100);
}

function renderStitchingMode() {
    const collageGrid = elements.stitchingGrid; // 使用 stitchingGrid
    collageGrid.innerHTML = '';
    
    collageGrid.className = 'collage-grid'; // 重置类名
    collageGrid.classList.add(state.stitchingDirection);

    state.stitchingImages.forEach((imgSrc, index) => {
        const img = createEl('img');
        img.src = imgSrc;
        img.dataset.index = index;
        img.style.borderRadius = `${elements.radiusSlider.value}px`;
        collageGrid.appendChild(img);
    });
}

function createCell(cellId) {
    const cell = createEl('div', 'grid-cell');
    cell.id = cellId;
    cell.draggable = true;

    cell.addEventListener('dragstart', e => {
        if (state.imagesData[cellId]) {
            e.dataTransfer.setData('text/plain', cellId);
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => e.target.classList.add('dragging'), 0);
        } else { e.preventDefault(); }
    });
    cell.addEventListener('dragend', e => e.target.classList.remove('dragging'));
    cell.addEventListener('dragover', e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); });
    cell.addEventListener('dragleave', e => e.currentTarget.classList.remove('drag-over'));
    cell.addEventListener('drop', e => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const sourceCellId = e.dataTransfer.getData('text/plain');
        if (sourceCellId) {
            if(sourceCellId !== e.currentTarget.id) actions.swapImages(sourceCellId, e.currentTarget.id);
        } else if (e.dataTransfer.files.length > 0) {
            actions.processAndUploadMultipleFiles(e.dataTransfer.files);
        }
    });
    
    const fileInput = createEl('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.id = `input-${cellId}`;
    fileInput.multiple = true;
    fileInput.onchange = e => actions.processAndUploadMultipleFiles(e.target.files);
    
    const label = createEl('label');
    label.htmlFor = `input-${cellId}`;
    label.className = 'w-full h-full flex items-center justify-center cursor-pointer';
    label.innerHTML = ICONS.upload;
    
    const removeBtn = createEl('div', 'remove-image-btn');
    removeBtn.innerHTML = ICONS.remove;
    removeBtn.onclick = e => { e.stopPropagation(); actions.removeImage(cellId); };
    
    cell.append(label, fileInput, removeBtn);
    return cell;
}

export function createGutters() {
    const grid = elements.layoutGrid;
    grid.querySelectorAll('.gutter').forEach(g => g.remove());
    if (state.currentMode !== 'layout') return;

    const layout = layouts[state.currentLayoutId];
    if (!layout) return;

    const [rows, cols] = layout.gr;
    const gridRect = grid.getBoundingClientRect();

    if (cols > 1) {
        const colWidths = state.colFractions.map(fr => fr / state.colFractions.reduce((a, b) => a + b, 0) * gridRect.width);
        let currentLeft = 0;
        for (let i = 0; i < cols - 1; i++) {
            currentLeft += colWidths[i];
            const gutter = createEl('div', 'gutter gutter-v');
            gutter.style.left = `${currentLeft}px`;
            gutter.style.height = '100%';
            gutter.dataset.index = i;
            grid.appendChild(gutter);
            addGutterDrag(gutter, 'v');
        }
    }
    
    if (rows > 1) {
        const rowHeights = state.rowFractions.map(fr => fr / state.rowFractions.reduce((a, b) => a + b, 0) * gridRect.height);
        let currentTop = 0;
        for (let i = 0; i < rows - 1; i++) {
            currentTop += rowHeights[i];
            const gutter = createEl('div', 'gutter gutter-h');
            gutter.style.top = `${currentTop}px`;
            gutter.style.width = '100%';
            gutter.dataset.index = i;
            grid.appendChild(gutter);
            addGutterDrag(gutter, 'h');
        }
    }
}

function addGutterDrag(gutter, direction) {
    gutter.onmousedown = function(e) {
        e.preventDefault();
        const grid = elements.layoutGrid;
        const index = parseInt(gutter.dataset.index);
        const gridRect = grid.getBoundingClientRect();

        const onMouseMove = function(moveEvent) {
            if (direction === 'v') {
                const totalFr = state.colFractions[index] + state.colFractions[index + 1];
                const totalWidthsBefore = state.colFractions.slice(0, index).reduce((sum, fr) => sum + (fr / state.colFractions.reduce((a, b) => a + b, 0) * gridRect.width), 0);
                const pointerPos = moveEvent.clientX - gridRect.left;
                let newFr1 = (pointerPos - totalWidthsBefore) / gridRect.width * state.colFractions.reduce((a, b) => a + b, 0);
                
                if (newFr1 < 0.1) newFr1 = 0.1;
                let newFr2 = totalFr - newFr1;
                if (newFr2 < 0.1) { newFr2 = 0.1; newFr1 = totalFr - 0.1; }

                state.colFractions[index] = newFr1;
                state.colFractions[index + 1] = newFr2;
                grid.style.gridTemplateColumns = state.colFractions.map(f => `${f}fr`).join(' ');
            } else {
                const totalFr = state.rowFractions[index] + state.rowFractions[index + 1];
                const totalHeightsBefore = state.rowFractions.slice(0, index).reduce((sum, fr) => sum + (fr / state.rowFractions.reduce((a, b) => a + b, 0) * gridRect.height), 0);
                const pointerPos = moveEvent.clientY - gridRect.top;
                let newFr1 = (pointerPos - totalHeightsBefore) / gridRect.height * state.rowFractions.reduce((a, b) => a + b, 0);
                
                if (newFr1 < 0.1) newFr1 = 0.1;
                let newFr2 = totalFr - newFr1;
                if (newFr2 < 0.1) { newFr2 = 0.1; newFr1 = totalFr - 0.1; }
                
                state.rowFractions[index] = newFr1;
                state.rowFractions[index + 1] = newFr2;
                grid.style.gridTemplateRows = state.rowFractions.map(f => `${f}fr`).join(' ');
            }
        };

        const onMouseUp = function() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            setTimeout(createGutters, 50);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };
}

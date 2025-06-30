// /js/dom.js

export const elements = {
    // General
    toast: document.getElementById('toast'),
    
    // Mode Switcher
    modeSwitcher: document.getElementById('mode-switcher'),
    layoutModeBtn: document.getElementById('layout-mode-btn'),
    stitchingModeBtn: document.getElementById('stitching-mode-btn'),

    // Canvas Containers
    layoutWrapper: document.getElementById('layout-wrapper'),
    layoutGrid: document.getElementById('layout-grid'),
    stitchingWrapper: document.getElementById('stitching-wrapper'),
    stitchingGrid: document.getElementById('stitching-grid'),

    // Left Sidebar Controls
    layoutControls: document.getElementById('layout-controls'),
    stitchingControls: document.getElementById('stitching-controls'),
    layoutContainer: document.getElementById('layout-container'),
    stitchingDirectionBtns: document.getElementById('stitching-direction-btns'),
    stitchingUploadBtn: document.getElementById('stitching-upload-btn'),
    stitchingUploadInput: document.getElementById('stitching-upload-input'),
    
    // Right Sidebar Controls
    canvasSettings: document.getElementById('canvas-settings'),
    aspectRatioBtns: document.getElementById('aspect-ratio-btns'),
    spacingSlider: document.getElementById('spacing-slider'),
    spacingValue: document.getElementById('spacing-value'),
    radiusSlider: document.getElementById('radius-slider'),
    radiusValue: document.getElementById('radius-value'),
    colorPicker: document.getElementById('color-picker'),
    shuffleBtn: document.getElementById('shuffle-btn'),
    downloadBtn: document.getElementById('download-btn'),
};

export const createEl = (tag, className) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
};

export const ICONS = {
    upload: `<div class="upload-icon"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 256 256"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm48-88a8,8,0,0,1-8,8H136v32a8,8,0,0,1-16,0V136H88a8,8,0,0,1,0-16h32V88a8,8,0,0,1,16,0v32h32A8,8,0,0,1,176,128Z"></path></svg></div>`,
    remove: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>`
};

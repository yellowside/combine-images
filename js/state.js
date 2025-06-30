// /js/state.js

export const state = {
    // 新增：当前模式 ('layout' 或 'stitching')
    currentMode: 'layout', 
    
    // -- 布局模式状态 --
    currentLayoutId: '3-t1b2',
    imagesData: {}, // { cellId: 'data:image/...' }
    colFractions: [],
    rowFractions: [],

    // -- 拼图模式状态 --
    stitchingImages: [], // ['data:image/...', 'data:image/...']
    stitchingDirection: 'horizontal', // 'horizontal' 或 'vertical'
};

// Functions to manipulate state
export function setImagesData(newData) {
    state.imagesData = newData;
}

export function updateImageData(cellId, dataUrl) {
    state.imagesData[cellId] = dataUrl;
}

export function removeImageData(cellId) {
    delete state.imagesData[cellId];
}

export function setCurrentLayout(layoutId) {
    state.currentLayoutId = layoutId;
}

export function setFractions(rows, cols) {
    state.rowFractions = Array(rows).fill(1);
    state.colFractions = Array(cols).fill(1);
}

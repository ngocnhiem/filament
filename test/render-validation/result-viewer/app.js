import './components/result-table.js';
import './components/image-viewer.js';

async function init() {
    const container = document.getElementById('container');
    
    try {
        const response = await fetch('./data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        container.innerHTML = `
            <result-table></result-table>
            <image-viewer></image-viewer>
        `;
        
        const resultTable = container.querySelector('result-table');
        const imageViewer = container.querySelector('image-viewer');
        
        resultTable.results = data;
        
        // Listen for view events from the table
        container.addEventListener('view-result', (e) => {
            imageViewer.open(e.detail.device, e.detail.run);
        });

    } catch (e) {
        container.innerHTML = `<div style="color: red; padding: 20px;">Error loading results: ${e.message}.<br>Make sure you are running a local server.</div>`;
        console.error("Failed to load data:", e);
    }
}

document.addEventListener('DOMContentLoaded', init);

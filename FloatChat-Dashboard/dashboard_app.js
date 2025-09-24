document.addEventListener('DOMContentLoaded', () => {
    // ==================== MODAL LOGIC ====================
    const modal = document.getElementById("advancedFiltersModal");
    const btn = document.getElementById("advancedFiltersBtn");
    const span = document.getElementsByClassName("close-button")[0];

    if (modal && btn && span) {
        btn.onclick = function() { modal.style.display = "block"; }
        span.onclick = function() { modal.style.display = "none"; }
        window.onclick = function(event) { if (event.target == modal) { modal.style.display = "none"; } }
    }

    // ==================== DOM ELEMENT REFERENCES ====================
    const parameterSelect = document.getElementById('parameterSelect');
    const mainChartCtx = document.getElementById('mainAnalysisChart').getContext('2d');
    const trajectoriesCtx = document.getElementById('floatTrajectoriesChart').getContext('2d');
    const comparativeCtx = document.getElementById('comparativeAnalysisChart').getContext('2d');
    const comparativeChartCanvas = document.getElementById('comparativeAnalysisChart');
    const comparativeChartMessage = document.getElementById('comparativeAnalysisMessage');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const floatIdInput = document.getElementById('floatIdFilter');

    // ==================== MOCK DATA ====================
    const originalMockData = [
        { "FLOAT_ID": 7902246, "TEMP": 28.7, "PSAL": 34.6, "PRES": 10, "LAT": -1.0, "LON": 78.3, "DATE": "2025-01-01" },
        { "FLOAT_ID": 7902246, "TEMP": 28.9, "PSAL": 34.6, "PRES": 12, "LAT": -1.1, "LON": 78.4, "DATE": "2025-12-31" },
        { "FLOAT_ID": 7902247, "TEMP": 29.1, "PSAL": 34.8, "PRES": 11, "LAT": -2.5, "LON": 80.1, "DATE": "2025-01-15" },
        { "FLOAT_ID": 7902247, "TEMP": 29.3, "PSAL": 34.9, "PRES": 14, "LAT": -2.6, "LON": 80.2, "DATE": "2025-02-20" },
        { "FLOAT_ID": 7902248, "TEMP": 28.5, "PSAL": 34.5, "PRES": 9, "LAT": -1.5, "LON": 79.5, "DATE": "2025-03-10" },
        { "FLOAT_ID": 7902248, "TEMP": 28.6, "PSAL": 34.5, "PRES": 11, "LAT": -1.6, "LON": 79.6, "DATE": "2025-03-25" },
        { "FLOAT_ID": 7902249, "TEMP": 29.5, "PSAL": 35.1, "PRES": 15, "LAT": -3.0, "LON": 81.0, "DATE": "2025-04-01" },
        { "FLOAT_ID": 7902250, "TEMP": 28.1, "PSAL": 34.3, "PRES": 8, "LAT": -0.5, "LON": 77.0, "DATE": "2025-04-12" },
        { "FLOAT_ID": 7902251, "TEMP": 28.8, "PSAL": 34.7, "PRES": 12, "LAT": -2.0, "LON": 78.8, "DATE": "2025-05-03" },
        { "FLOAT_ID": 7902252, "TEMP": 29.0, "PSAL": 34.8, "PRES": 13, "LAT": -2.2, "LON": 79.0, "DATE": "2025-05-18" },
    ];
    
    let currentData = [...originalMockData];

    // ==================== CHART CONFIGURATION & INITIALIZATION ====================
    const parameterConfig = {
        TEMP: { label: 'Temperature', unit: '°C' },
        PSAL: { label: 'Salinity', unit: 'PSU' },
        PRES: { label: 'Pressure', unit: 'dbar' }
    };
    const floatColors = ['hsl(180, 85%, 35%)', 'hsl(210, 85%, 45%)', 'hsl(345, 85%, 45%)', 'hsl(39, 95%, 55%)', 'hsl(270, 85%, 55%)', 'hsl(60, 85%, 45%)', 'hsl(0, 85%, 55%)'];
    
    const mainAnalysisChart = new Chart(mainChartCtx, { type: 'line', data: { datasets: [{ tension: 0.3, fill: true }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: false, title: { display: true } } } } });
    const floatTrajectoriesChart = new Chart(trajectoriesCtx, { type: 'scatter', data: { datasets: [] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'top' }, title: { display: true, text: 'Float Positions' } }, scales: { x: { title: { display: true, text: 'Longitude' } }, y: { title: { display: true, text: 'Latitude' } } } } });
    const comparativeAnalysisChart = new Chart(comparativeCtx, { type: 'bar', data: { datasets: [{ borderRadius: 5 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true } }, scales: { y: { beginAtZero: false, title: { display: true } } } } });
    
    // ==================== MASTER UPDATE FUNCTION ====================
    function updateAllVisuals(data) {
        const selectedParameter = parameterSelect.value;
        const config = parameterConfig[selectedParameter];
        const allOriginalFloatIds = [...new Set(originalMockData.map(item => item.FLOAT_ID))];

        // Update Stats Bar
        const uniqueIds = [...new Set(data.map(item => item.FLOAT_ID))];
        document.getElementById('activeFloatsStat').textContent = uniqueIds.length;
        document.getElementById('dataPointsStat').textContent = data.length;
        if (data.length > 0) {
            const totalTemp = data.reduce((sum, item) => sum + item.TEMP, 0);
            document.getElementById('avgTempStat').textContent = `${(totalTemp / data.length).toFixed(1)}°C`;
            const totalSalinity = data.reduce((sum, item) => sum + item.PSAL, 0);
            document.getElementById('avgSalinityStat').textContent = (totalSalinity / data.length).toFixed(1);
            const allDates = data.map(item => new Date(item.DATE));
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('date-from').value = new Date(Math.min(...allDates)).toLocaleDateString('en-US', options);
            document.getElementById('date-to').value = new Date(Math.max(...allDates)).toLocaleDateString('en-US', options);
        } else {
            document.getElementById('activeFloatsStat').textContent = 0;
            document.getElementById('dataPointsStat').textContent = 0;
            document.getElementById('avgTempStat').textContent = 'N/A';
            document.getElementById('avgSalinityStat').textContent = 'N/A';
            document.getElementById('date-from').value = 'N/A';
            document.getElementById('date-to').value = 'N/A';
        }
        document.getElementById('lastUpdated').textContent = `Last Updated: ${new Date().toLocaleTimeString('en-US')}`;

        // Update Main Line Chart
        mainAnalysisChart.data.labels = data.map(item => item.DATE);
        mainAnalysisChart.data.datasets[0].data = data.map(item => item[selectedParameter]);
        mainAnalysisChart.data.datasets[0].label = config.label;
        mainAnalysisChart.options.scales.y.title.text = `${config.label} (${config.unit})`;
        mainAnalysisChart.data.datasets[0].borderColor = 'hsl(210, 85%, 25%)';
        mainAnalysisChart.data.datasets[0].backgroundColor = 'hsla(210, 85%, 25%, 0.1)';
        mainAnalysisChart.update();
        
        // Update Trajectories Scatter Plot
        floatTrajectoriesChart.data.datasets = uniqueIds.map(id => {
            const colorIndex = allOriginalFloatIds.indexOf(id);
            return {
                label: `Float ${id}`,
                data: data.filter(item => item.FLOAT_ID === id).map(d => ({ x: d.LON, y: d.LAT })),
                backgroundColor: floatColors[colorIndex % floatColors.length],
            };
        });
        floatTrajectoriesChart.update();

        // Update Comparative Bar Chart
        if (uniqueIds.length <= 1) {
            comparativeChartCanvas.style.display = 'none';
            comparativeChartMessage.style.display = 'block';
        } else {
            comparativeChartCanvas.style.display = 'block';
            comparativeChartMessage.style.display = 'none';
            comparativeAnalysisChart.data.labels = uniqueIds.map(id => `Float ${id}`);
            const backgroundColors = uniqueIds.map(id => floatColors[allOriginalFloatIds.indexOf(id) % floatColors.length]);
            comparativeAnalysisChart.data.datasets[0].data = uniqueIds.map(id => {
                const floatData = data.filter(item => item.FLOAT_ID === id);
                return floatData.reduce((sum, item) => sum + item[selectedParameter], 0) / floatData.length;
            });
            comparativeAnalysisChart.data.datasets[0].backgroundColor = backgroundColors;
            comparativeAnalysisChart.options.plugins.title.text = `Average ${config.label} by Float`;
            comparativeAnalysisChart.options.scales.y.title.text = `Average ${config.label} (${config.unit})`;
            comparativeAnalysisChart.update();
        }
    }

    // ==================== EVENT HANDLERS ====================
    function applyFilters() {
        let filteredData = [...originalMockData];
        const floatIdFilter = floatIdInput.value.trim();

        if (floatIdFilter) {
            filteredData = filteredData.filter(item => item.FLOAT_ID.toString() === floatIdFilter);
        }
        
        currentData = filteredData;
        updateAllVisuals(currentData);
        modal.style.display = "none";
    }
    
    function clearFilters() {
        currentData = [...originalMockData];
        floatIdInput.value = '';
        updateAllVisuals(currentData);
        modal.style.display = "none";
    }

    // ==================== EVENT LISTENERS ====================
    if (modal && btn && span) {
        btn.onclick = () => modal.style.display = "block";
        span.onclick = () => modal.style.display = "none";
        window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; };
    }
    parameterSelect.addEventListener('change', () => updateAllVisuals(currentData));
    applyFiltersBtn.addEventListener('click', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);

    // ==================== INITIAL PAGE LOAD ====================
    updateAllVisuals(currentData);
});
document.addEventListener('DOMContentLoaded', () => {
    // ==================== MODAL LOGIC ====================
    const modal = document.getElementById("advancedFiltersModal");
    const btn = document.getElementById("advancedFiltersBtn");
    const span = document.getElementsByClassName("close-button")[0];

    if (modal && btn && span) {
        btn.onclick = function() { modal.style.display = "block"; }
        span.onclick = function() { modal.style.display = "none"; }
        window.onclick = function(event) { if (event.target == modal) { modal.style.display = "none"; } }
    } else {
        console.error("Modal elements not found. Check your HTML IDs and classes.");
    }

    // ==================== DOM ELEMENT REFERENCES for CHARTS ====================
    const parameterSelect = document.getElementById('parameterSelect');
    const mainChartCtx = document.getElementById('mainAnalysisChart').getContext('2d');
    const trajectoriesCtx = document.getElementById('floatTrajectoriesChart').getContext('2d');
    const comparativeCtx = document.getElementById('comparativeAnalysisChart').getContext('2d');
    const comparativeChartCanvas = document.getElementById('comparativeAnalysisChart');
    const comparativeChartMessage = document.getElementById('comparativeAnalysisMessage');

    // ==================== MOCK DATA ====================
    const mockApiData = [
        // Float #1
        { "FLOAT_ID": 7902246, "TEMP": 28.7, "PSAL": 34.6, "PRES": 10, "LAT": -1.0, "LON": 78.3, "DATE": "2025-01-01" },
        { "FLOAT_ID": 7902246, "TEMP": 28.9, "PSAL": 34.6, "PRES": 12, "LAT": -1.1, "LON": 78.4, "DATE": "2025-12-31" },
        // Float #2
        { "FLOAT_ID": 7902247, "TEMP": 29.1, "PSAL": 34.8, "PRES": 11, "LAT": -2.5, "LON": 80.1, "DATE": "2025-01-01" },
        { "FLOAT_ID": 7902247, "TEMP": 29.3, "PSAL": 34.9, "PRES": 14, "LAT": -2.6, "LON": 80.2, "DATE": "2025-12-31" },
        // Float #3
        { "FLOAT_ID": 7902248, "TEMP": 28.5, "PSAL": 34.5, "PRES": 9, "LAT": -1.5, "LON": 79.5, "DATE": "2025-01-01" },
        { "FLOAT_ID": 7902248, "TEMP": 28.6, "PSAL": 34.5, "PRES": 11, "LAT": -1.6, "LON": 79.6, "DATE": "2025-12-31" },
        // Float #4
        { "FLOAT_ID": 7902249, "TEMP": 29.5, "PSAL": 35.1, "PRES": 15, "LAT": -3.0, "LON": 81.0, "DATE": "2025-01-01" },
        // Float #5
        { "FLOAT_ID": 7902250, "TEMP": 28.1, "PSAL": 34.3, "PRES": 8, "LAT": -0.5, "LON": 77.0, "DATE": "2025-01-01" },
        // Float #6
        { "FLOAT_ID": 7902251, "TEMP": 28.8, "PSAL": 34.7, "PRES": 12, "LAT": -2.0, "LON": 78.8, "DATE": "2025-01-01" },
        // Float #7
        { "FLOAT_ID": 7902252, "TEMP": 29.0, "PSAL": 34.8, "PRES": 13, "LAT": -2.2, "LON": 79.0, "DATE": "2025-01-01" },
    ];
    
    // ==================== CHART CONFIGURATION & INITIALIZATION ====================
    const parameterConfig = {
        TEMP: { label: 'Temperature', unit: '°C' },
        PSAL: { label: 'Salinity', unit: 'PSU' },
        PRES: { label: 'Pressure', unit: 'dbar' }
    };

    const floatColors = ['hsl(180, 85%, 35%)', 'hsl(210, 85%, 45%)', 'hsl(345, 85%, 45%)', 'hsl(39, 95%, 55%)', 'hsl(270, 85%, 55%)', 'hsl(60, 85%, 45%)', 'hsl(0, 85%, 55%)'];
    const uniqueFloatIds = [...new Set(mockApiData.map(item => item.FLOAT_ID))];

    const mainAnalysisChart = new Chart(mainChartCtx, {
        type: 'line',
        data: { labels: [], datasets: [{ data: [], borderColor: 'hsl(210, 85%, 25%)', backgroundColor: 'hsla(210, 85%, 25%, 0.1)', fill: true, tension: 0.3 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: false, title: { display: true, text: '' } } } }
    });

    const trajectoriesDatasets = uniqueFloatIds.map((id, index) => {
        const floatData = mockApiData.filter(item => item.FLOAT_ID === id);
        return {
            label: `Float ${id}`,
            data: floatData.map(d => ({ x: d.LON, y: d.LAT })),
            backgroundColor: floatColors[index % floatColors.length],
        };
    });

    const floatTrajectoriesChart = new Chart(trajectoriesCtx, {
        type: 'scatter',
        data: { datasets: trajectoriesDatasets },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'top' }, title: { display: true, text: 'Float Positions' } }, scales: { x: { title: { display: true, text: 'Longitude' } }, y: { title: { display: true, text: 'Latitude' } } } }
    });

    const comparativeAnalysisChart = new Chart(comparativeCtx, {
        type: 'bar',
        data: { labels: uniqueFloatIds.map(id => `Float ${id}`), datasets: [{ data: [], backgroundColor: floatColors, borderRadius: 5 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: true, text: '' } }, scales: { y: { beginAtZero: false, title: { display: true, text: '' } } } }
    });

    // ==================== DYNAMIC FUNCTIONS ====================
    function updateStatsBar() {
        document.getElementById('activeFloatsStat').textContent = uniqueFloatIds.length;
        document.getElementById('dataPointsStat').textContent = mockApiData.length;

        const totalTemp = mockApiData.reduce((sum, item) => sum + item.TEMP, 0);
        const avgTemp = (totalTemp / mockApiData.length).toFixed(1);
        document.getElementById('avgTempStat').textContent = `${avgTemp}°C`;
        
        const totalSalinity = mockApiData.reduce((sum, item) => sum + item.PSAL, 0);
        const avgSalinity = (totalSalinity / mockApiData.length).toFixed(1);
        document.getElementById('avgSalinityStat').textContent = `${avgSalinity}`;

        const allDates = mockApiData.map(item => new Date(item.DATE));
        const minDate = new Date(Math.min(...allDates));
        const maxDate = new Date(Math.max(...allDates));

        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedMinDate = minDate.toLocaleDateString('en-US', options);
        const formattedMaxDate = maxDate.toLocaleDateString('en-US', options);

        document.getElementById('date-from').value = formattedMinDate;
        document.getElementById('date-to').value = formattedMaxDate;
    }

    function updateMainChart(parameterKey, data) {
        const labels = data.map(item => item.DATE);
        const dataPoints = data.map(item => item[parameterKey]);

        mainAnalysisChart.data.labels = labels;
        mainAnalysisChart.data.datasets[0].data = dataPoints;
        
        const config = parameterConfig[parameterKey];
        mainAnalysisChart.data.datasets[0].label = config.label;
        mainAnalysisChart.options.scales.y.title.text = `${config.label} (${config.unit})`;
        
        mainAnalysisChart.update();
    }

    function updateComparativeChart(parameterKey, data) {
        const uniqueIds = [...new Set(data.map(item => item.FLOAT_ID))];
        const config = parameterConfig[parameterKey];

        if (uniqueIds.length <= 1) {
            comparativeChartCanvas.style.display = 'none';
            comparativeChartMessage.style.display = 'block';
        } else {
            comparativeChartCanvas.style.display = 'block';
            comparativeChartMessage.style.display = 'none';

            const avgValuePerFloat = uniqueIds.map(id => {
                const floatData = data.filter(item => item.FLOAT_ID === id);
                if (floatData.length === 0) return 0;
                const totalValue = floatData.reduce((sum, item) => sum + item[parameterKey], 0);
                return totalValue / floatData.length;
            });

            comparativeAnalysisChart.data.labels = uniqueIds.map(id => `Float ${id}`);
            comparativeAnalysisChart.data.datasets[0].data = avgValuePerFloat;
            comparativeAnalysisChart.data.datasets[0].label = `Average ${config.label} (${config.unit})`;
            comparativeAnalysisChart.options.plugins.title.text = `Average ${config.label} by Float`;
            comparativeAnalysisChart.options.scales.y.title.text = `Average ${config.label} (${config.unit})`;
            
            comparativeAnalysisChart.update();
        }
    }
    
    // ==================== EVENT LISTENERS ====================
    parameterSelect.addEventListener('change', (event) => {
        const selectedParameter = event.target.value;
        updateMainChart(selectedParameter, mockApiData);
        updateComparativeChart(selectedParameter, mockApiData);
    });

    // ==================== INITIAL PAGE LOAD ====================
    updateMainChart('TEMP', mockApiData);
    updateComparativeChart('TEMP', mockApiData);
    updateStatsBar();
});
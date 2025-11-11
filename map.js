/*
  Interactive hot-pink world map using Google Charts GeoChart.
  - All countries hot pink, pastel background.
  - On country click, rain that country's flag from the top.
*/

(function () {
    // Load Google Charts
    google.charts.load('current', {
        packages: ['geochart'],
    });

    google.charts.setOnLoadCallback(drawRegionsMap);

    function getCountryData() {
        const countries = window.countryData || [];
        const rows = countries.map((country) => [country.name, country.flag || '']);
        return [['Country', 'Flag'], ...rows];
    }

    function getCountryRoutingMap() {
        const countries = window.countryData || [];
        return countries.reduce((acc, country) => {
            acc[country.name] = `/country/${country.slug}`;
            return acc;
        }, {});
    }

    function drawRegionsMap() {
        var data = google.visualization.arrayToDataTable(getCountryData());

        var options = {
            legend: 'none',
            datalessRegionColor: '#ff2d75', // hot pink
            defaultColor: '#ff2d75', // hot pink
            tooltip: { textStyle: { color: '#4b2c3a' } },
            colorAxis: { colors: ['#ff2d75', '#ff2d75'] }, // uniform color
            backgroundColor: '#ffe4ef', // pastel pink
        };

        var chartContainer = document.getElementById('geo-chart');
        var chart = new google.visualization.GeoChart(chartContainer);
        chart.draw(data, options);

        var countryToUrl = getCountryRoutingMap();

        google.visualization.events.addListener(chart, 'regionClick', function (e) {
            // Get the country name from the selection
            var selection = chart.getSelection();
            var label = null;
            if (selection && selection.length > 0) {
                var item = selection[0];
                if (item.row != null) {
                    label = data.getValue(item.row, 0);
                }
            }

            // Navigate to the country's page
            var url = countryToUrl[label] || null;
            if (url) {
                window.location.href = url;
            }
        });

        // Support select event for keyboard navigation/accessibility
        google.visualization.events.addListener(chart, 'select', function () {
            var selection = chart.getSelection();
            if (!selection || selection.length === 0) return;
            var item = selection[0];
            if (item.row == null) return;
            var label = data.getValue(item.row, 0);
            var url = getCountryRoutingMap()[label];
            if (url) {
                window.location.href = url;
            }
        });

        // Redraw on resize for responsiveness
        window.addEventListener('resize', function () {
            chart.draw(data, options);
        });
    }
})();

// Initialize Leaflet map
const map = L.map("map").setView([51.505, -0.09], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

// Load GeoJSON data for catchment boundary (replace with your own GeoJSON)
fetch("path_to_your_geojson_file.geojson")
  .then((response) => response.json())
  .then((data) => {
    L.geoJSON(data, {
      style: function (feature) {
        return { color: "blue" };
      },
    }).addTo(map);
  });

// Variables to store user inputs
let rainfall = 10; // mm/hr
let curveNumber = 70;

// Update UI elements for rainfall and curve number
document.getElementById("rainfall").addEventListener("input", function () {
  rainfall = this.value;
  document.getElementById("rainfallValue").textContent = rainfall;
});
document.getElementById("curveNumber").addEventListener("input", function () {
  curveNumber = this.value;
  document.getElementById("cnValue").textContent = curveNumber;
});

// Simplified SCS Curve Number method for runoff calculation
function calculateRunoff(rainfall, curveNumber) {
  const S = 1000 / curveNumber - 10; // S is the maximum potential retention
  const Q = Math.pow(rainfall - 0.2 * S, 2) / (rainfall + 0.8 * S); // Runoff equation
  return rainfall > 0.2 * S ? Q : 0;
}

// Green-Ampt Infiltration model
function greenAmptInfiltration(rainfall, psi, fm, theta, deltaTheta, time) {
  let cumulativeInfiltration = 0;
  let infiltrationRate = 0;

  for (let t = 1; t <= time; t++) {
    cumulativeInfiltration +=
      psi *
      fm *
      (1 + (theta / deltaTheta) * Math.log(1 + theta / cumulativeInfiltration));
    infiltrationRate =
      fm * (1 + (psi * deltaTheta) / (cumulativeInfiltration + 1e-5)); // Prevent division by zero
  }
  return infiltrationRate;
}

// Muskingum-Cunge river routing method
function muskingumCungeRouting(inflow, outflow, k, x) {
  let c0 = (1 - x) / (k + 1);
  let c1 = x / (k + 1);
  let c2 = 1 - c0 - c1;

  for (let t = 0; t < inflow.length; t++) {
    outflow[t + 1] = c0 * inflow[t + 1] + c1 * inflow[t] + c2 * outflow[t];
  }

  return outflow;
}

// Fetch real-time rainfall data from OpenWeatherMap API
function fetchRainfallData(city) {
  fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=YOUR_API_KEY`
  )
    .then((response) => response.json())
    .then((data) => {
      let rainfall = data.rain ? data.rain["1h"] : 0;
      console.log("Real-time Rainfall:", rainfall);
    });
}

// Penman-Monteith equation for ET calculation
function penmanMonteith(radiation, windSpeed, temp, vaporPressure, pressure) {
  let delta =
    (4098 * (0.6108 * Math.exp((17.27 * temp) / (temp + 237.3)))) /
    Math.pow(temp + 237.3, 2);
  let gamma = 0.665e-3 * pressure;
  let netRadiation = radiation - 0.1; // Simplified
  let et =
    (0.408 * delta * netRadiation +
      gamma *
        (900 / (temp + 273)) *
        windSpeed *
        (vaporPressure.sat - vaporPressure.act)) /
    (delta + gamma * (1 + 0.34 * windSpeed));

  return et;
}

// Run model calculations when the user clicks the "Run Model" button
document.getElementById("runModel").addEventListener("click", function () {
  const runoffData = [];
  let soilMoisture = 50; // Initial soil moisture level

  // Simulate over 6 time steps
  for (let i = 0; i < 6; i++) {
    const runoff = calculateRunoff(rainfall, curveNumber);
    const infiltration = greenAmptInfiltration(
      rainfall,
      0.5,
      0.1,
      0.2,
      0.4,
      i + 1
    );
    runoffData.push(runoff - infiltration); // Subtract infiltration from runoff
  }

  updateChart(runoffData);
});

// Update chart with runoff data using Chart.js
function updateChart(runoffData) {
  const ctx = document.getElementById("chart").getContext("2d");
  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["0", "1", "2", "3", "4", "5"],
      datasets: [
        {
          label: "Runoff (mm)",
          data: runoffData,
          borderColor: "rgba(75, 192, 192, 1)",
          fill: false,
        },
      ],
    },
    options: {
      scales: {
        x: { display: true, title: { display: true, text: "Time (hours)" } },
        y: { display: true, title: { display: true, text: "Runoff (mm)" } },
      },
    },
  });
}

//Explanation of Code Components
// GIS Layers:

// Leaflet is used to load and display a GeoJSON file that represents the catchment area boundary. You can replace the GeoJSON with your specific data.
// The fetch function is used to load GeoJSON files, which can then be visualized on the map as polygons.
// Advanced Infiltration:

// The Green-Ampt infiltration model is used to calculate the infiltration rate over time. It accounts for soil characteristics and changes in infiltration rate based on cumulative infiltration.
// River Routing:

// The Muskingum-Cunge river routing method is used to simulate how water flows downstream, with coefficients
// 𝑐
// 0
// c
// 0
// ​
//  ,
// 𝑐
// 1
// c
// 1
// ​
//  , and
// 𝑐
// 2
// c
// 2
// ​
//   controlling the flow distribution between inflow and outflow.
// Climate Data Integration:

// OpenWeatherMap API is used to fetch real-time rainfall data. This can be integrated into the model to dynamically adjust the runoff based on actual conditions.
// The Penman-Monteith equation is used to calculate evapotranspiration (ET). This calculation accounts for solar radiation, temperature, wind speed, and vapor pressure.
// Runoff and Visualization:

// SCS Curve Number method is used to calculate runoff from rainfall data. This is then adjusted with infiltration using the Green-Ampt model.
// The Chart.js library is used to visualize the runoff results dynamically in a chart.
// How to Run This Project
// Replace the placeholder path_to_your_geojson_file.geojson with the actual path to your GeoJSON file.
// Get an API key from OpenWeatherMap and replace YOUR_API_KEY in the fetchRainfallData() function.
// Open the HTML file in a web browser to see the hydrological model in action. You can adjust the rainfall and curve number using sliders, and click "Run Model" to visualize the results.
// This is a comprehensive example that integrates several advanced hydrological modeling techniques into a web-based application. Let me know if you need further adjustments or explanations!

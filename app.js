// Function to save the API key to local storage
function saveAPIKey() {
  const apiKeyInput = document.getElementById("api-key");
  const apiKey = apiKeyInput.value;

  if (apiKey) {
    localStorage.setItem("api-key", apiKey);
    apiKeyInput.value = ""; // Clear the input field
    loadAPIKey();
  }
}

// Function to load the API key from local storage and display it
function loadAPIKey() {
  const apiKeyInput = document.getElementById("api-key");
  const savedAPIKey = localStorage.getItem("api-key");

  if (savedAPIKey) {
    apiKeyInput.value = savedAPIKey; // Display the saved key in the input box
  }
}

// Function to clear the form and stored data
function clearFormAndData() {
  const apiKeyInput = document.getElementById("api-key");

  apiKeyInput.value = ""; // Clear the input field
  localStorage.removeItem("api-key"); // Remove the API key from local storage
}

// promise-based wrapper around fetch that adds the "x-api-key: API_KEY" header
function fetchWithAPIKey(url) {
  // ughhhh this stupid cors stuff is breaking when i try to pass api_key killme
  return fetch(url);

  const apiKey = localStorage.getItem("api-key");

  if (!apiKey) {
    return fetch(url);
  }
  const finalUrl = url + (url.includes("?") ? "&" : "?") + `api_key=${apiKey}`;
  console.log(finalUrl);
  return fetch(finalUrl);
}

// Function to display the last refreshed time
function displayRefreshTime() {
  const refreshTimestamp = document.getElementById("refresh-timestamp");
  const now = new Date();
  refreshTimestamp.textContent = now.toLocaleString();
}
// Function to fetch route long names from the API
function fetchRouteLongNames() {
  fetchWithAPIKey(
    "https://api-v3.mbta.com/routes?filter%5Btype%5D=2&fields%5Broute%5D=long_name"
  )
    .then((response) => response.json())
    .then((data) => {
      const dataList = document.getElementById("dataList");
      data.data.forEach((route) => {
        const longName = route.attributes.long_name;
        const stopId = route.id;
        const listItem = document.createElement("li");
        const link = document.createElement("a");
        link.textContent = longName;
        link.href = `?route_id=${encodeURIComponent(stopId)}`;
        listItem.appendChild(link);
        dataList.appendChild(listItem);
      });
    })
    .then(() => {
      document.getElementById("dataList").style.display = "block";
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
}

// Function to parse URL parameters
function getURLParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    route_id: params.get("route_id"),
    stop_id: params.get("stop_id"),
    direction: params.get("direction"),
  };
}

// Function to fetch route stop names from a route ID
function fetchRouteStopNames(routeId) {
  fetchWithAPIKey(
    `https://api-v3.mbta.com/stops?filter%5Broute%5D=${encodeURIComponent(
      routeId
    )}&fields%5Bstop%5D=name`
  )
    .then((response) => response.json())
    .then((data) => {
      const dataList = document.getElementById("dataList");
      data.data.forEach((stop) => {
        const stopName = stop.attributes.name;
        const stopId = stop.id;
        const listItem = document.createElement("li");
        const link = document.createElement("a");
        link.textContent = stopName;
        link.href = `?route_id=${encodeURIComponent(
          routeId
        )}&stop_id=${encodeURIComponent(stopId)}`;
        listItem.appendChild(link);
        dataList.appendChild(listItem);
      });
    })
    .then(() => {
      document.getElementById("dataList").style.display = "block";
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
  document.getElementById("dataList").style.display = "block";
}

function getTrainFromSchedule(schedule, trainColumn) {
  const tripId = schedule.relationships.trip.data.id;
  const fetchUrl = `https://api-v3.mbta.com/trips/${encodeURIComponent(
    tripId
  )}`;
  fetchWithAPIKey(fetchUrl)
    .then((response) => response.json())
    .then((data) => {
      trainColumn.textContent = data.data.attributes.name;
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
      trainColumn.textContent = "Unknown";
    });
}

function getPredictionFromStop(schedule, stopId, predictedTime) {
  // the API is:
  // /predictions?filter[trip]=TRIP_ID&filter[stop]=STOP_ID
  const tripId = schedule.relationships.trip.data.id;
  const fetchUrl = `https://api-v3.mbta.com/predictions?filter%5Btrip%5D=${encodeURIComponent(
    tripId
  )}&filter%5Bstop%5D=${encodeURIComponent(stopId)}`;
  fetchWithAPIKey(fetchUrl)
    .then((response) => response.json())
    .then((data) => {
      const prediction = data.data[0];
      if (!prediction) {
        throw new Error("No prediction found");
      }
      const predictedTimeDate = new Date(
        prediction.attributes.arrival_time ||
          prediction.attributes.departure_time
      );
      predictedTime.textContent = predictedTimeDate.toLocaleTimeString();
    })
    .catch((error) => {
      console.warn("Error fetching data:", error);
      predictedTime.textContent = "Unknown";
    });
}

function createStopRow(stop, stopId, scheduleBody) {
  console.log(stop);
  // create a row: columns are Arrival Time,Departure Time,Train #,Track #,Status
  const tableRow = document.createElement("tr");
  const predictedTime = document.createElement("td");
  const scheduledTime = document.createElement("td");
  const trainColumn = document.createElement("td");
  const trackColumn = document.createElement("td");
  const statusColumn = document.createElement("td");

  const predictedTimeDate = new Date(
    stop.attributes.arrival_time || stop.attributes.departure_time
  );

  getPredictionFromStop(stop, stopId, predictedTime);
  scheduledTime.textContent = predictedTimeDate.toLocaleTimeString();
  getTrainFromSchedule(stop, trainColumn);
  trackColumn.textContent = stop.attributes.platform_name;
  statusColumn.textContent = stop.attributes.status;

  predictedTime.style.border = "1px solid black";
  scheduledTime.style.border = "1px solid black";
  trainColumn.style.border = "1px solid black";
  trackColumn.style.border = "1px solid black";
  statusColumn.style.border = "1px solid black";

  tableRow.appendChild(predictedTime);
  tableRow.appendChild(scheduledTime);
  tableRow.appendChild(trainColumn);
  tableRow.appendChild(trackColumn);
  tableRow.appendChild(statusColumn);

  tableRow.style.border = "1px solid black";

  scheduleBody.appendChild(tableRow);
}

// Show stops for route + stop + direction (optional)
function showStopsAndDirection(routeId, stopId, direction) {
  const directionId = direction ? direction : 0;
  const outboundLink = document.getElementById("outboundLink");
  const inboundLink = document.getElementById("inboundLink");
  outboundLink.href = `?route_id=${encodeURIComponent(
    routeId
  )}&stop_id=${encodeURIComponent(stopId)}&direction=0`;
  inboundLink.href = `?route_id=${encodeURIComponent(
    routeId
  )}&stop_id=${encodeURIComponent(stopId)}&direction=1`;

  const caption = document.getElementById("caption");
  caption.textContent = `Predictions for ${routeId} at ${stopId} direction ${
    directionId == 0 ? "Outbound" : "Inbound"
  }`;

  // date in YYYY-MM-DD
  const todayDateIso = new Date().toISOString().split("T")[0];
  // time in HH:MM
  const todayTimeIso = new Date().toTimeString().slice(0, 5);

  // sort by arrival time for inbound, departure time for outbound
  const sortKey = directionId == 0 ? "departure_time" : "arrival_time";

  const fetchUrl = `https://api-v3.mbta.com/schedules?filter%5Broute%5D=${encodeURIComponent(
    routeId
  )}&filter%5Bstop%5D=${encodeURIComponent(
    stopId
  )}&filter%5Bdirection_id%5D=${encodeURIComponent(
    directionId
  )}&filter%5Bmin_time%5D=${encodeURIComponent(
    todayTimeIso
  )}&fields%5Bschedule%5D=direction_id,stop,arrival_time,departure_time&sort=${sortKey}`;

  fetchWithAPIKey(fetchUrl)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      const scheduleBody = document.getElementById("scheduleBody");
      data.data.forEach((stop) => {
        createStopRow(stop, stopId, scheduleBody);
      });
    })
    .then(() => {
      document.getElementById("scheduleTable").style.display = "block";
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
  document.getElementById("dataList").style.display = "block";
}

// Main function to handle URL parameters
function handleURLParams() {
  const params = getURLParams();

  if (!params.route_id) {
    fetchRouteLongNames();
  } else if (params.route_id && !params.stop_id) {
    fetchRouteStopNames(params.route_id);
  } else if (params.route_id && params.stop_id) {
    showStopsAndDirection(params.route_id, params.stop_id, params.direction);
  }
}

//Add event listeners
document.getElementById("save-button").addEventListener("click", saveAPIKey);
document
  .getElementById("clear-button")
  .addEventListener("click", clearFormAndData);
window.addEventListener("load", () => {
  displayRefreshTime(); // Display the refresh time when the page loads
  loadAPIKey(); // Load the API key from local storage
  handleURLParams();
});

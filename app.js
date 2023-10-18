// // Function to save the API key to local storage
// function saveAPIKey() {
//   const apiKeyInput = document.getElementById("api-key");
//   const apiKey = apiKeyInput.value;

//   if (apiKey) {
//     localStorage.setItem("api-key", apiKey);
//     apiKeyInput.value = ""; // Clear the input field
//     loadAPIKey();
//   }
// }

// // Function to load the API key from local storage and display it
// function loadAPIKey() {
//   const apiKeyInput = document.getElementById("api-key");
//   const savedAPIKey = localStorage.getItem("api-key");

//   if (savedAPIKey) {
//     apiKeyInput.value = savedAPIKey; // Display the saved key in the input box
//   }
// }

// // Function to clear the form and stored data
// function clearFormAndData() {
//   const apiKeyInput = document.getElementById("api-key");

//   apiKeyInput.value = ""; // Clear the input field
//   localStorage.removeItem("api-key"); // Remove the API key from local storage
// }

// Function to display the last refreshed time
function displayRefreshTime() {
  const refreshTimestamp = document.getElementById("refresh-timestamp");
  const now = new Date();
  refreshTimestamp.textContent = now.toLocaleString();
}
// Function to fetch route long names from the API
function fetchRouteLongNames() {
  fetch(
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
  fetch(
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

  fetch(
    `https://api-v3.mbta.com/predictions?filter%5Broute%5D=${encodeURIComponent(
      routeId
    )}&filter%5Bstop%5D=${encodeURIComponent(
      stopId
    )}&filter%5Bdirection_id%5D=${encodeURIComponent(
      directionId
    )}&fields%5Bschedule%5D=direction_id,stop_sequence,arrival_time`
  )
    .then((response) => response.json())
    .then((data) => {
      const scheduleBody = document.getElementById("scheduleBody");
      data.data.forEach((stop) => {
        console.log(stop);
        const stopName = stop.attributes.name;
        const stopId = stop.id;
        // create a row: columns are Arrival Time,Departure Time,Train #,Track #,Status
        const tableRow = document.createElement("tr");
        const predictedTime = document.createElement("td");
        const scheduledTime = document.createElement("td");
        const trainColumn = document.createElement("td");
        const trackColumn = document.createElement("td");
        const statusColumn = document.createElement("td");

        predictedTime.textContent = Date(
          stop.attributes.arrival_time
        ).toLocaleString();
        scheduledTime.textContent = Date(
          stop.attributes.departure_time
        ).toLocaleString();
        trainColumn.textContent = stop.attributes.train_number;
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

// Call the main function to handle URL parameters when the page loads

// Add event listeners
// document.getElementById("save-button").addEventListener("click", saveAPIKey);
// document
//   .getElementById("clear-button")
//   .addEventListener("click", clearFormAndData);
window.addEventListener("load", () => {
  displayRefreshTime(); // Display the refresh time when the page loads
  handleURLParams();
});

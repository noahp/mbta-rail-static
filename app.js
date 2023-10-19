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
function fetchToJsonWithAPIKey(url) {
  // ughhhh this stupid cors stuff is breaking when i try to pass api_key killme
  return fetch(url).then((response) => response.json());

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

function createRouteRow(route) {
  const longName = route.attributes.long_name;
  const listItem = document.createElement("li");
  const link = document.createElement("a");
  link.textContent = longName;
  link.href = `?route_id=${encodeURIComponent(route.id)}`;
  listItem.appendChild(link);

  return listItem;
}

// Function to fetch route long names from the API
function showRouteLongNames() {
  fetchToJsonWithAPIKey(
    "https://api-v3.mbta.com/routes?filter%5Btype%5D=2&fields%5Broute%5D=long_name"
  )
    .then((data) => {
      const dataList = document.getElementById("dataList");
      data.data.forEach((route) => {
        dataList.appendChild(createRouteRow(route));
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

function createRouteStopRow(stop, stopId, routeId) {
  const stopName = stop.attributes.name;
  const listItem = document.createElement("li");
  const link = document.createElement("a");
  link.textContent = stopName;
  link.href = `?route_id=${encodeURIComponent(
    routeId
  )}&stop_id=${encodeURIComponent(stopId)}`;
  listItem.appendChild(link);

  return listItem;
}

// Function to fetch route stop names from a route ID
function showRouteStopNames(routeId) {
  fetchToJsonWithAPIKey(
    `https://api-v3.mbta.com/stops?filter%5Broute%5D=${encodeURIComponent(
      routeId
    )}&fields%5Bstop%5D=name`
  )
    .then((data) => {
      const dataList = document.getElementById("dataList");
      data.data.forEach((stop) => {
        dataList.appendChild(createRouteStopRow(stop, stop.id, routeId));
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

function getPredictionFromStop(schedule, stopId, predictedTime) {
  // the API is:
  // /predictions?filter[trip]=TRIP_ID&filter[stop]=STOP_ID
  const tripId = schedule.relationships.trip.data.id;
  // find the prediction with the same trip_id and stop_id
  console.log("looking for trip", tripId, "with stop", stopId);
  console.log("from", predictedTime.data);
  const prediction = predictedTime.data.find(
    (prediction) =>
      prediction.relationships.trip.data.id == tripId &&
      // remove leading "place-" substring from stopId
      prediction.relationships.stop.data.id.includes(stopId.slice(6))
  );
  if (prediction) {
    console.log("found prediction", prediction);
    const predictedTimeDate = new Date(
      prediction.attributes.arrival_time || prediction.attributes.departure_time
    );
    return [
      predictedTimeDate.toLocaleTimeString(),
      prediction.attributes.status,
      prediction.relationships.stop.data.id,
    ];
  } else {
    return ["", "", null];
  }
}

function getTrainFromSchedule(scheduledStop, tripData) {
  // from the scheduledStop, get the related trip ID, then look up the trip name
  const tripId = scheduledStop.relationships.trip.data.id;
  // console.log("looking for trip", tripId);
  // console.log("in data", tripData.data);
  const trip = tripData.data.find((trip) => trip.id == tripId);

  return trip.attributes.name || "";
}

function createStopRow(
  scheduledStop,
  stopId,
  predictionData,
  tripData,
  stopData,
  scheduleBody
) {
  // console.log(scheduledStop);

  // create a row: columns are Predicted Time,Scheduled Time,Train #,Track #,Status
  const tableRow = document.createElement("tr");
  const predictedTime = document.createElement("td");
  const scheduledTime = document.createElement("td");
  const trainColumn = document.createElement("td");
  const trackColumn = document.createElement("td");
  const statusColumn = document.createElement("td");

  const scheduledTimeDate = new Date(
    scheduledStop.attributes.arrival_time ||
      scheduledStop.attributes.departure_time
  );

  // arrival/departure time, status, and stop info (station) come from the
  // prediction data
  var stopInfoId = null;
  [predictedTime.textContent, statusColumn.textContent, stopInfoId] =
    getPredictionFromStop(scheduledStop, stopId, predictionData);
  scheduledTime.textContent = scheduledTimeDate.toLocaleTimeString();
  trainColumn.textContent = getTrainFromSchedule(scheduledStop, tripData);

  // TODO unfortunately need to collect all of these, then request them all
  // explicitly as /stops?filter[id]=id1,id2,id3,... . the generic /stops fetch seems
  // to only have "parent station" entries, like "place-WML-0340", and not the
  // "prediction-stop" ids like "NEC-2287-10"
  if (stopInfoId) {
    console.log("looking for stop", stopInfoId, "in data", stopData);
    trackColumn.textContent = "";
  }

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

// time in HH:MM
const todayTimeIso = new Date().toTimeString().slice(0, 5);

function getScheduleFromStop(stopId, routeId, directionId) {
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

  // wait for the fetch to complete
  return fetchToJsonWithAPIKey(fetchUrl);
}

function getPredictionsForRouteAndDirection(routeId, directionId) {
  const fetchUrl = `https://api-v3.mbta.com/predictions?filter%5Broute%5D=${encodeURIComponent(
    routeId
  )}&filter%5Bdirection_id%5D=${encodeURIComponent(directionId)}`;
  return fetchToJsonWithAPIKey(fetchUrl);
}

function getTripsForRouteAndDirection(routeId, directionId) {
  // set page[limit]=1000 to get all trips?
  const fetchUrl = `https://api-v3.mbta.com/trips?filter%5Broute%5D=${encodeURIComponent(
    routeId
  )}&filter%5Bdirection_id%5D=${encodeURIComponent(
    directionId
  )}&page%5Blimit%5D=1000`;
  return fetchToJsonWithAPIKey(fetchUrl);
}

function getStopsForRouteAndDirection(routeId, directionId) {
  const fetchUrl = `https://api-v3.mbta.com/stops?filter%5Broute%5D=${encodeURIComponent(
    routeId
  )}&filter%5Bdirection_id%5D=${encodeURIComponent(
    directionId
  )}&fields%5Bstop%5D=name,platform_name,platform_code`;
  return fetchToJsonWithAPIKey(fetchUrl);
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

  // 1. get all scheduled stops for this route + stop + direction
  getScheduleFromStop(stopId, routeId, directionId)
    .then((scheduleData) => {
      // console.log(scheduleData);

      // 2. get all predictions for the route + direction
      getPredictionsForRouteAndDirection(routeId, directionId).then(
        (predictionData) => {
          // console.log(predictionData);

          // 3. get all trips for the route + direction
          getTripsForRouteAndDirection(routeId, directionId).then(
            (tripData) => {
              // console.log(tripData);

              // 4. get all stops for the route + direction
              getStopsForRouteAndDirection(routeId, directionId).then(
                (stopData) => {
                  console.log(stopData);

                  const scheduleBody = document.getElementById("scheduleBody");
                  scheduleData.data.forEach((scheduledStop) => {
                    createStopRow(
                      scheduledStop,
                      stopId,
                      predictionData,
                      tripData,
                      stopData,
                      scheduleBody
                    );
                  });
                }
              );
            }
          );
        }
      );
    })
    .then(() => {
      document.getElementById("scheduleTable").style.display = "block";
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });

  // now set the element visible
  document.getElementById("dataList").style.display = "block";
}

// Main function to handle URL parameters
function handleURLParams() {
  const params = getURLParams();

  if (!params.route_id) {
    showRouteLongNames();
  } else if (params.route_id && !params.stop_id) {
    showRouteStopNames(params.route_id);
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

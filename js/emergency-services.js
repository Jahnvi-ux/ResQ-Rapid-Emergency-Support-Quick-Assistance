/* ============================================================
   RESQ — Emergency Services Page Script
   Live hospitals/police/fire/relief-camp data via OpenStreetMap/
   Overpass (through the shared fetchOverpass() helper in common.js,
   which falls back across mirrors instead of failing on one 504).
   ============================================================ */
let serviceMap;
let currentLat;
let currentLon;
let serviceMarkers = [];
let serviceLayer = [];
let routeLayer;
const hospitalIcon = new L.Icon({

    iconUrl:"https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",

    shadowUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

    iconSize:[25,41],

    iconAnchor:[12,41]

});

const policeIcon = new L.Icon({

    iconUrl:"https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",

    shadowUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

    iconSize:[25,41],

    iconAnchor:[12,41]

});

const fireIcon = new L.Icon({

    iconUrl:"https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",

    shadowUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

    iconSize:[25,41],

    iconAnchor:[12,41]

});

const shelterIcon = new L.Icon({

    iconUrl:"https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",

    shadowUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

    iconSize:[25,41],

    iconAnchor:[12,41]

});
function loadMap(lat, lon){

    serviceMap = L.map("serviceMap").setView([lat, lon], 15);

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution: "© OpenStreetMap"
        }
    ).addTo(serviceMap);

    L.marker([lat, lon])
        .addTo(serviceMap)
        .bindPopup("📍 You are here")
        .openPopup();

}

async function loadNearbyServices(lat, lon){

const query = `
[out:json][timeout:25];
(
node["amenity"="hospital"](around:15000,${lat},${lon});
node["amenity"="police"](around:15000,${lat},${lon});
node["amenity"="fire_station"](around:15000,${lat},${lon});
node["amenity"="shelter"](around:15000,${lat},${lon});
node["amenity"="community_centre"](around:15000,${lat},${lon});
node["amenity"="townhall"](around:15000,${lat},${lon});
);
out;
`;

try{

const data = await fetchOverpass(query);

console.log("Emergency Services :", data.elements.length);
console.log(data.elements);

document.getElementById("nearbyServiceCards").innerHTML = "";

if (data.elements.length === 0) {
    document.getElementById("nearbyServiceCards").innerHTML =
        `<div class="card"><p>No emergency services found nearby via OpenStreetMap data.</p></div>`;
    return;
}

data.elements.forEach(place => {

    console.log(place.tags.amenity, place.tags.name);

    let markerIcon;
    let emoji = "";

    if(place.tags.amenity === "hospital"){

        markerIcon = hospitalIcon;
        emoji = "🏥";

    }

    else if(place.tags.amenity === "police"){

        markerIcon = policeIcon;
        emoji = "👮";

    }

    else if(place.tags.amenity === "fire_station"){

        markerIcon = fireIcon;
        emoji = "🚒";

    }

    else{

        markerIcon = shelterIcon;
        emoji = "🏠";

    }



    const marker = L.marker(
        [place.lat, place.lon],
        { icon: markerIcon }
    ).addTo(serviceMap);
    serviceMarkers.push({

    marker: marker,

    name: (place.tags.name || "").toLowerCase(),

    area: (
        place.tags["addr:suburb"] ||
        place.tags["addr:city"] ||
        place.tags["addr:district"] ||
        ""
    ).toLowerCase(),

    data: place

});

    serviceLayer.push(marker);

    marker.bindPopup(`
<b>${place.tags.name || "Emergency Service"}</b>

<br><br>

${place.tags.amenity}

<br><br>

<button onclick="getDirections(${place.lat},${place.lon})">
🧭 Get Directions
</button>
`);
const card = document.createElement("div");

card.className = "card place-card";

card.innerHTML = `
<div class="place-info">

<span class="place-icon">${emoji}</span>

<div>
<h4>${place.tags.name || "Emergency Service"}</h4>
<p>${place.tags.amenity}</p>
</div>

</div>

<div class="place-actions">
<button
class="icon-btn-outline"
onclick="getDirections(${place.lat},${place.lon})">
🧭
</button>
</div>
`;

document
    .getElementById("nearbyServiceCards")
    .appendChild(card);
});

}
catch(error){

console.log(error);
document.getElementById("nearbyServiceCards").innerHTML =
    `<div class="card"><p>Couldn't load nearby emergency services right now &mdash; the map data service may be busy. Please try again in a moment.</p></div>`;
if (typeof api !== "undefined" && api.showToast) {
    api.showToast("Couldn't load nearby emergency services. Please try again.", "error");
}

}

}
function searchService() {

    const input = document
        .getElementById("searchInput")
        .value
        .trim()
        .toLowerCase();

    if(input===""){
        alert("Please enter a service name.");
        return;
    }

    const result = serviceMarkers.find(item =>

        item.name.includes(input) ||

        item.area.includes(input)

    );

    if(!result){
        alert("Service not found.");
        return;
    }

    serviceMap.setView(
        result.marker.getLatLng(),
        17
    );

    result.marker.openPopup();

}
async function getDirections(destLat, destLon){

    if(routeLayer){
        serviceMap.removeLayer(routeLayer);
    }

    const url =
`https://router.project-osrm.org/route/v1/driving/${currentLon},${currentLat};${destLon},${destLat}?overview=full&geometries=geojson`;

    try{

        const response = await fetch(url);
        const data = await response.json();

        if(!data.routes || data.routes.length===0){
            alert("No route found.");
            return;
        }

        const route = data.routes[0];

        routeLayer = L.geoJSON(route.geometry,{
            style:{
                color:"blue",
                weight:5
            }
        }).addTo(serviceMap);

        serviceMap.fitBounds(routeLayer.getBounds());

        const distance =
        (route.distance/1000).toFixed(2);

        const time =
        Math.round(route.duration/60);

        alert(
`Distance : ${distance} km

Estimated Time : ${time} min`
        );

    }

    catch(error){

        console.log(error);
        if (typeof api !== "undefined" && api.showToast) {
            api.showToast("Couldn't calculate directions right now.", "warning");
        }

    }

}
document.addEventListener("DOMContentLoaded", () => {
  initAppShell("services", "Emergency Services");
  getCurrentLocation(function(location){

    currentLat = location.latitude;
    currentLon = location.longitude;

    loadMap(currentLat, currentLon);
    loadNearbyServices(currentLat, currentLon);

});


  

  document.getElementById("searchIcon").innerHTML = icon("search", 16);
document.getElementById("locIcon").innerHTML = icon("location", 16);

  document
.getElementById("currentLocationBtn")
.addEventListener("click", function () {

    getCurrentLocation(function(location){

        currentLat = location.latitude;
        currentLon = location.longitude;

        serviceMap.setView(
            [currentLat, currentLon],
            15
        );

        // Remove old service markers
        serviceLayer.forEach(marker => {
            serviceMap.removeLayer(marker);
        });

        serviceLayer = [];

        // Remove old dynamic cards
        document.getElementById("nearbyServiceCards").innerHTML = "";

        // Remove old route
        if(routeLayer){
            serviceMap.removeLayer(routeLayer);
        }

        // Load new nearby services
        loadNearbyServices(currentLat, currentLon);

    });

});
document
.getElementById("searchBtn")
.addEventListener("click", searchService);
});


const geocoder = new MapboxGeocoder({
    accessToken: mapBoxToken, // Passed from new.ejs
    types: 'place',
    placeholder: 'Enter a city or place...',
    mapboxgl: mapboxgl
});

// Generates another div with .mapboxgl-ctrl-geocoder
document.getElementById('geocoder-container').appendChild(geocoder.onAdd());

let locationSelected = false;
const geocoderInput = document.querySelector(".mapboxgl-ctrl-geocoder input");

if (geocoderInput) {
    geocoderInput.value = draftLocation;
    document.getElementById('location').value = draftLocation;
    document.getElementById('geometry').value = JSON.stringify(draftGeometry);
    locationSelected = true;
}

document.addEventListener("click", function (event) {
    if (event.target === geocoderInput) {
        geocoder.query(geocoderInput.value); // Trigger Mapbox autofill
    }
}, { once: true });

geocoderInput.addEventListener("input", function () {
    locationSelected = false;
});

// Listens for any autofill and retrieve autofilled place name and coordinates
geocoder.on('result', function(e) {
    document.getElementById('location').value = e.result.place_name;
    document.getElementById('geometry').value = JSON.stringify(e.result.geometry.coordinates);
    locationSelected = true;
});

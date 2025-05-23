mapboxgl.accessToken = mapboxToken;

const map = new mapboxgl.Map({
    container: "map", // container ID
    style: "mapbox://styles/mapbox/navigation-night-v1", // style URL
    center: project.geometry.coordinates, // starting position [lng, lat]
    zoom: 10, // starting zoom
});

map.addControl(new mapboxgl.NavigationControl());

new mapboxgl.Marker()
    .setLngLat(project.geometry.coordinates)
    .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<h3>${displayTitle}</h3><p>${project.location}</p>`
        )
    )
    .addTo(map);

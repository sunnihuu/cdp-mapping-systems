console.log("main.js loaded");

var map = new maplibregl.Map({
  container: 'map',
  style: 'style.json',
  center: [-73.97144, 40.70491],
  zoom: 10
});

map.addControl(new maplibregl.NavigationControl());

fetch(
  "https://data.cityofnewyork.us/resource/43nn-pn8j.geojson?cuisine_description=Pizza&$limit=10000"
)
  .then((response) => {
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  })
  .then((data) => {
    console.log('Fetched GeoJSON:', data);
    // Rebuild geometry from properties if missing or invalid
    data.features.forEach((feature) => {
      let valid = feature.geometry && Array.isArray(feature.geometry.coordinates) &&
        !isNaN(feature.geometry.coordinates[0]) && !isNaN(feature.geometry.coordinates[1]);
      if (!valid && feature.properties && feature.properties.longitude && feature.properties.latitude) {
        const lon = Number(feature.properties.longitude);
        const lat = Number(feature.properties.latitude);
        if (!isNaN(lon) && !isNaN(lat)) {
          feature.geometry = {
            type: "Point",
            coordinates: [lon, lat]
          };
        }
      }
    });
    data.features = data.features.filter(f => f.geometry && Array.isArray(f.geometry.coordinates) && !isNaN(f.geometry.coordinates[0]) && !isNaN(f.geometry.coordinates[1]));
    console.log('Valid features after rebuilding:', data.features.length);
    if (data.features.length === 0) {
      alert('No valid pizza restaurant points found in the API response.');
      return;
    }
    map.on('load', () => {
      try {
        map.addSource('restaurants', {
          type: 'geojson',
          data: data
        });
        map.addLayer({
          id: "restaurants-layer",
          type: "circle",
          source: "restaurants",
          paint: {
            "circle-radius": 6,
            "circle-stroke-width": 2,
            "circle-color": "#ff7800",
            "circle-stroke-color": "white"
          }
        });
        map.on("click", "restaurants-layer", (e) => {
          const coordinates = e.features[0].geometry.coordinates.slice();
          const description = e.features[0].properties.dba;
          new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(description)
            .addTo(map);
        });
      } catch (err) {
        console.error("Error adding source/layer:", err);
      }
    });
  })
  .catch((error) => console.error("Error fetching data:", error));
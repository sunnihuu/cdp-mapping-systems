var map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json', // Replace with 'style.json' for your custom style
  center: [-73.97144, 40.70491],
  zoom: 10
});

map.addControl(new maplibregl.NavigationControl());

// Fetch pizza restaurant data from the NYC Open Data API
fetch(
  "https://data.cityofnewyork.us/resource/43nn-pn8j.geojson?cuisine_description=Pizza&$limit=10000"
)
  .then((response) => response.json())
  .then((data) => {
    // Reshape features to ensure geometry is in correct format
    data.features.forEach((feature) => {
      feature.geometry = {
        type: "Point",
        coordinates: [
          Number(feature.properties.longitude),
          Number(feature.properties.latitude),
        ],
      };
    });
    map.on('load', () => {
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
    });
  })
  .catch((error) => console.error("Error fetching data:", error));



// --- Supabase setup ---
// Get your values from Supabase > Project Settings > API
const { createClient } = window.supabase;
const supabaseUrl = 'https://sxjdqiattxtuxhnvlhfa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4amRxaWF0dHh0dXhobnZsaGZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1ODQ1NzIsImV4cCI6MjA3MDE2MDU3Mn0.5QmYINSoVmzcOn5ksI8BsBFiaYay-H7q8JoawwMQpvI';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

console.log("main.js loaded");


var map = new maplibregl.Map({
  container: 'map',
  style: 'style.json',
  center: [-73.97144, 40.70491],
  zoom: 10
});


map.addControl(new maplibregl.NavigationControl());


// --- Supabase Query Functions ---

// Fetch a sample of inspection data for debugging
async function querySupabase() {
  try {
    const { data, error } = await supabaseClient
      .from("open-restaurant-inspections")
      .select("*")
      .limit(100);
    if (error) throw error;
    console.log("Data fetched successfully:", data);
  } catch (err) {
    console.error("Error fetching data from Supabase:", err.message || err);
  }
}


// Query for inspections within a distance of a point
async function queryWithinDistance(point, n = 1000) {
  try {
    const { data, error } = await supabaseClient.rpc(
      "find_nearest_n_restaurants",
      {
        lat: point[1],
        lon: point[0],
        n: n,
      }
    );
    if (error) throw error;
    console.log("Nearest points fetched successfully:", data);
    addInspectionLayer(data);
  } catch (err) {
    console.error("Error fetching nearest points from Supabase:", err.message || err);
  }
}


// Convert Supabase data to GeoJSON FeatureCollection
function inspectionsToGeoJSON(data) {
  return {
    type: "FeatureCollection",
    features: (data || []).map(row => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [row.long, row.lat]
      },
      properties: row
    }))
  };
}


// Add or update inspection points layer on the map
function addInspectionLayer(data) {
  const geojson = inspectionsToGeoJSON(data);
  if (map.getSource('inspections')) {
    map.getSource('inspections').setData(geojson);
  } else {
    map.addSource('inspections', {
      type: 'geojson',
      data: geojson
    });
    map.addLayer({
      id: "inspections-layer",
      type: "circle",
      source: "inspections",
      paint: {
        "circle-radius": 6,
        "circle-stroke-width": 2,
        "circle-color": [
          "match",
          ["get", "seating_choice"],
          "Outdoor", "#1aaf54",
          "Indoor", "#3b6ed6",
          /* other */ "#ff7800"
        ],
        "circle-stroke-color": "white"
      }
    });
    map.on("click", "inspections-layer", (e) => {
      const props = e.features[0].properties;
      const coordinates = e.features[0].geometry.coordinates.slice();
      const html = `
        <strong>${props.name || props.RestaurantName || 'Restaurant'}</strong><br/>
        Seating: ${props.seating_choice || props.SeatingChoice || 'N/A'}<br/>
        Distance: ${props.dist_meters ? Number(props.dist_meters).toFixed(0) + ' m' : ''}
      `;
      new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(html)
        .addTo(map);
    });
  }
}

map.on('load', () => {
  // Listen for map clicks to query nearby inspections
  map.on("click", (e) => {
    const point = [e.lngLat.lng, e.lngLat.lat];
    queryWithinDistance(point, 1000);
  });
});

// Optionally, fetch some data on load for debugging
document.addEventListener("DOMContentLoaded", () => {
  querySupabase();
});
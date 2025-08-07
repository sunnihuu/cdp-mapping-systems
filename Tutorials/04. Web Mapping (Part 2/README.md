# 03. Making a web map with Maplibre

This folder contains a simple web mapping example using Maplibre GL JS and NYC Open Data.

## Files
- `index.html`: Main HTML file, loads Maplibre, CSS, and JS.
- `main.js`: JavaScript to create the map, add restaurant data, and enable popups.
- `style.css`: Basic page and map styling.

## How to use
1. Open `index.html` with Live Server in VS Code.
2. The map will show a MapTiler basemap and pizza restaurant points from NYC Open Data.
3. Click a point to see the restaurant name.

## Customization
- To use your own MapTiler key, replace the `key=...` in the style URL in `main.js`.
- You can further style the map or add more data in `main.js`.

## Credits
- [Maplibre GL JS](https://maplibre.org/)
- [NYC Open Data](https://data.cityofnewyork.us/)
- [MapTiler](https://www.maptiler.com/) for basemap tiles.

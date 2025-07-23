import pandas as pd
import geopandas as gpd
from shapely import wkt
import matplotlib.pyplot as plt

# --- Load Data ---
ped_df = pd.read_csv("Data/Bi-Annual_Pedestrian_Counts_20250709.csv")
temp_df = pd.read_csv("Data/Hyperlocal_Temperature_Monitoring_20250709.csv")
mappluto_gdf = gpd.read_file("Data/nyc_mappluto_25v2_shp")


# --- Helper Functions ---
def find_summer_pm_columns(df):
    all_columns = df.columns.tolist()
    summer_pm_columns = []
    for col in all_columns:
        col_lower = col.lower()
        if any(month in col_lower for month in ["july", "august", "summer"]):
            if any(
                pm_ind in col_lower for pm_ind in ["pm", "afternoon", "evening", "late"]
            ):
                summer_pm_columns.append(col)
    if not summer_pm_columns:
        pm_columns = [
            col
            for col in all_columns
            if "pm" in col.lower()
            or "afternoon" in col.lower()
            or "evening" in col.lower()
        ]
        summer_pm_columns = pm_columns
    return summer_pm_columns


def calculate_summer_pm_counts(df, summer_pm_columns):
    if summer_pm_columns:
        numeric_cols = []
        for col in summer_pm_columns:
            try:
                pd.to_numeric(df[col], errors="coerce")
                numeric_cols.append(col)
            except:
                continue
        if numeric_cols:
            df["summer_pm_count"] = df[numeric_cols].mean(axis=1)
        else:
            df["summer_pm_count"] = 0
    else:
        df["summer_pm_count"] = 0
    return df


# --- Filter Manhattan ---
manhattan_gdf = mappluto_gdf[mappluto_gdf["Borough"] == "MN"].copy()
manhattan_gdf = manhattan_gdf.to_crs(epsg=4326)

ped_manhattan = ped_df[ped_df["Borough"].str.lower() == "manhattan"].copy()

# --- Pedestrian Data: July-August PM ---
summer_pm_cols = find_summer_pm_columns(ped_manhattan)
ped_manhattan = calculate_summer_pm_counts(ped_manhattan, summer_pm_cols)

# Convert geometry
ped_manhattan["geometry"] = ped_manhattan["the_geom"].apply(wkt.loads)
ped_gdf = gpd.GeoDataFrame(ped_manhattan, geometry="geometry", crs="EPSG:4326")

# --- Temperature Data: July-August, 3-6PM ---
temp_df["Day"] = pd.to_datetime(temp_df["Day"])
temp_df["Hour"] = temp_df["Day"].dt.hour
temp_jul_aug = temp_df[temp_df["Day"].dt.month.isin([7, 8])]
temp_jul_aug_pm = temp_jul_aug[
    (temp_jul_aug["Hour"] >= 15) & (temp_jul_aug["Hour"] <= 18)
]

avg_temp_jul_aug_pm = (
    temp_jul_aug_pm.groupby(["Sensor.ID", "Latitude", "Longitude"])["AirTemp"]
    .mean()
    .reset_index()
)

temp_gdf_jul_aug_pm = gpd.GeoDataFrame(
    avg_temp_jul_aug_pm,
    geometry=gpd.points_from_xy(
        avg_temp_jul_aug_pm.Longitude, avg_temp_jul_aug_pm.Latitude
    ),
    crs="EPSG:4326",
)

# --- Plot ---
fig, ax = plt.subplots(figsize=(12, 12))

# Debug: Check for empty GeoDataFrames
print("manhattan_gdf:", len(manhattan_gdf))
print("temp_gdf_jul_aug_pm:", len(temp_gdf_jul_aug_pm))
print("ped_gdf:", len(ped_gdf))

# Debug: Check for invalid geometries
print("Invalid geometries in manhattan_gdf:", manhattan_gdf.is_valid.value_counts())
print(
    "Invalid geometries in temp_gdf_jul_aug_pm:",
    temp_gdf_jul_aug_pm.is_valid.value_counts(),
)
print("Invalid geometries in ped_gdf:", ped_gdf.is_valid.value_counts())

# Set aspect to auto to avoid aspect error
ax.set_aspect("auto")

# Manhattan boundary
manhattan_gdf.boundary.plot(ax=ax, color="black", linewidth=0.5, alpha=0.5)

# Temperature sensors (colored by avg temp)
temp_gdf_jul_aug_pm.plot(
    ax=ax,
    column="AirTemp",
    cmap="hot",
    markersize=80,
    alpha=0.7,
    legend=True,
    legend_kwds={"label": "Avg Air Temp (°C)"},
)

# Pedestrian counts (sized by summer_pm_count)
ped_gdf.plot(
    ax=ax,
    color="blue",
    markersize=ped_gdf["summer_pm_count"] * 0.5,
    alpha=0.6,
    label="Pedestrian Activity",
)

plt.title(
    "Heat Exposure × Pedestrian Activity\nManhattan, July–August PM (3–6PM)",
    fontsize=16,
)
plt.xlabel("Longitude")
plt.ylabel("Latitude")
plt.legend(
    ["Manhattan Boundary", "Temperature Sensors", "Pedestrian Activity"],
    loc="upper left",
)
plt.grid(False)
plt.tight_layout()
plt.show()

#!/usr/bin/env Rscript
# Export area councils with cyclone intensity as GeoJSON and Shapefile.
# Joins Ex_hazard_areas.csv with council boundaries; councils with no intensity get 0.
# Usage: Rscript scripts/export_intensity_geojson.R [--output-dir path]
# Output: output/area_councils_intensity.geojson, output/area_councils_intensity.shp

library(here)
library(dplyr)
library(tidyr)
library(sf)

args <- commandArgs(trailingOnly = TRUE)
output_dir <- here::here("output")

i <- 1
while (i <= length(args)) {
  if (args[i] == "--output-dir" && i < length(args)) {
    output_dir <- args[i + 1]
    i <- i + 2
  } else {
    i <- i + 1
  }
}

dir.create(output_dir, showWarnings = FALSE, recursive = TRUE)

# Load data
config <- read.csv(here::here("data", "Ex_hazard_areas.csv"))
councils_sf <- st_read(here::here("data", "GIS_layers", "2016_phc_vut_acid_4326.geojson"), quiet = TRUE)

# Prepare intensity data (one row per council)
intensity_data <- config %>%
  filter(!is.na(Area.Council), Area.Council != "") %>%
  select(Area.Council, Intensity) %>%
  distinct(Area.Council, .keep_all = TRUE)

# Join councils with intensity; councils not in config get Intensity = 0
intensity_map_sf <- councils_sf %>%
  left_join(intensity_data, by = c("acname" = "Area.Council")) %>%
  mutate(Intensity = replace_na(Intensity, 0))

# Add hex color for GIS styling (Cat 2–5: amber→orange→red→dark red; 0: grey)
intensity_colors <- c(
  "0" = "#cccccc",
  "2" = "#fbbf24",
  "3" = "#f97316",
  "4" = "#dc2626",
  "5" = "#7f1d1d"
)
intensity_map_sf <- intensity_map_sf %>%
  mutate(intensity_color = intensity_colors[as.character(as.integer(Intensity))])

# Export GeoJSON
geojson_path <- file.path(output_dir, "area_councils_intensity.geojson")
st_write(intensity_map_sf, geojson_path, delete_dsn = TRUE, quiet = TRUE)
message("Exported GeoJSON: ", geojson_path)

# Export Shapefile
shp_path <- file.path(output_dir, "area_councils_intensity.shp")
st_write(intensity_map_sf, shp_path, delete_dsn = TRUE, quiet = TRUE)
message("Exported Shapefile: ", shp_path)

message("Features: ", nrow(intensity_map_sf), " | Councils with intensity 2–5: ",
        sum(intensity_map_sf$Intensity >= 2 & intensity_map_sf$Intensity <= 5, na.rm = TRUE))

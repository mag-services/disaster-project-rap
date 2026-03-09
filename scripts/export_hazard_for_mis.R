#!/usr/bin/env Rscript
# Export Ex_hazard_areas.csv to MIS tabular import format
# Usage: Rscript scripts/export_hazard_for_mis.R [--year YYYY] [--output path]
# Output: data/Ex_hazard_areas_MIS_import.csv

library(here)

args <- commandArgs(trailingOnly = TRUE)
year <- "2025"
output_path <- NULL

i <- 1
while (i <= length(args)) {
  if (args[i] == "--year" && i < length(args)) {
    year <- args[i + 1]
    i <- i + 2
  } else if (args[i] == "--output" && i < length(args)) {
    output_path <- args[i + 1]
    i <- i + 2
  } else {
    i <- i + 1
  }
}

if (is.null(output_path)) {
  output_path <- here::here("data", "Ex_hazard_areas_MIS_import.csv")
}

hazard <- read.csv(here::here("data", "Ex_hazard_areas.csv"))
# Only affected councils (Intensity > 0)
hazard <- hazard[!is.na(hazard$Intensity) & hazard$Intensity > 0, ]

mis <- data.frame(
  Province = hazard$Province,
  Area_Council = hazard$Area.Council,
  Attribute = "Intensity",
  Value = hazard$Intensity,
  Year = year,
  Month = "January",
  Cluster = "Disaster",
  Type = "Estimated Hazard Damage",
  stringsAsFactors = FALSE
)
names(mis)[names(mis) == "Area_Council"] <- "Area Council"

write.csv(mis, output_path, row.names = FALSE)
message("Exported ", nrow(mis), " rows to ", output_path)
message("Import this file in MIS Admin: Tabular Datasets -> Cyclone Intensity -> Import CSV")

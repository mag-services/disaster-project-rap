# Disaster Damage and Response Estimation — Vanuatu

A technical report system for estimating cyclone-induced damage, resource needs, and financial impact across Vanuatu's Area Councils. Built with **Quarto** and **R**, it produces interactive HTML reports with tables, maps, and CSV exports for disaster preparedness and response planning.

---

## Overview

This project generates a comprehensive disaster damage assessment report that:

- **Estimates physical damage** to infrastructure (schools, health facilities, telecom towers, roads, shelter, WASH) based on cyclone intensity per council
- **Calculates immediate response resources** (tents, solar lamps, water, food, crop cuttings) required for affected populations
- **Quantifies financial damage** using configurable unit costs and damage multipliers
- **Aggregates results** from council → province → national level
- **Produces interactive maps** showing damage and resource needs by Area Council

The methodology uses **cyclone intensity (categories 2–5)** assigned per Area Council as the primary driver. Damage is modelled via sector-specific multipliers that vary by intensity and council.

---

## Requirements

### Software

| Requirement | Version | Notes |
|-------------|---------|-------|
| [R](https://www.r-project.org/) | ≥ 4.0 | Required for data processing and rendering |
| [Quarto](https://quarto.org/docs/get-started/) | ≥ 1.0 | Pandoc-based publishing engine for `.qmd` files |

### R Packages

Install from CRAN:

```r
install.packages(c(
  "dplyr",      # Data wrangling
  "tidyr",      # Pivot and reshape
  "reactable",  # Interactive HTML tables
  "htmltools",  # HTML output
  "readxl",     # Excel input (optional)
  "here",       # Project-relative paths
  "sf",         # Spatial data (for maps)
  "leaflet"     # Interactive maps
))
```

---

## Project Structure

```
vanuatu/
├── index.qmd              # Main Quarto report (source)
├── index.html             # Rendered HTML output
├── asset/
│   ├── footer.html        # Report footer
│   ├── style.css          # Custom CSS
│   └── title-block.html   # Title block template
├── data/
│   ├── 1c_input_baseline.csv              # Baseline indicators by council
│   ├── 2a Input- Damage Multiplier.csv    # Damage % by intensity & sector
│   ├── 3aii Input- Resources Sent.csv     # Resource multipliers by council
│   ├── 4a Input- Finance Estimates.csv    # Unit costs for damage valuation
│   ├── Ex_hazard_areas.csv                 # Cyclone intensity per council
│   ├── council_province_lookup.csv         # Council–Province mapping
│   └── GIS_layers/
│       └── 2016_phc_vut_acid_4326.geojson # Area Council boundaries
├── output/                # Exported CSV tables
├── index_files/           # Quarto-generated assets (do not edit)
└── admin/                # Supporting documents
```

---

## Input Data

### 1. Hazard configuration — `Ex_hazard_areas.csv`

Defines cyclone intensity per Area Council. Required columns:

| Column       | Type   | Description                    |
|-------------|--------|--------------------------------|
| National    | text   | Country                        |
| Province    | text   | Province name                  |
| Area Council| text   | Council name (must match baseline) |
| Hazard      | text   | Hazard type (e.g. cyclone)     |
| Intensity   | 2–5    | Cyclone category               |

### 2. Baseline data — `1c_input_baseline.csv`

Pre-disaster indicators. Key structure:

- **Baseline**: Sector (Education, Health, Energy, Food Security, Shelter, WASH, etc.)
- **Indicator** & **Attribute**: Measure type (e.g. "Number Schools", "ecce")
- **Area Council**, **Year**: Geography and time
- **Value**: Numeric value

### 3. Damage multipliers — `2a Input- Damage Multiplier.csv`

Damage percentage by intensity and sector. Uses `check.names = FALSE` to preserve "Area Council" and "Intensity 2"–"Intensity 5" columns.

### 4. Resource multipliers — `3aii Input- Resources Sent.csv`

Resource quantities per affected unit (e.g. students, households). Columns: `Cluster`, `Indicator`, `Province`, `Area Council`, `Value`.

### 5. Finance estimates — `4a Input- Finance Estimates.csv`

Unit costs for damage valuation, by sector, indicator, and council.

### 6. GIS layers — `data/GIS_layers/`

GeoJSON files for Area Council boundaries. Used for Leaflet maps. The report expects `2016_phc_vut_acid_4326.geojson` with an `acname` field matching council names.

---

## Usage

### Render the report

From the project root:

```bash
quarto render index.qmd --to html
```

Or in R:

```r
quarto::quarto_render("index.qmd")
```

### Working directory

The report sets `setwd()` in the first chunk. Ensure your working directory is the project root, or edit the path in `index.qmd` (lines 44–45) to match your setup. The `here` package is used elsewhere for path resolution.

---

## Output

### HTML report

- Interactive tables (sortable, paginated)
- Leaflet maps by sector
- Collapsible code chunks

### CSV exports (`output/`)

| Prefix            | Content                                   |
|-------------------|-------------------------------------------|
| Education_*       | Schools, damage, resources, finance       |
| Energy_*          | Electricity, cooking fuel, infrastructure |
| FoodSecurity_*    | Crops, damage, resources, finance         |
| GenderProtection_*| Population, resources                     |
| Health_*          | Facilities, staff, damage, finance        |
| Logistics_*       | Infrastructure, roads, damage, finance    |
| Shelter_*         | Housing, damage, resources, finance       |
| Telecom_*         | Towers, damage                            |
| WASH_*            | Water, sanitation, damage                  |
| QC_*              | Quality-control samples                   |

---

## Sectors covered

| Sector            | Baseline        | Damage estimate | Resources    | Financial damage |
|-------------------|-----------------|-----------------|--------------|------------------|
| Education         | Schools, students| Damaged schools | Tents, lamps | ✓                |
| Emergency telecom | Towers          | Damaged towers  | —            | ✓                |
| Energy            | Household & infra| Disrupted access| —            | ✓                |
| Food Security     | Crops           | Damaged crops   | Cuttings, water, fish | ✓ |
| Gender & Protection| Population      | —               | Water, rice, fish | — |
| Health            | Facilities, staff| Damaged infra   | —            | ✓                |
| Logistics         | Roads, infra    | Damage          | Trucks, boats| ✓                |
| Shelter           | Housing materials| Roof/wall damage| —            | ✓                |
| WASH              | Water, toilets  | Damage          | —            | ✓                |

---

## Methodology (summary)

1. **Baseline** — Latest-year values from `1c_input_baseline.csv`, filtered by Area Council.
2. **Damage** — `baseline × damage_multiplier(intensity, sector)`. Multipliers are council- and intensity-specific.
3. **Resources** — `affected_units × resource_multiplier × days_of_support` (e.g. 14 days for consumables).
4. **Finance** — `damaged_units × unit_cost`, with costs from the finance config.
5. **Aggregation** — Council values summed to Province and National using `council_province_lookup.csv`.

---

## Customisation

- **Region order**: Edit the `region_order` vector in `index.qmd` (lines 81–98).
- **Days of support**: Set in the Education resources chunk (default 14).
- **Styling**: Adjust `asset/style.css` and the Quarto YAML (`theme`, `highlight-style`, etc.).

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `object 'ecce_schools' not found` | Ensure baseline data has Education rows with Attribute values: ecce, primary, secondary. |
| `Join columns must be present` | Check that `Ex_hazard_areas.csv` uses `Area Council` (or `Area.Council` if `check.names = TRUE`). |
| `cannot open the connection` | Verify `data/` paths. Use `here::here("data", "filename.csv")` for project-relative paths. |
| Maps not displaying | Ensure `data/GIS_layers/2016_phc_vut_acid_4326.geojson` exists and has `acname` matching council names. |
| Quarto not found | Install from [quarto.org](https://quarto.org/docs/download/) and ensure it is on your PATH. |

---

## Licence and attribution

A work by Government of Vanuatu.

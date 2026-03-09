# RAP Report — Presentation Key Points (Show & Go)

**Duration:** ~10–15 minutes | **Focus:** 2–3 clusters + technical details + customisation

---

## 1. Opening (30 sec)

- **What it is:** Disaster Damage and Response Estimation report for Vanuatu
- **Purpose:** Rapid assessment after a cyclone — damage, resources needed, financial impact
- **Output:** Interactive HTML with tables, maps, CSV exports for planning and response

---

## 2. Technical Behind the Scenes — Cyclone Intensity (2 min)

**The engine is a config file: `Ex_hazard_areas.csv`**

- One row per Area Council
- Columns: National, Province, Area Council, Hazard, **Intensity (2–5)**
- Intensity comes from **VMGD cyclone track maps** — overlay the track on Area Council boundaries
- Councils near the eye → Cat 4 or 5; outer bands → Cat 2 or 3; outside cone → 0

**How it drives everything:**

1. **Baseline** — Pre-disaster data (schools, health facilities, crops, etc.) from `1c_input_baseline.csv`
2. **Damage** — `baseline × damage_multiplier(intensity, sector)`. Multipliers are **council- and intensity-specific** (e.g. ECCE schools in Port Vila at Cat 4 vs Cat 2)
3. **Resources** — Affected units × resource multipliers (tents, water, crop cuttings, etc.)
4. **Finance** — Damaged units × unit costs from config
5. **Aggregation** — Council → Province → National

**Same cyclone, different intensities per council** — e.g. Shefa Cat 4, Malampa Cat 2.

---

## 3. Show & Go — 3 Clusters (5–7 min)

### Cluster 1: Education

- **Baseline:** Schools, students, teachers (ECCE, Primary, Secondary) by council
- **Damage:** Damaged schools, students affected — driven by intensity per council
- **Resources:** Tents, solar lamps, school kits for affected students
- **Finance:** Cost to repair/replace damaged infrastructure
- **Map:** Choropleth by council

### Cluster 2: Health

- **Baseline:** Health facilities, staff by council
- **Damage:** Damaged facilities, disrupted services
- **Finance:** Repair costs
- **Map:** Damage by Area Council

### Cluster 3: Food Security

- **Baseline:** Crops, households
- **Damage:** Damaged crops
- **Resources:** Crop cuttings, water, tinned fish, rice
- **Finance:** Crop loss valuation
- **Map:** Damage and resource needs

**Quick demo:** Scroll through tables, show maps, mention CSV exports in `output/`.

---

## 4. Other Sectors (30 sec)

- Emergency Telecom, Energy, Shelter, WASH, Logistics, Gender & Protection
- Same methodology — baseline → damage → resources → finance
- All driven by the same cyclone intensity config

---

## 5. Closing — Customisation (1 min)

**Everything is customisable at the Vanuatu Bureau of Statistics:**

- **Cyclone intensity** — Update `Ex_hazard_areas.csv` from VMGD maps (template provided)
- **Baseline data** — `1c_input_baseline.csv` (sectors, indicators, councils)
- **Damage multipliers** — By sector, intensity, council
- **Resource and finance configs** — Quantities, unit costs
- **Region order** — Council and province ordering in tables

**Same philosophy as the MIS system** — Susie will present next. Both are designed for **in-country ownership**: Vanuatu Bureau of Statistics can maintain and adapt inputs without external support.

---

## Quick Reference — Files to Mention

| File | Role |
|------|------|
| `Ex_hazard_areas.csv` | Cyclone intensity per council (from VMGD) |
| `1c_input_baseline.csv` | Pre-disaster baseline by sector |
| `2a Input- Damage Multiplier.csv` | Damage % by intensity & sector |
| `3aii Input- Resources Sent.csv` | Resource quantities per affected unit |
| `4a Input- Finance Estimates.csv` | Unit costs |
| `output/*.csv` | Exported tables for planning |

---

## Q&A — If asked: "Can we quantify building or garden damage?"

**Response:**

- **Yes — all hazards can be quantified.** We need the right tools and formulas.
- *Analogy:* Remove math from a plane, leave only the naked pilot. Even the human pilot can be quantified (golden ratio). Same for building damage, crop damage — the challenge is finding the right tools, not whether quantification is possible.
- **MIS adds field checks:** Within the first 10 years, many field checks will verify RAP estimations. If wrong → feedback → VBoS adjusts. It's a **machine learning process**.
- **Nuance:** Cat 4 may hit an island, but geology/mountains mean some areas only face Cat 2 or 3 winds. With time, these nuances will be captured in the MIS.

---

## One-Liner Summary

*"One config file with cyclone intensity per council drives damage, resources, and finance across all sectors — all inputs are customisable by Vanuatu Bureau of Statistics, same as the MIS."*

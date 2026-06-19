Solar Shadow Analysis Tool

Overview

This project is a web-based 3D Solar Shadow Analysis application developed using React and Three.js. The application enables users to model rooftop obstacles such as buildings and water tanks, place solar tables, adjust sun position manually or through date/time controls, and evaluate the impact of shadows on solar panel performance.

The system provides a visual representation of shadows in a 3D environment along with numerical metrics such as shadow coverage, efficiency, and Edge Occlusion Factor (EOF).

⸻

Setup and Run Instructions

Prerequisites

* Node.js (v18 or above recommended)
* npm

Installation

Clone the repository:

git clone <repository-url>
cd solar-shadow-analysis

Install dependencies:

npm install

Run the development server:

npm run dev

The application will be available at:

http://localhost:5173

Production Build

Create a production build:

npm run build

Preview the production build locally:

npm run preview

⸻

Project Architecture Overview

The project follows a component-based React architecture.

Main Components

App.jsx

Primary application component responsible for:

* UI rendering
* State management
* Three.js scene management
* Shadow analysis calculations
* Sun position calculations

Three.js Scene

Contains:

* Ground plane
* Grid helper
* Buildings
* Water tanks
* Solar tables
* Directional sunlight
* Ambient lighting

State Management

React Hooks are used for:

buildings
tanks
solarTables
sunPosition
shadowAnalysis
dateTime

Object References

A React ref stores references to Three.js objects:

objectsRef.current = {
  buildings: [],
  tanks: [],
  tables: []
};

This enables efficient updates and shadow analysis calculations.

⸻

Assumptions Made During Implementation

1. Solar tables consist of six solar panels arranged in a 2 × 3 configuration.
2. All solar panels use a fixed tilt angle.
3. Buildings are modeled as rectangular cuboids.
4. Water tanks are modeled as vertical cylinders.
5. Terrain is assumed to be perfectly flat.
6. Weather conditions are ignored.
7. Diffuse sky radiation is ignored.
8. Reflection and albedo effects are ignored.
9. Solar panels are assumed to have identical efficiency characteristics.
10. Sunlight is represented using a directional light source.

⸻

Shadow Analysis Methodology

The application performs geometric shadow analysis using ray casting techniques.

Process

Step 1

For every solar table:

* Each panel is analyzed individually.

Step 2

Multiple sample points are generated across the panel surface.

Example:

Top Left
Top Right
Center
Bottom Left
Bottom Right

Step 3

For each sample point:

* A ray is cast toward the sun direction.
* Buildings and tanks are treated as potential blockers.

Step 4

If an obstacle intersects the ray path:

Sample Point → Obstacle → Sun

the sample is marked as shaded.

Step 5

Shadow Coverage is computed as:

Shadow Coverage =
(Number of Shaded Samples / Total Samples) × 100

Step 6

Panel results are aggregated to generate table-level metrics.

⸻

Efficiency Analysis Methodology

The efficiency estimate is based on shadow coverage.

Formula

Efficiency (%) =
(1 − Shadow Coverage) × 100

Examples:

0% Shadow Coverage
→ 100% Efficiency
25% Shadow Coverage
→ 75% Efficiency
60% Shadow Coverage
→ 40% Efficiency

This simplified model assumes a linear relationship between shading and power loss.

⸻

Edge Occlusion Factor (EOF)

EOF is used as an additional indicator of shading severity.

Formula

EOF =
Shaded Samples / Total Samples

Higher EOF values indicate greater obstruction of incident sunlight.

⸻

Limitations and Simplifications

Simplified Solar Model

The sun position calculations are simplified and do not fully implement astronomical solar geometry.

Simplified Efficiency Model

Real photovoltaic systems exhibit nonlinear behavior under partial shading.

The current implementation assumes:

Power Loss ∝ Shadow Coverage

which is an approximation.

No Electrical Modeling

The application does not model:

* Cell mismatch losses
* Bypass diode behavior
* String-level effects
* MPPT behavior

Simplified Geometry

Buildings and tanks are represented using basic geometric primitives.

No Atmospheric Effects

The model ignores:

* Cloud cover
* Air mass effects
* Atmospheric scattering
* Seasonal irradiance variation

Shadow Approximation

Shadow calculations are based on geometric visibility and not on irradiance simulation.

⸻

External Libraries and Frameworks

React

Used for:

* UI development
* State management
* Component rendering

Website:

https://react.dev

⸻

Three.js

Used for:

* 3D visualization
* Scene creation
* Lighting
* Shadow rendering
* Geometric computations

Website:

https://threejs.org

⸻

Vite

Used as:

* Development server
* Build tool
* Bundler

Website:

https://vitejs.dev

⸻

Future Improvements

Potential enhancements include:

* Real GIS rooftop import
* Accurate NOAA/NREL solar position calculations
* Dynamic panel tilt adjustment
* Electrical loss modeling
* Irradiance heatmaps
* Annual energy yield estimation
* CSV and PDF report generation
* Optimization-based panel placement

⸻

Author

Abhishek Shukla

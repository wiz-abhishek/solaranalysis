import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

const SolarShadowAnalysis = () => {
  const [scene, setScene] = useState(null);
  const [camera, setCamera] = useState(null);
  const [renderer, setRenderer] = useState(null);
  const [buildings, setBuildings] = useState([
    { id: 1, x: 10, y: 10, width: 5, length: 8, height: 15 },
    { id: 2, x: -15, y: 5, width: 6, length: 6, height: 12 }
  ]);
  const [tanks, setTanks] = useState([
    { id: 1, x: 20, y: -10, radius: 3, height: 8 },
    { id: 2, x: -10, y: -20, radius: 2.5, height: 6 }
  ]);
  const [solarTables, setSolarTables] = useState([
    { id: 1, x: 0, y: 0, tilt: 15 },
    { id: 2, x: 30, y: 30, tilt: 15 }
  ]);
  const [sunPosition, setSunPosition] = useState({ azimuth: 180, elevation: 45 });
  const [useDateTime, setUseDateTime] = useState(false);
  const [dateTime, setDateTime] = useState('2024-06-21T12:00');
  const [shadowAnalysis, setShadowAnalysis] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const objectsRef = useRef({ buildings: [], tanks: [], tables: [] });

  // Calculate sun position from date and time
  const calculateSunPosition = (date, time) => {
    const dateObj = new Date(`${date}T${time}:00Z`);
    const year = dateObj.getUTCFullYear();
    const month = dateObj.getUTCMonth() + 1;
    const day = dateObj.getUTCDate();
    const hour = dateObj.getUTCHours();
    const minute = dateObj.getUTCMinutes();

    // Simplified solar position calculation (NOAA-like algorithm)
    const dayOfYear = Math.floor((month - 1) * 30.44) + day;
    const decimalHour = hour + minute / 60;
    
    // Solar declination (simplified)
    const declination = 23.44 * Math.sin((2 * Math.PI * (dayOfYear - 81)) / 365) * (Math.PI / 180);
    
    // Latitude approximation for Prayagraj (25.4358°N, 74.9255°E)
    const latitude = 25.4358 * (Math.PI / 180);
    
    // Hour angle
    const hourAngle = ((decimalHour - 12) * 15 + 74.9255) * (Math.PI / 180);
    
    // Solar elevation (altitude)
    const sinAlt = Math.sin(latitude) * Math.sin(declination) + 
                   Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle);
    const elevation = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * (180 / Math.PI);
    
    // Solar azimuth
    const cosAz = (Math.sin(declination) - Math.sin(latitude) * sinAlt) / 
                  (Math.cos(latitude) * Math.cos(Math.asin(sinAlt)));
    let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz))) * (180 / Math.PI);
    if (Math.sin(hourAngle) < 0) azimuth = 360 - azimuth;
    
    return { azimuth: azimuth % 360, elevation: Math.max(0, elevation) };
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const newScene = new THREE.Scene();
    newScene.background = new THREE.Color(0x87ceeb);
    
    // Camera
    const newCamera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    newCamera.position.set(40, 80, 50);
    newCamera.lookAt(0, 0, 0);
    
    // Renderer
    const newRenderer = new THREE.WebGLRenderer({ antialias: true });
    newRenderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    newRenderer.shadowMap.enabled = true;
    newRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(newRenderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    newScene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 1000;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    newScene.add(directionalLight);
    
    // Ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: "green" });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    newScene.add(ground);
    
    // Grid helper
    const gridHelper = new THREE.GridHelper(200, 20, 0xcccccc, 0xeeeeee);
    newScene.add(gridHelper);
    
    sceneRef.current = newScene;
    setScene(newScene);
    setCamera(newCamera);
    setRenderer(newRenderer);

    // Handle window resize
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        newCamera.aspect = width / height;
        newCamera.updateProjectionMatrix();
        newRenderer.setSize(width, height);
      }
    };
    window.addEventListener('resize', handleResize);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      newRenderer.render(newScene, newCamera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeChild(newRenderer.domElement);
    };
  }, []);

  // Update sun position and analyze shadows
  useEffect(() => {
    if (useDateTime) {
      const pos = calculateSunPosition(dateTime.split('T')[0], dateTime.split('T')[1]);
      setSunPosition(pos);
    }
  }, [useDateTime, dateTime]);

  // Create and update 3D objects
  useEffect(() => {
    if (!sceneRef.current) return;

    // Clear previous objects
    objectsRef.current.buildings.forEach(obj => sceneRef.current.remove(obj));
    objectsRef.current.tanks.forEach(obj => sceneRef.current.remove(obj));
    objectsRef.current.tables.forEach(obj => sceneRef.current.remove(obj));
    objectsRef.current = { buildings: [], tanks: [], tables: [] };

    // Add buildings
    buildings.forEach(building => {
      const geometry = new THREE.BoxGeometry(building.width, building.height, building.length);
      const material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.7 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(building.x, building.height / 2, building.y);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      sceneRef.current.add(mesh);
      objectsRef.current.buildings.push(mesh);
    });

    // Add water tanks
    tanks.forEach(tank => {
      const geometry = new THREE.CylinderGeometry(tank.radius, tank.radius, tank.height, 32);
      const material = new THREE.MeshStandardMaterial({ color: 0x4169e1, metalness: 0.6 });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(tank.x, tank.height / 2, tank.y);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      sceneRef.current.add(mesh);
      objectsRef.current.tanks.push(mesh);
    });

    // Add solar tables with panels
    solarTables.forEach(table => {
      const groupGeometry = new THREE.Group();
      const panelWidth = 2;
      const panelHeight = 1;
      const rows = 2, cols = 3;
      const spacing = 0.05;
      
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const panelGeometry = new THREE.BoxGeometry(panelWidth, 0.05, panelHeight);
          const panelMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1f1f9f, 
            metalness: 0.8,
            roughness: 0.2
          });
          const panel = new THREE.Mesh(panelGeometry, panelMaterial);
          
          const offsetX = (j - (cols - 1) / 2) * (panelWidth + spacing);
          const offsetZ = (i - (rows - 1) / 2) * (panelHeight + spacing);
          
          panel.position.set(offsetX, 0.5, offsetZ);
          panel.rotateZ((table.tilt * Math.PI) / 180);
          panel.castShadow = true;
          panel.receiveShadow = true;
          groupGeometry.add(panel);
        }
      }
      
      groupGeometry.position.set(table.x, 0, table.y);
      sceneRef.current.add(groupGeometry);
      objectsRef.current.tables.push(groupGeometry);
    });

    // Update sun light
    if (scene) {
      const lights = scene.children.filter(child => child instanceof THREE.Light);
      const directionalLight = lights.find(light => light instanceof THREE.DirectionalLight);
      
      if (directionalLight) {
        const azimuthRad = (sunPosition.azimuth * Math.PI) / 180;
        const elevationRad = (sunPosition.elevation * Math.PI) / 180;
        
        const distance = 100;
        directionalLight.position.set(
          distance * Math.sin(azimuthRad) * Math.cos(elevationRad),
          distance * Math.sin(elevationRad),
          distance * Math.cos(azimuthRad) * Math.cos(elevationRad)
        );
      }
    }
  }, [buildings, tanks, solarTables, sunPosition, scene]);

  // Analyze shadows and efficiency
  const analyzeShading = () => {
    if (!sceneRef.current) return;

    const raycaster = new THREE.Raycaster(undefined, undefined, 0, 1000);
    const results = { tables: [], totalCoverage: 0, eof: 0 };
    
    solarTables.forEach((table, tableIdx) => {
      let totalShadowCoverage = 0;
      let panelCount = 0;
      let edgeOcclusionFactors = [];
      
      const panelWidth = 2;
      const panelHeight = 1;
      const rows = 2;
      const cols = 3;
      const spacing = 0.05;
      
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          panelCount++;
          // Calculate panel position using the same logic as scene creation
          const offsetX = (j - (cols - 1) / 2) * (panelWidth + spacing);
          const offsetZ = (i - (rows - 1) / 2) * (panelHeight + spacing);
          const panelX = table.x + offsetX;
          const panelY = 0.5;
          const panelZ = table.y + offsetZ;
          
          // Test multiple points on the panel
          let shadowPoints = 0;
          let testPoints = 5;
          
          for (let t = 0; t < testPoints; t++) {
            const offsetXRand = (Math.random() - 0.5) * 2;
            const offsetZRand = (Math.random() - 0.5) * 1;
            
            const rayOrigin = new THREE.Vector3(panelX + offsetXRand, panelY + 0.1, panelZ + offsetZRand);
            const sunDir = new THREE.Vector3(
              Math.sin((sunPosition.azimuth * Math.PI) / 180) * Math.cos((sunPosition.elevation * Math.PI) / 180),
              Math.sin((sunPosition.elevation * Math.PI) / 180),
              Math.cos((sunPosition.azimuth * Math.PI) / 180) * Math.cos((sunPosition.elevation * Math.PI) / 180)
            );
            sunDir.normalize(); // Normalize the direction vector for raycaster
            raycaster.set(rayOrigin, sunDir);
            
            const intersects = raycaster.intersectObjects(objectsRef.current.buildings.concat(objectsRef.current.tanks), true);
            if (intersects.length > 0) {
              shadowPoints++;
            }
          }
          
          const shadowCoverage = shadowPoints / testPoints;
          totalShadowCoverage += shadowCoverage;
          
          // Calculate Edge Occlusion Factor (EOF)
          // EOF considers shadow distribution and edge weighting
          const edgeWeight = Math.min(1, Math.abs(shadowCoverage - 0.5) * 2);
          const eof = shadowCoverage * (1 + edgeWeight * 0.5);
          edgeOcclusionFactors.push(eof);
        }
      }
      
      const avgShadowCoverage = totalShadowCoverage / panelCount;
      const avgEOF = edgeOcclusionFactors.reduce((a, b) => a + b, 0) / edgeOcclusionFactors.length;
      
      results.tables.push({
        id: table.id,
        shadowCoverage: Math.round(avgShadowCoverage * 100),
        panelCount,
        eof: avgEOF.toFixed(3),
        efficiency: Math.round((1 - avgShadowCoverage) * 100)
      });
    });
    
    setShadowAnalysis(results);
  };

  // Update shadows when sun position changes
  useEffect(() => {
    analyzeShading();
  }, [sunPosition, buildings, tanks, solarTables]);

  // Sun playback
  useEffect(() => {
    if (!isPlaying || !useDateTime) return;
    
    const interval = setInterval(() => {
      setDateTime(prev => {
        const [date, time] = prev.split('T');
        const [hours, minutes] = time.split(':');
        let newHours = parseInt(hours);
        let newMinutes = parseInt(minutes) + 15;
        
        if (newMinutes >= 60) {
          newMinutes = 0;
          newHours += 1;
        }
        
        if (newHours >= 24) {
          newHours = 0;
        }
        
        return `${date}T${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, [isPlaying, useDateTime]);

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* 3D Scene */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          backgroundColor: '#62add3'
        }}
      />
      
      {/* Control Panel */}
      <div style={{
        width: '400px',
        backgroundColor: '#ccbcbc',
        borderLeft: '1px solid #ddd',
        overflowY: 'auto',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <h2 style={{ marginTop: 0 }}>Solar Shadow Analysis</h2>
        
        {/* Sun Position Controls */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
          <h3>Sun Position</h3>
          <div style={{ marginBottom: '10px' }}>
            <label>
              <input
                type="radio"
                name="sunMode"
                checked={!useDateTime}
                onChange={() => setUseDateTime(false)}
              />
              Manual Control
            </label>
          </div>
          {!useDateTime && (
            <>
              <div style={{ marginBottom: '10px' }}>
                <label>Azimuth: {Math.round(sunPosition.azimuth)}°</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={sunPosition.azimuth}
                  onChange={(e) => setSunPosition({ ...sunPosition, azimuth: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label>Elevation: {Math.round(sunPosition.elevation)}°</label>
                <input
                  type="range"
                  min="0"
                  max="90"
                  value={sunPosition.elevation}
                  onChange={(e) => setSunPosition({ ...sunPosition, elevation: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
            </>
          )}
          
          <div style={{ marginTop: '15px', marginBottom: '10px' }}>
            <label>
              <input
                type="radio"
                name="sunMode"
                checked={useDateTime}
                onChange={() => setUseDateTime(true)}
              />
              Date & Time
            </label>
          </div>
          {useDateTime && (
            <>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                style={{ width: '100%', padding: '5px', marginBottom: '10px', boxSizing: 'border-box' }}
              />
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: isPlaying ? '#ff6b6b' : '#51cf66',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {isPlaying ? 'Stop Playback' : 'Play Day'}
              </button>
            </>
          )}
        </div>

        {/* Building Controls */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
          <h3>Buildings</h3>
          {buildings.map((building, idx) => (
            <div key={building.id} style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Building {idx + 1}</div>
              <input
                type="number"
                placeholder="X"
                value={building.x}
                onChange={(e) => {
                  const newBuildings = [...buildings];
                  newBuildings[idx].x = parseFloat(e.target.value);
                  setBuildings(newBuildings);
                }}
                style={{ width: '48%', padding: '5px', marginRight: '4%', marginBottom: '5px', boxSizing: 'border-box' }}
              />
              <input
                type="number"
                placeholder="Y"
                value={building.y}
                onChange={(e) => {
                  const newBuildings = [...buildings];
                  newBuildings[idx].y = parseFloat(e.target.value);
                  setBuildings(newBuildings);
                }}
                style={{ width: '48%', padding: '5px', marginBottom: '5px', boxSizing: 'border-box' }}
              />
              <input
                type="number"
                placeholder="Width"
                value={building.width}
                onChange={(e) => {
                  const newBuildings = [...buildings];
                  newBuildings[idx].width = parseFloat(e.target.value);
                  setBuildings(newBuildings);
                }}
                style={{ width: '48%', padding: '5px', marginRight: '4%', marginBottom: '5px', boxSizing: 'border-box' }}
              />
              <input
                type="number"
                placeholder="Length"
                value={building.length}
                onChange={(e) => {
                  const newBuildings = [...buildings];
                  newBuildings[idx].length = parseFloat(e.target.value);
                  setBuildings(newBuildings);
                }}
                style={{ width: '48%', padding: '5px', marginBottom: '5px', boxSizing: 'border-box' }}
              />
              <input
                type="number"
                placeholder="Height"
                value={building.height}
                onChange={(e) => {
                  const newBuildings = [...buildings];
                  newBuildings[idx].height = parseFloat(e.target.value);
                  setBuildings(newBuildings);
                }}
                style={{ width: '100%', padding: '5px', marginBottom: '5px', boxSizing: 'border-box' }}
              />
            </div>
          ))}
        </div>

        {/* Tank Controls */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
          <h3>Water Tanks</h3>
          {tanks.map((tank, idx) => (
            <div key={tank.id} style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Tank {idx + 1}</div>
              <input
                type="number"
                placeholder="X"
                value={tank.x}
                onChange={(e) => {
                  const newTanks = [...tanks];
                  newTanks[idx].x = parseFloat(e.target.value);
                  setTanks(newTanks);
                }}
                style={{ width: '48%', padding: '5px', marginRight: '4%', marginBottom: '5px', boxSizing: 'border-box' }}
              />
              <input
                type="number"
                placeholder="Y"
                value={tank.y}
                onChange={(e) => {
                  const newTanks = [...tanks];
                  newTanks[idx].y = parseFloat(e.target.value);
                  setTanks(newTanks);
                }}
                style={{ width: '48%', padding: '5px', marginBottom: '5px', boxSizing: 'border-box' }}
              />
              <input
                type="number"
                placeholder="Radius"
                value={tank.radius}
                onChange={(e) => {
                  const newTanks = [...tanks];
                  newTanks[idx].radius = parseFloat(e.target.value);
                  setTanks(newTanks);
                }}
                style={{ width: '48%', padding: '5px', marginRight: '4%', marginBottom: '5px', boxSizing: 'border-box' }}
              />
              <input
                type="number"
                placeholder="Height"
                value={tank.height}
                onChange={(e) => {
                  const newTanks = [...tanks];
                  newTanks[idx].height = parseFloat(e.target.value);
                  setTanks(newTanks);
                }}
                style={{ width: '48%', padding: '5px', marginBottom: '5px', boxSizing: 'border-box' }}
              />
            </div>
          ))}
        </div>

        {/* Solar Table Controls */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
          <h3>Solar Tables</h3>
          {solarTables.map((table, idx) => (
            <div key={table.id} style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Table {idx + 1}</div>
              <input
                type="number"
                placeholder="X"
                value={table.x}
                onChange={(e) => {
                  const newTables = [...solarTables];
                  newTables[idx].x = parseFloat(e.target.value);
                  setSolarTables(newTables);
                }}
                style={{ width: '48%', padding: '5px', marginRight: '4%', marginBottom: '5px', boxSizing: 'border-box' }}
              />
              <input
                type="number"
                placeholder="Y"
                value={table.y}
                onChange={(e) => {
                  const newTables = [...solarTables];
                  newTables[idx].y = parseFloat(e.target.value);
                  setSolarTables(newTables);
                }}
                style={{ width: '48%', padding: '5px', marginBottom: '5px', boxSizing: 'border-box' }}
              />
              <div style={{ fontSize: '0.85em', color: '#666' }}>Tilt: {table.tilt}° (Fixed)</div>
            </div>
          ))}
        </div>

        {/* Shadow Analysis Results */}
        {shadowAnalysis && (
          <div style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px' }}>
            <h3>Shadow Analysis Results</h3>
            {shadowAnalysis.tables.map(table => (
              <div key={table.id} style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Table {table.id}</div>
                <div style={{ fontSize: '0.9em' }}>
                  <div>Shadow Coverage: <span style={{ color: '#d9534f', fontWeight: 'bold' }}>{table.shadowCoverage}%</span></div>
                  <div>Efficiency: <span style={{ color: '#5cb85c', fontWeight: 'bold' }}>{table.efficiency}%</span></div>
                  <div>EOF: <span style={{ color: '#0275d8', fontWeight: 'bold' }}>{table.eof}</span></div>
                  <div>
                    <span style={{
                      display: 'inline-block',
                      width: '10px',
                      height: '10px',
                      borderRadius: '2px',
                      marginRight: '5px',
                      backgroundColor: table.efficiency > 70 ? '#5cb85c' : table.efficiency > 40 ? '#f0ad4e' : '#d9534f'
                    }}></span>
                    {table.efficiency > 70 ? 'Good' : table.efficiency > 40 ? 'Fair' : 'Poor'} Performance
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SolarShadowAnalysis;

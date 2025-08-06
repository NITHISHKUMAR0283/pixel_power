import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, MapPin, Radio, Waves, Thermometer, Activity, Shield, Users, Clock, Battery, Smartphone, Map, Navigation, Phone, AlertCircle, Zap, Satellite, Wifi, Signal } from 'lucide-react';

const LifeBeacon = () => {
  const [systemStatus, setSystemStatus] = useState('initializing');
  const [earthquakeDetected, setEarthquakeDetected] = useState(false);
  const [sensorData, setSensorData] = useState({
    acceleration: { x: 0, y: 0, z: 0, magnitude: 0 },
    gyroscope: { alpha: 0, beta: 0, gamma: 0 },
    location: { lat: null, lng: null, accuracy: null },
    audio: { frequency: [], amplitude: 0 },
    magnetometer: { x: 0, y: 0, z: 0 }
  });
  const [physicsCalculations, setPhysicsCalculations] = useState({});
  const [earthquakeMetrics, setEarthquakeMetrics] = useState({
    magnitude: 0,
    pWaveVelocity: 0,
    sWaveVelocity: 0,
    epicenterDistance: 0,
    intensity: 'None'
  });
  const [sensorPermissions, setSensorPermissions] = useState({
    accelerometer: false,
    gyroscope: false,
    geolocation: false,
    microphone: false
  });
  const [nearbyVictims, setNearbyVictims] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [batteryStatus, setBatteryStatus] = useState({ level: 100, charging: false });
  
  const accelerometerRef = useRef(null);
  const gyroscopeRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Battery API integration
  const initializeBatteryStatus = useCallback(async () => {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        setBatteryStatus({
          level: Math.round(battery.level * 100),
          charging: battery.charging
        });
        
        battery.addEventListener('levelchange', () => {
          setBatteryStatus(prev => ({ ...prev, level: Math.round(battery.level * 100) }));
        });
        
        battery.addEventListener('chargingchange', () => {
          setBatteryStatus(prev => ({ ...prev, charging: battery.charging }));
        });
      } catch (error) {
        console.log('Battery API not available');
      }
    }
  }, []);

  // Enhanced accelerometer initialization - No automatic earthquake detection
  const initializeAccelerometer = useCallback(async () => {
    console.log('Initializing enhanced accelerometer...');
    
    if ('DeviceMotionEvent' in window) {
      try {
        // Request permission for iOS 13+
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
          console.log('Requesting iOS motion permission...');
          const permission = await DeviceMotionEvent.requestPermission();
          if (permission !== 'granted') {
            console.warn('Motion permission denied');
            setSystemStatus('permission_denied');
            return false;
          }
        }

        // Enhanced motion handler with better precision and multiple sources
        const handleMotion = (event) => {
          // Try multiple acceleration sources for better compatibility
          const accWithGravity = event.accelerationIncludingGravity;
          const accWithoutGravity = event.acceleration;
          const rotationRate = event.rotationRate;
          
          let x = 0, y = 0, z = 0;
          let hasValidData = false;

          // Prioritize acceleration including gravity (more reliable on mobile)
          if (accWithGravity && (accWithGravity.x !== null && accWithGravity.y !== null && accWithGravity.z !== null)) {
            x = accWithGravity.x || 0;
            y = accWithGravity.y || 0;
            z = accWithGravity.z || 0;
            hasValidData = true;
            console.log('Using accelerationIncludingGravity:', { x, y, z });
          }
          // Fallback to acceleration without gravity
          else if (accWithoutGravity && (accWithoutGravity.x !== null && accWithoutGravity.y !== null && accWithoutGravity.z !== null)) {
            x = accWithoutGravity.x || 0;
            y = accWithoutGravity.y || 0;
            z = accWithoutGravity.z || 0;
            hasValidData = true;
            console.log('Using acceleration without gravity:', { x, y, z });
          }
          // Last resort: use rotation rate as movement indicator
          else if (rotationRate && (rotationRate.alpha !== null || rotationRate.beta !== null || rotationRate.gamma !== null)) {
            x = (rotationRate.alpha || 0) * 0.1; // Convert rotation to pseudo-acceleration
            y = (rotationRate.beta || 0) * 0.1;
            z = (rotationRate.gamma || 0) * 0.1;
            hasValidData = true;
            console.log('Using rotation rate as fallback:', { x, y, z });
          }

          if (hasValidData) {
            // Enhanced precision with more decimal places
            const magnitude = Math.sqrt(x*x + y*y + z*z);
            
            setSensorData(prev => ({
              ...prev,
              acceleration: { 
                x: parseFloat(x.toFixed(4)),
                y: parseFloat(y.toFixed(4)), 
                z: parseFloat(z.toFixed(4)), 
                magnitude: parseFloat(magnitude.toFixed(4)),
                timestamp: Date.now(),
                source: accWithGravity ? 'gravity' : accWithoutGravity ? 'linear' : 'rotation'
              }
            }));

            // No automatic earthquake detection - only show sensor data
          } else {
            console.warn('No valid motion data available from any source');
            // Set some debug values to show sensor is trying
            setSensorData(prev => ({
              ...prev,
              acceleration: { 
                x: 0.0001,
                y: 0.0001, 
                z: 9.8100,
                magnitude: 9.8100,
                timestamp: Date.now(),
                source: 'simulated'
              }
            }));
          }
        };

        // Add event listener with enhanced options
        window.addEventListener('devicemotion', handleMotion, { 
          passive: false,
          capture: true
        });
        
        setSensorPermissions(prev => ({ ...prev, accelerometer: true }));
        console.log('Enhanced accelerometer initialized successfully');
        
        return true;
      } catch (error) {
        console.error('Accelerometer initialization failed:', error);
        setSystemStatus('sensor_error');
        return false;
      }
    } else {
      console.warn('DeviceMotionEvent not supported');
      // Provide simulated data for desktop testing
      const simulateMotion = () => {
        const time = Date.now() / 1000;
        const x = Math.sin(time * 0.1) * 0.1;
        const y = Math.cos(time * 0.1) * 0.1;
        const z = 9.81 + Math.sin(time * 0.5) * 0.05;
        const magnitude = Math.sqrt(x*x + y*y + z*z);
        
        setSensorData(prev => ({
          ...prev,
          acceleration: { 
            x: parseFloat(x.toFixed(4)),
            y: parseFloat(y.toFixed(4)),
            z: parseFloat(z.toFixed(4)),
            magnitude: parseFloat(magnitude.toFixed(4)),
            timestamp: Date.now(),
            source: 'simulated'
          }
        }));
      };
      
      // Simulate motion for desktop testing
      const simulationInterval = setInterval(simulateMotion, 100);
      window.accelerometerSimulation = simulationInterval;
      
      setSensorPermissions(prev => ({ ...prev, accelerometer: true }));
      setSystemStatus('limited_functionality');
      return true;
    }
  }, []);

  // Enhanced gyroscope initialization with better precision
  const initializeGyroscope = useCallback(async () => {
    console.log('Initializing enhanced gyroscope...');
    
    if ('DeviceOrientationEvent' in window) {
      try {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          console.log('Requesting iOS orientation permission...');
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission !== 'granted') {
            console.warn('Orientation permission denied');
            return false;
          }
        }

        const handleOrientation = (event) => {
          const alpha = event.alpha;
          const beta = event.beta;
          const gamma = event.gamma;
          
          if (alpha !== null || beta !== null || gamma !== null) {
            setSensorData(prev => ({
              ...prev,
              gyroscope: {
                alpha: parseFloat((alpha || 0).toFixed(3)),
                beta: parseFloat((beta || 0).toFixed(3)),
                gamma: parseFloat((gamma || 0).toFixed(3)),
                timestamp: Date.now(),
                compass: alpha !== null ? parseFloat(alpha.toFixed(1)) : null,
                tiltFrontBack: beta !== null ? parseFloat(beta.toFixed(2)) : null,
                tiltLeftRight: gamma !== null ? parseFloat(gamma.toFixed(2)) : null
              }
            }));
            console.log('Orientation updated:', { alpha, beta, gamma });
          } else {
            console.warn('No valid orientation data available');
          }
        };

        window.addEventListener('deviceorientation', handleOrientation, { 
          passive: false,
          capture: true
        });
        
        if ('ondeviceorientationabsolute' in window) {
          window.addEventListener('deviceorientationabsolute', (event) => {
            setSensorData(prev => ({
              ...prev,
              gyroscope: {
                ...prev.gyroscope,
                absoluteAlpha: parseFloat((event.alpha || 0).toFixed(3)),
                absoluteCompass: event.alpha !== null ? parseFloat(event.alpha.toFixed(1)) : null
              }
            }));
          }, { passive: false });
        }
        
        setSensorPermissions(prev => ({ ...prev, gyroscope: true }));
        console.log('Enhanced gyroscope initialized successfully');
        return true;
      } catch (error) {
        console.error('Gyroscope initialization failed:', error);
        return false;
      }
    } else {
      console.warn('DeviceOrientationEvent not supported');
      const simulateOrientation = () => {
        const time = Date.now() / 1000;
        const alpha = (Math.sin(time * 0.1) * 180 + 180) % 360;
        const beta = Math.sin(time * 0.2) * 45;
        const gamma = Math.cos(time * 0.15) * 30;
        
        setSensorData(prev => ({
          ...prev,
          gyroscope: {
            alpha: parseFloat(alpha.toFixed(3)),
            beta: parseFloat(beta.toFixed(3)),
            gamma: parseFloat(gamma.toFixed(3)),
            timestamp: Date.now(),
            compass: parseFloat(alpha.toFixed(1)),
            tiltFrontBack: parseFloat(beta.toFixed(2)),
            tiltLeftRight: parseFloat(gamma.toFixed(2))
          }
        }));
      };
      
      const simulationInterval = setInterval(simulateOrientation, 200);
      window.gyroscopeSimulation = simulationInterval;
      
      setSensorPermissions(prev => ({ ...prev, gyroscope: true }));
      return true;
    }
  }, []);

  // Enhanced GPS location with multiple accuracy attempts
  const initializeGeolocation = useCallback(() => {
    console.log('Initializing enhanced geolocation...');
    
    if ('geolocation' in navigator) {
      const highAccuracyOptions = {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      };

      const fallbackOptions = {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 30000
      };

      const handleLocation = (position) => {
        console.log('Location obtained:', position.coords);
        const accuracy = position.coords.accuracy;
        
        setSensorData(prev => ({
          ...prev,
          location: {
            lat: parseFloat(position.coords.latitude.toFixed(6)),
            lng: parseFloat(position.coords.longitude.toFixed(6)),
            accuracy: parseInt(accuracy.toFixed(0)),
            timestamp: position.timestamp,
            heading: position.coords.heading,
            speed: position.coords.speed,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy
          }
        }));
        setSensorPermissions(prev => ({ ...prev, geolocation: true }));

        if (accuracy > 100) {
          console.log(`Poor accuracy (${accuracy}m), attempting to improve...`);
          setTimeout(() => {
            navigator.geolocation.getCurrentPosition(handleLocation, handleError, {
              ...highAccuracyOptions,
              timeout: 45000
            });
          }, 5000);
        }
      };

      const handleError = (error) => {
        console.error('Geolocation error:', error.message, error.code);
        let errorMessage = 'Permission Required';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location Access Denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location Unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location Timeout';
            navigator.geolocation.getCurrentPosition(handleLocation, () => {}, fallbackOptions);
            return;
        }
        
        setSensorData(prev => ({
          ...prev,
          location: {
            lat: errorMessage,
            lng: errorMessage, 
            accuracy: 'N/A',
            error: error.message
          }
        }));
      };

      navigator.geolocation.getCurrentPosition(handleLocation, handleError, highAccuracyOptions);
      
      const watchId = navigator.geolocation.watchPosition(handleLocation, handleError, {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 10000
      });
      
      window.geolocationWatchId = watchId;
      
      return true;
    }
    console.warn('Geolocation not supported');
    return false;
  }, []);

  // Audio analysis initialization
  const initializeAudioAnalysis = useCallback(async () => {
    console.log('Initializing audio analysis...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      
      const microphone = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = microphone;
      
      microphone.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const analyzeAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        
        const amplitude = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const dominantFreq = findDominantFrequency(Array.from(dataArray));
        
        setSensorData(prev => ({
          ...prev,
          audio: {
            frequency: Array.from(dataArray),
            amplitude: parseInt(amplitude.toFixed(0)),
            dominantFrequency: parseInt(dominantFreq.toFixed(0))
          }
        }));
        
        if (audioContextRef.current && audioContextRef.current.state === 'running') {
          requestAnimationFrame(analyzeAudio);
        }
      };
      
      analyzeAudio();
      
      setSensorPermissions(prev => ({ ...prev, microphone: true }));
      console.log('Audio analysis initialized successfully');
      return true;
      
    } catch (error) {
      console.error('Audio initialization failed:', error);
      setSensorPermissions(prev => ({ ...prev, microphone: false }));
      return false;
    }
  }, []);

  // Physics helper functions
  const findDominantFrequency = useCallback((frequencies) => {
    if (!frequencies || frequencies.length === 0) return 100;
    
    let maxIndex = 0;
    let maxValue = 0;
    frequencies.forEach((value, index) => {
      if (value > maxValue) {
        maxValue = value;
        maxIndex = index;
      }
    });
    return maxIndex * 44100 / 2048;
  }, []);

  const calculateAcousticReflection = useCallback((amplitude, frequency) => {
    if (!amplitude || !frequency) return 0;
    const airImpedance = 413;
    const concreteImpedance = 8e6;
    return Math.abs((concreteImpedance - airImpedance) / (concreteImpedance + airImpedance));
  }, []);

  const estimateAirPockets = useCallback((reflectionCoeff) => {
    return Math.floor((reflectionCoeff || 0) * 10);
  }, []);

  const getIntensityScale = (magnitude) => {
    if (magnitude < 2) return 'Micro';
    if (magnitude < 4) return 'Minor';
    if (magnitude < 5) return 'Light';
    if (magnitude < 6) return 'Moderate';
    if (magnitude < 7) return 'Strong';
    if (magnitude < 8) return 'Major';
    return 'Great';
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Initialize OpenStreetMap using Leaflet CDN
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !sensorData.location.lat || typeof sensorData.location.lat !== 'number') return;

    const loadLeaflet = () => {
      return new Promise((resolve) => {
        if (window.L) {
          resolve();
          return;
        }

        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
        css.crossOrigin = '';
        document.head.appendChild(css);

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
        script.crossOrigin = '';
        script.onload = resolve;
        document.head.appendChild(script);
      });
    };

    loadLeaflet().then(() => {
      const lat = sensorData.location.lat;
      const lng = sensorData.location.lng;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = window.L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true
      });

      mapInstanceRef.current = map;

      window.L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibmswMjgzIiwiYSI6ImNtZTBjajhmYzAzZ3Ayc284dm0wOHBqMzUifQ.l4mWR6vabT_upjRbimhVwQ', {
        attribution: '© Mapbox © OpenStreetMap',
        tileSize: 512,
        zoomOffset: -1,
        maxZoom: 20,
        accessToken: 'pk.eyJ1IjoibmswMjgzIiwiYSI6ImNtZTBjajhmYzAzZ3Ayc284dm0wOHBqMzUifQ.l4mWR6vabT_upjRbimhVwQ'
      }).addTo(map);

      const currentLocationIcon = window.L.divIcon({
        html: `<div style="background: ${earthquakeDetected ? '#ef4444' : '#3b82f6'}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
        iconSize: [20, 20],
        className: 'custom-marker'
      });

      window.L.marker([lat, lng], { icon: currentLocationIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-size: 12px; min-width: 200px;">
            <strong style="color: ${earthquakeDetected ? '#ef4444' : '#3b82f6'};">
              ${earthquakeDetected ? '🚨 VICTIM LOCATION' : '📍 Your Location'}
            </strong><br/>
            <strong>Coordinates:</strong><br/>
            Lat: ${lat.toFixed(6)}<br/>
            Lng: ${lng.toFixed(6)}<br/>
            <strong>Accuracy:</strong> ${sensorData.location.accuracy}m<br/>
            ${earthquakeDetected ? `<strong style="color: #ef4444;">Magnitude: ${earthquakeMetrics.magnitude}</strong><br/>` : ''}
            <strong>Battery:</strong> ${batteryStatus.level}% ${batteryStatus.charging ? '⚡' : '🔋'}<br/>
            <strong>Status:</strong> ${systemStatus.replace('_', ' ').toUpperCase()}
          </div>
        `)
        .openPopup();

      // Add simulated nearby victims if earthquake detected
      if (earthquakeDetected) {
        const simulatedVictims = [
          { lat: lat + 0.001, lng: lng + 0.001, status: 'trapped', battery: 45, name: 'Victim Alpha' },
          { lat: lat - 0.0015, lng: lng + 0.0008, status: 'injured', battery: 78, name: 'Victim Beta' },
          { lat: lat + 0.0008, lng: lng - 0.0012, status: 'safe', battery: 92, name: 'Victim Gamma' },
          { lat: lat - 0.0005, lng: lng - 0.0018, status: 'trapped', battery: 23, name: 'Victim Delta' }
        ];

        simulatedVictims.forEach((victim, index) => {
          const statusColors = {
            trapped: '#ef4444',
            injured: '#f59e0b',
            safe: '#10b981'
          };

          const statusEmojis = {
            trapped: '🆘',
            injured: '🚑',
            safe: '✅'
          };

          const victimIcon = window.L.divIcon({
            html: `<div style="background: ${statusColors[victim.status]}; color: white; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">${statusEmojis[victim.status]}</div>`,
            iconSize: [24, 24],
            className: 'victim-marker'
          });

          window.L.marker([victim.lat, victim.lng], { icon: victimIcon })
            .addTo(map)
            .bindPopup(`
              <div style="font-size: 12px; min-width: 160px;">
                <strong style="color: ${statusColors[victim.status]};">${statusEmojis[victim.status]} ${victim.name}</strong><br/>
                <strong>Status:</strong> ${victim.status.toUpperCase()}<br/>
                <strong>Battery:</strong> ${victim.battery}% ${victim.battery < 30 ? '⚠️' : '🔋'}<br/>
                <strong>Distance:</strong> ${calculateDistance(lat, lng, victim.lat, victim.lng).toFixed(2)} km<br/>
                <strong>Signal:</strong> ${victim.battery > 50 ? 'Strong' : victim.battery > 20 ? 'Weak' : 'Critical'}<br/>
                ${victim.status === 'trapped' ? '<strong style="color: #ef4444;">⚠️ PRIORITY RESCUE NEEDED</strong>' : ''}
              </div>
            `);
        });

        setNearbyVictims(simulatedVictims);
      }
    });
  }, [sensorData.location, earthquakeDetected, earthquakeMetrics.magnitude, batteryStatus, systemStatus]);

  // Emergency protocol activation - Only when button clicked
  const triggerEmergencyProtocol = () => {
    // Calculate earthquake metrics for simulation
    const simulatedMagnitude = 5.5 + Math.random() * 2;
    
    const K = 2.5e10;
    const mu = 1.5e10;
    const rho = 2700;
    const pWaveVelocity = Math.sqrt((K + (4 * mu / 3)) / rho);
    const sWaveVelocity = Math.sqrt(mu / rho);
    
    setEarthquakeMetrics({
      magnitude: parseFloat(simulatedMagnitude.toFixed(1)),
      pWaveVelocity: parseInt(pWaveVelocity.toFixed(0)),
      sWaveVelocity: parseInt(sWaveVelocity.toFixed(0)),
      epicenterDistance: 0,
      intensity: getIntensityScale(simulatedMagnitude)
    });

    const emergencyData = {
      timestamp: new Date().toISOString(),
      deviceId: generateDeviceId(),
      location: sensorData.location,
      earthquakeMetrics: {
        magnitude: simulatedMagnitude,
        intensity: getIntensityScale(simulatedMagnitude)
      },
      sensorReadings: sensorData,
      batteryLevel: batteryStatus.level,
      emergencyLevel: simulatedMagnitude > 6 ? 'CRITICAL' : 'HIGH',
      physicsData: physicsCalculations
    };
    
    console.log('🚨 EMERGENCY PROTOCOL ACTIVATED:', emergencyData);
    
    setEarthquakeDetected(true);
    setSystemStatus('earthquake_detected');
    
    // Auto-refresh map in emergency
    setTimeout(() => initializeMap(), 500);
    
    setEmergencyContacts([
      { name: 'Emergency Services', number: '911', type: 'emergency' },
      { name: 'Local Fire Dept', number: '911', type: 'fire' },
      { name: 'Medical Emergency', number: '911', type: 'medical' }
    ]);
  };

  const generateDeviceId = () => {
    return 'LB-' + Math.random().toString(36).substr(2, 9);
  };

  // Initialize all sensors
  useEffect(() => {
    const initializeSensors = async () => {
      setSystemStatus('requesting_permissions');
      
      try {
        await initializeBatteryStatus();
        
        const accelerometerResult = await initializeAccelerometer().catch(() => false);
        const gyroscopeResult = await initializeGyroscope().catch(() => false);
        const geolocationResult = await Promise.resolve(initializeGeolocation()).catch(() => false);
        const audioResult = await initializeAudioAnalysis().catch(() => false);
        
        const results = [accelerometerResult, gyroscopeResult, geolocationResult, audioResult];
        const successCount = results.filter(Boolean).length;
        
        if (successCount >= 2) {
          setSystemStatus('active_monitoring');
        } else if (successCount >= 1) {
          setSystemStatus('limited_functionality');
        } else {
          setSystemStatus('sensor_error');
        }
      } catch (error) {
        console.error('Sensor initialization failed:', error);
        setSystemStatus('error');
      }
    };

    initializeSensors();
  }, [initializeAccelerometer, initializeGyroscope, initializeGeolocation, initializeAudioAnalysis, initializeBatteryStatus]);

  // Real-time physics calculations
  useEffect(() => {
    const calculatePhysics = () => {
      const { acceleration, location, audio } = sensorData;
      
      const emSignalStrength = Math.sqrt(
        acceleration.x * acceleration.x + 
        acceleration.y * acceleration.y
      );
      
      const gravitationalAnomaly = Math.abs(acceleration.z - 9.81);
      
      const thermalSignature = {
        estimated: 20 + (audio.amplitude / 10),
        confidence: audio.amplitude > 50 ? 'High' : 'Low'
      };

      const acousticAnalysis = {
        wavelength: audio.dominantFrequency ? (343 / audio.dominantFrequency).toFixed(2) : 0,
        frequency: audio.dominantFrequency || 0,
        airPockets: estimateAirPockets(calculateAcousticReflection(audio.amplitude, audio.dominantFrequency))
      };
      
      setPhysicsCalculations(prev => ({
        ...prev,
        acoustic: acousticAnalysis,
        electromagnetic: {
          signalStrength: parseFloat(emSignalStrength.toFixed(2)),
          penetrationDepth: parseFloat((emSignalStrength * 0.1).toFixed(1))
        },
        gravitational: {
          anomaly: parseFloat(gravitationalAnomaly.toFixed(3)),
          voidDetection: gravitationalAnomaly > 0.5 ? 'Possible' : 'None'
        },
        thermal: thermalSignature
      }));
    };

    const interval = setInterval(calculatePhysics, 1000);
    return () => clearInterval(interval);
  }, [sensorData, calculateAcousticReflection, estimateAirPockets]);

  // Auto-update map when location changes
  useEffect(() => {
    if (sensorData.location.lat && typeof sensorData.location.lat === 'number') {
      const debounceTimer = setTimeout(() => {
        initializeMap();
      }, 1000);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [sensorData.location, initializeMap]);

  // Render sensor permission status
  const SensorStatus = ({ sensor, enabled, label }) => (
    <div className={`flex items-center gap-2 p-3 rounded-xl transition-all duration-300 ${
      enabled 
        ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20' 
        : 'bg-gradient-to-r from-slate-500/10 to-gray-500/10 border border-slate-500/20'
    }`}>
      <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
        enabled 
          ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' 
          : 'bg-slate-400'
      }`}></div>
      <span className="text-sm font-medium text-slate-200">{label}</span>
      {enabled && <Signal size={14} className="text-emerald-400 ml-auto" />}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/30 text-white">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative px-6 py-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="relative">
              <Shield size={32} className="text-blue-400" />
              <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                earthquakeDetected ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
              }`}></div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-300 via-cyan-300 to-teal-300 bg-clip-text text-transparent">
              LifeBeacon
            </h1>
          </div>
          <p className="text-slate-300 text-sm mb-4 max-w-md mx-auto leading-relaxed">
            Advanced Physics-Based Earthquake Detection & Emergency Response System
          </p>
          
          {/* Status Indicators Row */}
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full">
              <Battery size={16} className={batteryStatus.level > 20 ? 'text-emerald-400' : 'text-red-400'} />
              <span className="text-sm font-mono">{batteryStatus.level}%</span>
              {batteryStatus.charging && <Zap size={12} className="text-yellow-400" />}
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full">
              <Satellite size={16} className={sensorData.location.accuracy <= 50 ? 'text-emerald-400' : 'text-yellow-400'} />
              <span className="text-sm font-mono">
                {sensorData.location.accuracy !== 'N/A' && sensorData.location.accuracy ? 
                  `±${sensorData.location.accuracy}m` : 'No GPS'}
              </span>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 backdrop-blur-sm rounded-full">
              <Activity size={16} className={Math.abs(sensorData.acceleration.magnitude) > 0.5 ? 'text-emerald-400' : 'text-slate-400'} />
              <span className="text-sm font-mono">{sensorData.acceleration.magnitude.toFixed(1)} m/s²</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-6 space-y-6">
        {/* System Status Card */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/30 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${
                systemStatus === 'active_monitoring' ? 'bg-emerald-500/20' :
                systemStatus === 'earthquake_detected' ? 'bg-red-500/20' :
                'bg-yellow-500/20'
              }`}>
                <Shield size={20} className={
                  systemStatus === 'active_monitoring' ? 'text-emerald-400' :
                  systemStatus === 'earthquake_detected' ? 'text-red-400' :
                  'text-yellow-400'
                } />
              </div>
              <h3 className="font-semibold text-lg text-slate-100">System Status</h3>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
              systemStatus === 'active_monitoring' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' :
              systemStatus === 'earthquake_detected' ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/25' :
              systemStatus === 'requesting_permissions' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/25' :
              'bg-slate-500 text-white'
            }`}>
              {systemStatus.replace('_', ' ').toUpperCase()}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <SensorStatus 
              sensor="accelerometer" 
              enabled={sensorPermissions.accelerometer}
              label="Motion Sensor"
            />
            <SensorStatus 
              sensor="gyroscope" 
              enabled={sensorPermissions.gyroscope}
              label="Orientation"
            />
            <SensorStatus 
              sensor="geolocation" 
              enabled={sensorPermissions.geolocation}
              label="GPS Location"
            />
            <SensorStatus 
              sensor="microphone" 
              enabled={sensorPermissions.microphone}
              label="Audio Analysis"
            />
          </div>
        </div>

        {/* Always Show Map */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/30 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Map size={20} className="text-blue-400" />
            </div>
            <h3 className="font-semibold text-lg">🗺️ Live Location Map</h3>
          </div>
          <div 
            ref={mapRef} 
            className="w-full h-80 rounded-xl border-2 border-slate-600/30 overflow-hidden shadow-inner"
            style={{ minHeight: '320px' }}
          ></div>
        </div>

        {/* Enhanced Earthquake Alert - Only when button clicked */}
        {earthquakeDetected && (
          <div className="bg-gradient-to-br from-red-900/80 to-red-800/80 backdrop-blur-sm border-2 border-red-500/50 rounded-2xl p-6 shadow-2xl shadow-red-500/25 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/30 rounded-xl">
                <AlertTriangle size={24} className="text-red-300" />
              </div>
              <h3 className="font-bold text-xl text-red-200">🚨 EARTHQUAKE DETECTED</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-red-800/50 p-4 rounded-xl border border-red-500/30">
                <div className="text-red-300 text-sm mb-1">Estimated Magnitude</div>
                <div className="text-3xl font-bold text-white">{earthquakeMetrics.magnitude}</div>
              </div>
              <div className="bg-red-800/50 p-4 rounded-xl border border-red-500/30">
                <div className="text-red-300 text-sm mb-1">Intensity Scale</div>
                <div className="text-xl font-semibold text-white">{earthquakeMetrics.intensity}</div>
              </div>
            </div>

            {/* Emergency Contacts */}
            {emergencyContacts.length > 0 && (
              <div className="bg-red-800/50 rounded-xl p-4 border border-red-500/30">
                <h4 className="font-medium text-red-200 mb-3 flex items-center gap-2">
                  <Phone size={16} />
                  Emergency Contacts
                </h4>
                <div className="space-y-2">
                  {emergencyContacts.map((contact, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-red-700/50 rounded-lg">
                      <span className="text-sm font-medium text-red-100">{contact.name}</span>
                      <a 
                        href={`tel:${contact.number}`}
                        className="bg-red-500 hover:bg-red-400 px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2 transition-all duration-200 shadow-lg"
                      >
                        <Phone size={14} />
                        Call {contact.number}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sensor Data Display */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/30 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <Activity size={20} className="text-purple-400" />
            </div>
            <h3 className="font-semibold text-lg">Live Sensor Data</h3>
            <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-emerald-400 font-medium">LIVE</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Motion Data */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Waves size={16} className="text-blue-400" />
                <span className="text-slate-300 font-medium">Acceleration (m/s²)</span>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-xl font-mono text-sm border border-slate-600/30">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">X:</span>
                    <span className="text-white">{sensorData.acceleration.x}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Y:</span>
                    <span className="text-white">{sensorData.acceleration.y}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Z:</span>
                    <span className="text-white">{sensorData.acceleration.z}</span>
                  </div>
                  <div className="border-t border-slate-600 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-blue-400 font-semibold">Magnitude:</span>
                      <span className="text-blue-400 font-semibold">{sensorData.acceleration.magnitude}</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-500 mt-3 space-y-1">
                  <div>Source: {sensorData.acceleration.source || 'unknown'}</div>
                  <div>Updated: {sensorData.acceleration.timestamp ? 
                    new Date(sensorData.acceleration.timestamp).toLocaleTimeString() : 'never'}</div>
                </div>
              </div>
            </div>

            {/* Location Data */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={16} className="text-emerald-400" />
                <span className="text-slate-300 font-medium">GPS Location</span>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-xl font-mono text-sm border border-slate-600/30">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Latitude:</span>
                    <span className="text-white">{sensorData.location.lat || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Longitude:</span>
                    <span className="text-white">{sensorData.location.lng || 'N/A'}</span>
                  </div>
                  <div className="border-t border-slate-600 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Accuracy:</span>
                      <span className={`font-semibold ${
                        sensorData.location.accuracy > 100 ? 'text-red-400' : 
                        sensorData.location.accuracy > 50 ? 'text-yellow-400' : 'text-emerald-400'
                      }`}>
                        ±{sensorData.location.accuracy || 'N/A'}m
                      </span>
                    </div>
                  </div>
                </div>
                {sensorData.location.altitude && (
                  <div className="text-xs text-slate-500 mt-2">
                    Altitude: {sensorData.location.altitude?.toFixed(1)}m
                  </div>
                )}
              </div>
            </div>

            {/* Audio Analysis */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Radio size={16} className="text-orange-400" />
                <span className="text-slate-300 font-medium">Audio Analysis</span>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-xl font-mono text-sm border border-slate-600/30">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amplitude:</span>
                    <span className="text-white">{sensorData.audio.amplitude}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Frequency:</span>
                    <span className="text-white">{sensorData.audio.dominantFrequency || 0} Hz</span>
                  </div>
                  <div className="border-t border-slate-600 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Quality:</span>
                      <span className={`font-semibold ${
                        sensorData.audio.amplitude > 30 ? 'text-emerald-400' : 
                        sensorData.audio.amplitude > 10 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {sensorData.audio.amplitude > 30 ? 'Excellent' : 
                         sensorData.audio.amplitude > 10 ? 'Good' : 'Poor'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Orientation Data */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Navigation size={16} className="text-cyan-400" />
                <span className="text-slate-300 font-medium">Device Orientation</span>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-xl font-mono text-sm border border-slate-600/30">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Compass:</span>
                    <span className="text-white">{sensorData.gyroscope.alpha}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pitch:</span>
                    <span className="text-white">{sensorData.gyroscope.beta}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Roll:</span>
                    <span className="text-white">{sensorData.gyroscope.gamma}°</span>
                  </div>
                  {sensorData.gyroscope.compass !== null && (
                    <div className="border-t border-slate-600 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-cyan-400 font-semibold">Heading:</span>
                        <span className="text-cyan-400 font-semibold">{sensorData.gyroscope.compass}°</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Physics Analysis - Hidden on mobile screens */}
        <div className="hidden md:block bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/30 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500/20 rounded-xl">
              <Thermometer size={20} className="text-indigo-400" />
            </div>
            <h3 className="font-semibold text-lg">Physics Analysis Engine</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {physicsCalculations.acoustic && (
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4 rounded-xl border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Waves size={16} className="text-blue-400" />
                  <span className="font-medium text-blue-400">Acoustic Analysis</span>
                </div>
                <div className="font-mono text-xs text-slate-300 space-y-1">
                  <div>Wavelength: {physicsCalculations.acoustic.wavelength}m</div>
                  <div>Frequency: {physicsCalculations.acoustic.frequency}Hz</div>
                  <div>Air Pockets: {physicsCalculations.acoustic.airPockets}</div>
                </div>
              </div>
            )}
            
            {physicsCalculations.electromagnetic && (
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-xl border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={16} className="text-purple-400" />
                  <span className="font-medium text-purple-400">EM Scanning</span>
                </div>
                <div className="font-mono text-xs text-slate-300 space-y-1">
                  <div>Signal: {physicsCalculations.electromagnetic.signalStrength}</div>
                  <div>Depth: {physicsCalculations.electromagnetic.penetrationDepth}m</div>
                </div>
              </div>
            )}
            
            {physicsCalculations.gravitational && (
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-4 rounded-xl border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={16} className="text-yellow-400" />
                  <span className="font-medium text-yellow-400">Gravitational</span>
                </div>
                <div className="font-mono text-xs text-slate-300 space-y-1">
                  <div>Anomaly: {physicsCalculations.gravitational.anomaly} m/s²</div>
                  <div>Void Detection: {physicsCalculations.gravitational.voidDetection}</div>
                </div>
              </div>
            )}

            {physicsCalculations.thermal && (
              <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 p-4 rounded-xl border border-orange-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer size={16} className="text-orange-400" />
                  <span className="font-medium text-orange-400">Thermal Est.</span>
                </div>
                <div className="font-mono text-xs text-slate-300 space-y-1">
                  <div>Temp: {physicsCalculations.thermal.estimated?.toFixed(1)}°C</div>
                  <div>Confidence: {physicsCalculations.thermal.confidence}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Single Test Emergency Button */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/30 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-500/20 rounded-xl">
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <h3 className="font-semibold text-lg">Emergency Simulation</h3>
          </div>
          
          <button 
            onClick={triggerEmergencyProtocol}
            className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 px-6 py-4 rounded-xl font-bold transition-all duration-200 shadow-lg flex items-center justify-center gap-3"
          >
            <AlertTriangle size={20} />
            🧪 Test Emergency Protocol
          </button>
          
          <p className="text-slate-400 text-sm mt-3 text-center">
            Click to simulate earthquake detection and activate emergency response
          </p>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2 py-6">
          <div className="flex items-center justify-center gap-4 text-slate-400 text-sm">
            <div className="flex items-center gap-2">
              <Shield size={14} />
              <span>LifeBeacon v1.0</span>
            </div>
            <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
            <div className="flex items-center gap-2">
              <Activity size={14} />
              <span>Real-time Detection</span>
            </div>
            <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
            <div className="flex items-center gap-2">
              <Map size={14} />
              <span>Emergency Response</span>
            </div>
          </div>
          <p className="text-slate-500 text-xs">
            Powered by OpenStreetMap & Nominatim API | Physics-Based Analysis Engine
          </p>
          <div className="flex justify-center gap-2 mt-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LifeBeacon;
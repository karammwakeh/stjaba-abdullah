import React, { useEffect, useRef, useState } from 'react'

export default function MapDisplay({ 
  incidents = [], 
  vehicles = [], 
  selectedIncidentLocation, 
  selectedVehicleLocation, 
  onMapClick 
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef({ incidents: {}, vehicles: {} })
  const routesRef = useRef([])
  const [routingActive, setRoutingActive] = useState(false)

  const CENTER = [30.0635840, 31.4889939]
  const ZOOM = 15

  // Convert normalized coords to lat/lng
  const normToLatLng = (norm) => {
    if (!norm || norm.x === undefined || norm.y === undefined) return null
    const latOffset = (0.5 - norm.y) * 0.1
    const lngOffset = (norm.x - 0.5) * 0.1
    return [CENTER[0] + latOffset, CENTER[1] + lngOffset]
  }

  // Convert lat/lng to normalized coords
  const latLngToNorm = (lat, lng) => {
    const latOffset = lat - CENTER[0]
    const lngOffset = lng - CENTER[1]
    const x = 0.5 + (lngOffset / 0.1)
    const y = 0.5 - (latOffset / 0.1)
    return { 
      x: parseFloat(Math.max(0, Math.min(1, x)).toFixed(4)), 
      y: parseFloat(Math.max(0, Math.min(1, y)).toFixed(4)) 
    }
  }

  // Custom icon for incidents (red warning triangle with centered exclamation mark)
  const createIncidentIcon = () => {
    if (!window.L) return null
    return window.L.divIcon({
      html: `
        <div style="
          position: relative;
          width: 24px;
          height: 24px;
          display: flex;
          justify-content: center;
          align-items: center;
        ">
          <div style="
            width: 0;
            height: 0;
            border-left: 12px solid transparent;
            border-right: 12px solid transparent;
            border-bottom: 20px solid #dc2626;
            position: absolute;
            top: 0;
            left: 0;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          "></div>
          <div style="
            position: absolute;
            top: 3px;
            color: white;
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            width: 24px;
            left: 0;
          ">
            !
          </div>
        </div>
      `,
      className: 'incident-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 24]
    })
  }

  // Custom icon for vehicles (car icon)
  const createVehicleIcon = () => {
    if (!window.L) return null
    return window.L.divIcon({
      html: `
        <div style="
          position: relative;
          width: 24px;
          height: 24px;
          display: flex;
          justify-content: center;
          align-items: center;
        ">
          <div style="
            width: 22px;
            height: 22px;
            background: #3b82f6;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            justify-content: center;
            align-items: center;
          ">
            <div style="
              color: white;
              font-size: 12px;
              font-weight: bold;
              transform: translateY(0px);
            ">
              🚗
            </div>
          </div>
        </div>
      `,
      className: 'vehicle-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    })
  }

  // Draw route from vehicle to incident using OSRM API
  const drawRoute = (fromLatLng, toLatLng, color = '#3b82f6', vehicleName = '') => {
    if (!window.L || !mapInstanceRef.current) return null
    
    const L = window.L
    const map = mapInstanceRef.current
    
    // OSRM API endpoint for routing
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromLatLng[1]},${fromLatLng[0]};${toLatLng[1]},${toLatLng[0]}?overview=full&geometries=geojson`
    
    let routeLine = null
    let distanceLabel = null
    
    fetch(osrmUrl)
      .then(response => response.json())
      .then(data => {
        if (data.code === 'Ok') {
          const route = data.routes[0]
          const routeCoordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]])
          
          // Create a polyline for the route
          routeLine = L.polyline(routeCoordinates, {
            color: color,
            weight: 4,
            opacity: 0.7,
            dashArray: '10, 10',
            lineCap: 'round'
          }).addTo(map)
          
          // Add distance and duration info
          const distanceKm = (route.distance / 1000).toFixed(2)
          const durationMinutes = Math.ceil(route.duration / 60)
          
          // Add a popup at the start of the route
          distanceLabel = L.marker(fromLatLng, {
            icon: L.divIcon({
              html: `
                <div style="
                  background: white;
                  border: 2px solid ${color};
                  border-radius: 4px;
                  padding: 2px 6px;
                  font-size: 11px;
                  font-weight: bold;
                  color: ${color};
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                ">
                  ${distanceKm} km
                </div>
              `,
              className: 'route-label',
              iconSize: [60, 20],
              iconAnchor: [30, 10]
            })
          }).addTo(map)
          
          // Store route for cleanup
          routesRef.current.push({ route: routeLine, label: distanceLabel })
          
          console.log(`Route from vehicle to incident: ${distanceKm} km, ${durationMinutes} min`)
        } else {
          console.warn('No route found between points')
          // Draw a straight line if no route found
          routeLine = L.polyline([fromLatLng, toLatLng], {
            color: '#94a3b8',
            weight: 2,
            opacity: 0.5,
            dashArray: '5, 5'
          }).addTo(map)
          routesRef.current.push({ route: routeLine, label: null })
        }
      })
      .catch(error => {
        console.error('Error fetching route:', error)
        // Draw a straight line as fallback
        routeLine = L.polyline([fromLatLng, toLatLng], {
          color: '#94a3b8',
          weight: 2,
          opacity: 0.5,
          dashArray: '5, 5'
        }).addTo(map)
        routesRef.current.push({ route: routeLine, label: null })
      })
  }

  // Clear all routes
  const clearRoutes = () => {
    routesRef.current.forEach(routeItem => {
      if (routeItem.route && routeItem.route.remove) routeItem.route.remove()
      if (routeItem.label && routeItem.label.remove) routeItem.label.remove()
    })
    routesRef.current = []
  }

  // Draw routes from all vehicles to all pending incidents
  const drawAllRoutes = () => {
    if (!routingActive) return
    
    const pendingIncidents = incidents.filter(i => i.status === 'pending')
    
    pendingIncidents.forEach(incident => {
      const incidentLatLng = normToLatLng(incident.location)
      if (!incidentLatLng) return
      
      vehicles.forEach(vehicle => {
        const vehicleLatLng = normToLatLng(vehicle.location)
        if (!vehicleLatLng) return
        
        // Use different colors for different vehicles
        const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']
        const color = colors[vehicle.id % colors.length]
        
        drawRoute(vehicleLatLng, incidentLatLng, color, vehicle.name)
      })
    })
  }

  // Draw route from selected vehicle to selected incident
  const drawSelectedRoute = () => {
    if (!selectedVehicleLocation || !selectedIncidentLocation) return
    
    const vehicleLatLng = normToLatLng(selectedVehicleLocation)
    const incidentLatLng = normToLatLng(selectedIncidentLocation)
    
    if (vehicleLatLng && incidentLatLng) {
      drawRoute(vehicleLatLng, incidentLatLng, '#10b981', 'Selected')
    }
  }

  // Reset map to default view
  const resetMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(CENTER, ZOOM)
      // Clear all routes and reset routing state
      clearRoutes()
      setRoutingActive(false)
      console.log('Map reset to default view')
    }
  }

  // Initialize map
  useEffect(() => {
    // Check if Leaflet is already loaded
    if (window.L && window.L.map) {
      initMap()
    } else {
      // Load Leaflet CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
        link.crossOrigin = ''
        document.head.appendChild(link)
      }

      // Load Leaflet JS
      if (!window.L) {
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
        script.crossOrigin = ''
        script.onload = () => {
          console.log('Leaflet loaded successfully')
          initMap()
        }
        script.onerror = () => {
          console.error('Failed to load Leaflet')
        }
        document.head.appendChild(script)
      }
    }

    function initMap() {
      if (!mapRef.current || mapInstanceRef.current) return
      
      try {
        const L = window.L
        const map = L.map(mapRef.current).setView(CENTER, ZOOM)
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors | Routing: OSRM',
          maxZoom: 19
        }).addTo(map)

        // Click handler
        map.on('click', (e) => {
          const norm = latLngToNorm(e.latlng.lat, e.latlng.lng)
          if (onMapClick) {
            onMapClick(norm)
          }
        })

        mapInstanceRef.current = map
        console.log('Map initialized successfully')
        
        // Force update markers after map is ready
        setTimeout(() => {
          updateMarkers()
        }, 100)
        
      } catch (error) {
        console.error('Error initializing map:', error)
      }
    }

    return () => {
      clearRoutes()
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [onMapClick])

  // Update markers function
  const updateMarkers = () => {
    if (!mapInstanceRef.current || !window.L) {
      console.log('Map not ready for markers')
      return
    }

    const L = window.L
    const map = mapInstanceRef.current
    const markers = markersRef.current

    // Clear old markers
    Object.values(markers.incidents).forEach(m => {
      if (m && m.remove) m.remove()
    })
    Object.values(markers.vehicles).forEach(m => {
      if (m && m.remove) m.remove()
    })
    markers.incidents = {}
    markers.vehicles = {}

    // Add pending incidents as red triangles
    const incidentIcon = createIncidentIcon()
    incidents.filter(i => i.status === 'pending').forEach(inc => {
      const pos = normToLatLng(inc.location)
      if (pos && incidentIcon) {
        const marker = L.marker(pos, { icon: incidentIcon }).addTo(map)
        marker.bindPopup(`
          <div style="font-weight: bold; color: #dc2626; margin-bottom: 5px;">
            🚨 Incident: ${inc.name}
          </div>
          <div style="margin-bottom: 3px;">
            <strong>Status:</strong> <span style="color: #dc2626;">${inc.status}</span>
          </div>
          <div style="font-size: 11px; color: #666;">
            Coordinates: ${inc.location.x.toFixed(3)}, ${inc.location.y.toFixed(3)}
          </div>
        `)
        markers.incidents[inc.id] = marker
      }
    })

    // Add vehicles as car icons
    const vehicleIcon = createVehicleIcon()
    vehicles.forEach(veh => {
      const pos = normToLatLng(veh.location)
      if (pos && vehicleIcon) {
        const marker = L.marker(pos, { icon: vehicleIcon }).addTo(map)
        marker.bindPopup(`
          <div style="font-weight: bold; color: #3b82f6; margin-bottom: 5px;">
            🚗 Vehicle: ${veh.name}
          </div>
          <div style="font-size: 11px; color: #666;">
            Coordinates: ${veh.location.x.toFixed(3)}, ${veh.location.y.toFixed(3)}
          </div>
        `)
        markers.vehicles[veh.id] = marker
      }
    })

    // Add selected locations
    if (selectedIncidentLocation) {
      const pos = normToLatLng(selectedIncidentLocation)
      if (pos) {
        L.circleMarker(pos, {
          radius: 8,
          fillColor: '#10b981',
          color: '#065f46',
          weight: 3,
          fillOpacity: 0.7
        }).addTo(map).bindPopup(`
          <div style="font-weight: bold; color: #10b981;">
            📍 Selected Incident Location
          </div>
          <div style="font-size: 11px;">
            Coordinates: ${selectedIncidentLocation.x.toFixed(3)}, ${selectedIncidentLocation.y.toFixed(3)}
          </div>
        `)
      }
    }

    if (selectedVehicleLocation) {
      const pos = normToLatLng(selectedVehicleLocation)
      if (pos) {
        L.circleMarker(pos, {
          radius: 8,
          fillColor: '#8b5cf6',
          color: '#5b21b6',
          weight: 3,
          fillOpacity: 0.7
        }).addTo(map).bindPopup(`
          <div style="font-weight: bold; color: #8b5cf6;">
            📍 Selected Vehicle Location
          </div>
          <div style="font-size: 11px;">
            Coordinates: ${selectedVehicleLocation.x.toFixed(3)}, ${selectedVehicleLocation.y.toFixed(3)}
          </div>
        `)
      }
    }

    // Clear existing routes before drawing new ones
    clearRoutes()

    // Draw routes if routing is active OR if we have selected locations
    if (routingActive) {
      drawAllRoutes()
    } else if (selectedVehicleLocation && selectedIncidentLocation) {
      drawSelectedRoute()
    }
  }

  // Toggle routing - this should only control ALL routes, not selected route
  const toggleRouting = () => {
    const newRoutingActive = !routingActive
    setRoutingActive(newRoutingActive)
    
    // Clear all routes when toggling off
    if (!newRoutingActive) {
      clearRoutes()
    }
  }

  // Update markers when data changes or when routingActive changes
  useEffect(() => {
    if (mapInstanceRef.current && window.L) {
      updateMarkers()
    }
  }, [incidents, vehicles, selectedIncidentLocation, selectedVehicleLocation, routingActive])

  return (
    <div className="map-container panel">
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '520px',
          minHeight: '520px'
        }}
      />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px',
        background: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        fontSize: '12px',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={toggleRouting}
            style={{
              padding: '4px 12px',
              background: routingActive ? '#ef4444' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            {routingActive ? '❌ Hide All Routes' : '🔄 Show All Routes'}
          </button>
          
          <button 
            onClick={resetMap}
            style={{
              padding: '4px 12px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>🗺️</span>
            <span>Reset Map</span>
          </button>
          
          <span style={{ fontStyle: 'italic', marginLeft: '8px' }}>
            {routingActive 
              ? 'Showing routes from all vehicles to all incidents' 
              : selectedVehicleLocation && selectedIncidentLocation
                ? 'Showing route between selected locations'
                : 'Click map to select locations'
            }
          </span>
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
          Routing: OSRM | 🚗 Vehicles: {vehicles.length} | 🚨 Incidents: {incidents.filter(i => i.status === 'pending').length}
        </div>
      </div>
    </div>
  )
}
import React, { useEffect, useState } from 'react'
import MapDisplay from './components/MapDisplay'
import IncidentPanel from './components/IncidentPanel'
import VehiclePanel from './components/VehiclePanel'
import WindDisplay from './components/WindDisplay'
import api from './services/api'

export default function App() {
  const [incidents, setIncidents] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [selectedIncidentLocation, setSelectedIncidentLocation] = useState(null)
  const [selectedVehicleLocation, setSelectedVehicleLocation] = useState(null)
  const [assignMode, setAssignMode] = useState(null) // 'incident' | 'vehicle' | null

  const refresh = async () => {
    try {
      const [incRes, vehRes] = await Promise.all([api.getIncidents(), api.getVehicles()])
      setIncidents(incRes.data)
      setVehicles(vehRes.data)
    } catch (err) {
      console.error('Error fetching data', err)
    }
  }

  const [apiTestMsg, setApiTestMsg] = useState('')

  const testBackend = async () => {
    setApiTestMsg('Testing...')
    try{
      const res = await api.getVehicles()
      setApiTestMsg('OK — received ' + (res && res.data && res.data.length) + ' vehicles')
    }catch(err){
      console.error('API test failed', err)
      // Try to surface useful info
      const msg = err?.message || (err?.response && JSON.stringify(err.response)) || 'Unknown error'
      setApiTestMsg('Failed: ' + msg)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const handleMapClick = (coords) => {
    if(assignMode === 'incident'){
      setSelectedIncidentLocation(coords)
    }else if(assignMode === 'vehicle'){
      setSelectedVehicleLocation(coords)
    }
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>S.TJaba Control Room</h1>
        <div className="header-sub">Incident & Vehicle monitoring · Wind info</div>
        <div style={{marginTop:10}}>
          <button className="btn" onClick={testBackend} style={{marginRight:8}}>Test backend</button>
          {apiTestMsg && <span style={{color: apiTestMsg.startsWith('OK') ? '#064e3b' : '#b91c1c', marginLeft:8}}>{apiTestMsg}</span>}
        </div>
      </header>

      <div className="two-column">
        <div className="left-col">
          <MapDisplay
            incidents={incidents}
            vehicles={vehicles}
            selectedIncidentLocation={selectedIncidentLocation}
            selectedVehicleLocation={selectedVehicleLocation}
            onMapClick={handleMapClick}
          />
          {assignMode && (
            <div className="assign-indicator panel" style={{marginTop:12}}>
              Assigning on map: <strong style={{marginLeft:6}}>{assignMode}</strong>
              <button className="btn" style={{marginLeft:12}} onClick={()=>{ setAssignMode(null); setSelectedIncidentLocation({x:0,y:0}); setSelectedVehicleLocation({x:0,y:0}); }}>Cancel Assign</button>
              <span style={{marginLeft:12, color:'#666'}}>Click the map to set the location (assign mode stays active).</span>
            </div>
          )}
        </div>

        <div className="right-col panels">
          <IncidentPanel
            incidents={incidents}
            selectedLocation={selectedIncidentLocation}
            onRefresh={refresh}
            onStartAssign={()=>setAssignMode('incident')}
            isAssigning={assignMode === 'incident'}
            onCreated={()=>{ setSelectedIncidentLocation(null); setAssignMode(null) }}
          />

          <VehiclePanel
            vehicles={vehicles}
            selectedLocation={selectedVehicleLocation}
            onRefresh={refresh}
            onStartAssign={()=>setAssignMode('vehicle')}
            isAssigning={assignMode === 'vehicle'}
            onCreated={()=>{ setSelectedVehicleLocation(null); setAssignMode(null) }}
          />

          <WindDisplay />
        </div>
      </div>
    </div>
  )
}

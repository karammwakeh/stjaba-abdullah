import React, { useEffect, useState } from 'react'
import api from '../services/api'

export default function WindDisplay(){
  const [wind, setWind] = useState(null)

  useEffect(()=>{
    const load = async ()=>{
      try{ const res = await api.getWindInfo(); setWind(res.data) }catch(e){ console.error(e) }
    }
    load()
    // Poll every 10 seconds
    const interval = setInterval(load, 10000)
    return ()=> clearInterval(interval)
  },[])

  if(!wind) return <div className="panel">Loading wind...</div>

  const angle = wind.flow_angle || 0

  return (
    <div className="panel wind-box">
      <div>
        <div style={{fontWeight:600}}>Wind Direction</div>
        <div>Direction: {wind.wind_deg}°</div>
        <div>Speed: {wind.speed} m/s</div>
      </div>
      <svg width="60" height="60" viewBox="0 0 60 60" style={{transform: `rotate(${angle}deg)`}}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#2b6cb0" />
          </marker>
        </defs>
        <line x1="30" y1="50" x2="30" y2="5" stroke="#2b6cb0" strokeWidth="2" markerEnd="url(#arrowhead)" />
        <circle cx="30" cy="30" r="8" fill="#2b6cb0" opacity="0.2" />
      </svg>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import api from '../services/api'

export default function IncidentPanel({ incidents = [], selectedLocation, onRefresh, onStartAssign, onCreated, isAssigning=false }){
  const [list, setList] = useState([])
  const [form, setForm] = useState({ name: '', status: 'pending', location: { x: 0, y: 0 } })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', status: 'pending', location: { x:0, y:0 } })
  const [nameError, setNameError] = useState('')
  const [editNameError, setEditNameError] = useState('')
  const [showPending, setShowPending] = useState(true)
  const [showResolved, setShowResolved] = useState(true)

  useEffect(()=> setList(incidents), [incidents])

  useEffect(()=>{
    if(selectedLocation){
      if(editingId){
        setEditForm(f => ({...f, location: selectedLocation }))
      } else {
        setForm(f => ({...f, location: selectedLocation }))
      }
    }
  },[selectedLocation])

  const create = async ()=>{
    if(!form.name || !form.name.trim()){
      setNameError('Incident name is required')
      return
    }
    try{
      await api.createIncident(form)
      setForm({ name:'', status:'pending', location:{x:0,y:0} })
      setNameError('')
      onRefresh && onRefresh()
      onCreated && onCreated()
    }catch(e){ console.error(e) }
  }

  const startEdit = (inc)=> {
    setEditingId(inc.id)
    setEditForm({ name: inc.name, status: inc.status, location: inc.location })
    setEditNameError('')
  }

  const saveEdit = async (id)=>{
    if(!editForm.name || !editForm.name.trim()){
      setEditNameError('Incident name is required')
      return
    }
    try{
      await api.updateIncident(id, editForm)
      setEditingId(null)
      setEditNameError('')
      onRefresh && onRefresh()
    }catch(e){ console.error(e) }
  }

  const remove = async (id)=>{
    try{ await api.deleteIncident(id); onRefresh && onRefresh() }catch(e){ console.error(e) }
  }

  const pendingIncidents = list.filter(inc => inc.status === 'pending')
  const resolvedIncidents = list.filter(inc => inc.status === 'resolved')

  return (
    <div className="panel">
      <h3>Incidents</h3>

      {/* Create New Incident Form */}
      <div style={{marginBottom:'20px', paddingBottom:'15px', borderBottom:'1px solid #ddd'}}>
        <h4 style={{marginBottom:'10px', fontSize:'14px'}}>Create New</h4>
        <div style={{marginBottom:8}} className="form-row">
          <div className="form-field">
            <input className={`${'form-input'} ${nameError? 'invalid-input' : ''}`} placeholder="Name" value={form.name} onChange={e=>{ setForm({...form, name:e.target.value}); if(nameError) setNameError('') }} />
            {nameError && <div className="error-text">{nameError}</div>}
          </div>

          <span className="coords-box">x: {form.location.x.toFixed(2)} y: {form.location.y.toFixed(2)}</span>

          <div className="btn-row" style={{marginLeft:'auto'}}>
            {!isAssigning && <button className="btn secondary" onClick={()=>onStartAssign('incident')}>Assign from map</button>}
            <button className="btn primary" onClick={create}>Create</button>
          </div>
        </div>
      </div>

      {/* Pending Incidents Section */}
      <div style={{marginBottom:'20px'}}>
        <button
          onClick={()=> setShowPending(!showPending)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            color: '#dc2626',
            marginBottom: '10px',
            padding: 0
          }}
        >
          {showPending ? '▼' : '▶'} Pending ({pendingIncidents.length})
        </button>
        {showPending && (
          <div>
            {pendingIncidents.length === 0 ? (
              <p style={{color: '#999', fontSize: '13px'}}>No pending incidents</p>
            ) : (
              pendingIncidents.map(inc => (
                <div key={inc.id} className="item-row" style={{borderLeft:'4px solid #dc2626', paddingLeft:'16px'}}>
                  {editingId === inc.id ? (
                    <div style={{display:'flex', alignItems:'center', gap:8, width:'100%'}}>
                      <div className="form-field">
                        <input className={`form-input ${editNameError? 'invalid-input' : ''}`} value={editForm.name} onChange={e=>{ setEditForm({...editForm, name: e.target.value}); if(editNameError) setEditNameError('') }} />
                        {editNameError && <div className="error-text">{editNameError}</div>}
                      </div>
                      <select value={editForm.status} onChange={e=>setEditForm({...editForm, status:e.target.value})}>
                        <option value="pending">pending</option>
                        <option value="resolved">resolved</option>
                      </select>
                      <span className="coords-box">x: {editForm.location.x.toFixed(2)} y: {editForm.location.y.toFixed(2)}</span>
                      <div className="btn-row" style={{marginLeft:'auto', gap:'6px'}}>
                        {!isAssigning && <button className="btn secondary" onClick={()=>onStartAssign('incident')}>Assign</button>}
                        <button className="btn primary" onClick={()=>saveEdit(inc.id)}>Save</button>
                        <button className="btn" onClick={()=>{ setEditingId(null); setEditNameError('') }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{flex:1}}>
                        <strong>{inc.name}</strong>
                        <div className="coords-box">x: {inc.location?.x?.toFixed(2)} y: {inc.location?.y?.toFixed(2)}</div>
                      </div>
                      <button className="btn secondary" onClick={()=> startEdit(inc)}>Edit</button>
                      <button className="btn danger" onClick={()=>remove(inc.id)}>Delete</button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Resolved Incidents Section */}
      <div>
        <button
          onClick={()=> setShowResolved(!showResolved)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            color: '#16a34a',
            marginBottom: '10px',
            padding: 0
          }}
        >
          {showResolved ? '▼' : '▶'} Resolved ({resolvedIncidents.length})
        </button>
        {showResolved && (
          <div>
            {resolvedIncidents.length === 0 ? (
              <p style={{color: '#999', fontSize: '13px'}}>No resolved incidents</p>
            ) : (
              resolvedIncidents.map(inc => (
                <div key={inc.id} className="item-row" style={{borderLeft:'4px solid #16a34a', paddingLeft:'16px'}}>
                  {editingId === inc.id ? (
                    <div style={{display:'flex', alignItems:'center', gap:8, width:'100%'}}>
                      <div className="form-field">
                        <input className={`form-input ${editNameError? 'invalid-input' : ''}`} value={editForm.name} onChange={e=>{ setEditForm({...editForm, name: e.target.value}); if(editNameError) setEditNameError('') }} />
                        {editNameError && <div className="error-text">{editNameError}</div>}
                      </div>
                      <select value={editForm.status} onChange={e=>setEditForm({...editForm, status:e.target.value})}>
                        <option value="pending">pending</option>
                        <option value="resolved">resolved</option>
                      </select>
                      <span className="coords-box">x: {editForm.location.x.toFixed(2)} y: {editForm.location.y.toFixed(2)}</span>
                      <div className="btn-row" style={{marginLeft:'auto', gap:'6px'}}>
                        {!isAssigning && <button className="btn secondary" onClick={()=>onStartAssign('incident')}>Assign</button>}
                        <button className="btn primary" onClick={()=>saveEdit(inc.id)}>Save</button>
                        <button className="btn" onClick={()=>{ setEditingId(null); setEditNameError('') }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{flex:1}}>
                        <strong>{inc.name}</strong>
                        <div className="coords-box">x: {inc.location?.x?.toFixed(2)} y: {inc.location?.y?.toFixed(2)}</div>
                      </div>
                      <button className="btn secondary" onClick={()=> startEdit(inc)}>Edit</button>
                      <button className="btn danger" onClick={()=>remove(inc.id)}>Delete</button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

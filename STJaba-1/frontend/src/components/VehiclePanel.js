import React, { useEffect, useState } from 'react'
import api from '../services/api'

export default function VehiclePanel({ vehicles = [], selectedLocation, onRefresh, onStartAssign, onCreated, isAssigning=false }){
  const [list, setList] = useState([])
  const [form, setForm] = useState({ name: '', location: { x: 0, y: 0 } })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', location: { x: 0, y: 0 } })
  const [nameError, setNameError] = useState('')
  const [editNameError, setEditNameError] = useState('')
  const [creating, setCreating] = useState(false)
  const [lastMsg, setLastMsg] = useState('')

  useEffect(()=> setList(vehicles), [vehicles])

  // If the user has clicked on the map while assigning, update the form location
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
      setNameError('Vehicle name is required')
      return
    }
    setCreating(true)
    setLastMsg('Creating vehicle...')
    console.log('VehiclePanel: creating vehicle', form)
    try{
      const res = await api.createVehicle(form)
      console.log('VehiclePanel: create response', res && res.data)
      setForm({name:'', location:{x:0,y:0}})
      setNameError('')
      setLastMsg('Created vehicle id: ' + (res && res.data && res.data.id))
      onRefresh && onRefresh()
      onCreated && onCreated()
    }catch(e){
      console.error('VehiclePanel: create error', e)
      // surface an alert so the user sees immediate feedback
      try{
        const msg = e?.response?.data?.error || e.message || 'Unknown error'
        setLastMsg('Failed: ' + msg)
        alert('Failed to create vehicle: ' + msg)
      }catch(err){ console.error(err) }
    }finally{
      setCreating(false)
    }
  }

  const remove = async (id)=>{ try{ await api.deleteVehicle(id); onRefresh && onRefresh() }catch(e){ console.error(e) } }

  const startEdit = (veh)=> { setEditingId(veh.id); setEditForm({ name: veh.name, location: veh.location }); setEditNameError('') }

  const saveEdit = async (id)=>{
    if(!editForm.name || !editForm.name.trim()){
      setEditNameError('Vehicle name is required')
      return
    }
    try{ await api.updateVehicle(id, editForm); setEditingId(null); setEditNameError(''); onRefresh && onRefresh() }catch(e){ console.error(e) }
  }

  return (
    <div className="panel">
      <h3>Vehicles</h3>
      {/* Create New Vehicle Form */}
      <div style={{marginBottom:'20px', paddingBottom:'15px', borderBottom:'1px solid #e6e9ee'}}>
        <h4 style={{marginBottom:'8px', fontSize:'14px', color:'#111827'}}>Create New</h4>
        <div style={{marginBottom:8}} className="form-row">
          <div className="form-field">
            <input className={`${'form-input'} ${nameError? 'invalid-input' : ''}`} placeholder="Name" value={form.name} onChange={e=>{ setForm({...form, name:e.target.value}); if(nameError) setNameError('') }} />
            {nameError && <div className="error-text">{nameError}</div>}
          </div>

          <span className="coords-box">x: {form.location.x.toFixed(2)} y: {form.location.y.toFixed(2)}</span>

          <div className="btn-row" style={{marginLeft:'auto'}}>
            {!isAssigning && <button className="btn secondary" onClick={onStartAssign}>Assign from map</button>}
            <button className="btn primary" onClick={create} disabled={creating}>{creating ? 'Creating...' : 'Create'}</button>
          </div>
        </div>
      </div>
      {lastMsg && (
        <div style={{marginTop:8, fontSize:13, color: lastMsg.startsWith('Failed') ? '#b91c1c' : '#064e3b'}}>
          {lastMsg}
        </div>
      )}

      <div>
        {list.map((veh) => (
          <div key={veh.id} className="item-row">
            {editingId === veh.id ? (
              <>
                <div style={{display:'flex', alignItems:'center', gap:8, width:'100%'}}>
                  <div className="form-field">
                    <input className={`${'form-input'} ${editNameError? 'invalid-input' : ''}`} value={editForm.name} onChange={e=>{ setEditForm({...editForm, name: e.target.value}); if(editNameError) setEditNameError('') }} />
                    {editNameError && <div className="error-text">{editNameError}</div>}
                  </div>
                  <span className="coords-box">x: {editForm.location.x} y: {editForm.location.y}</span>
                  <div className="btn-row" style={{marginLeft:'auto'}}>
                    {!isAssigning && <button className="btn" onClick={onStartAssign}>Assign from map</button>}
                    <button className="btn primary" onClick={()=>saveEdit(veh.id)}>Save</button>
                    <button className="btn" onClick={()=>setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{flex:1}}>
                  <strong>{veh.name}</strong>
                  <div className="coords-box">x: {veh.location?.x} y: {veh.location?.y}</div>
                </div>
                <button className="btn" onClick={()=>startEdit(veh)}>Edit</button>
                <button className="btn danger" onClick={()=>remove(veh.id)}>Delete</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

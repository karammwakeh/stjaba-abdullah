import axios from 'axios'

const BASE = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:5000'

export default {
  getIncidents: () => axios.get(`${BASE}/incidents`),
  createIncident: (body) => axios.post(`${BASE}/incidents`, body),
  updateIncident: (id, body) => axios.put(`${BASE}/incidents/${id}`, body),
  deleteIncident: (id) => axios.delete(`${BASE}/incidents/${id}`),

  getVehicles: () => axios.get(`${BASE}/vehicles`),
  createVehicle: (body) => axios.post(`${BASE}/vehicles`, body),
  updateVehicle: (id, body) => axios.put(`${BASE}/vehicles/${id}`, body),
  deleteVehicle: (id) => axios.delete(`${BASE}/vehicles/${id}`),

  getWindInfo: () => axios.get(`${BASE}/wind-info`)
}

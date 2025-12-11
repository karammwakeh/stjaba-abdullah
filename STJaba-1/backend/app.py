from flask import Flask, request, jsonify
from flask_cors import CORS
from dataclasses import dataclass, asdict
from typing import List, Optional
from Utilities import Utilities

app = Flask(__name__)
CORS(app)

# Data models
@dataclass
class Location:
    x: float
    y: float

@dataclass
class Incident:
    id: int
    name: str
    status: str
    location: Location
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'status': self.status,
            'location': {'x': self.location.x, 'y': self.location.y}
        }

@dataclass
class Vehicle:
    id: int
    name: str
    location: Location
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'location': {'x': self.location.x, 'y': self.location.y}
        }

# In-memory storage
incidents: List[Incident] = []
vehicles: List[Vehicle] = []
incident_counter = 1
vehicle_counter = 1

# ========== INCIDENT ENDPOINTS ==========

@app.route('/incidents', methods=['POST'])
def create_incident():
    """Create a new incident"""
    global incident_counter
    data = request.get_json()
    
    if not data or 'name' not in data or 'status' not in data or 'location' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
    
    location = Location(
        x=data['location'].get('x', 0),
        y=data['location'].get('y', 0)
    )
    
    incident = Incident(
        id=incident_counter,
        name=data['name'],
        status=data['status'],
        location=location
    )
    
    incidents.append(incident)
    incident_counter += 1

    print(incident)
    
    return jsonify(incident.to_dict()), 201

@app.route('/incidents', methods=['GET'])
def get_incidents():
    """Get all incidents"""
    return jsonify([inc.to_dict() for inc in incidents]), 200

@app.route('/incidents/<int:id>', methods=['GET'])
def get_incident(id):
    """Get a specific incident by ID"""
    incident = next((inc for inc in incidents if inc.id == id), None)
    if incident:
        return jsonify(incident.to_dict()), 200
    return jsonify({'error': 'Incident not found'}), 404

@app.route('/incidents/<int:id>', methods=['PUT'])
def update_incident(id):
    """Update an existing incident"""
    incident = next((inc for inc in incidents if inc.id == id), None)
    
    if not incident:
        return jsonify({'error': 'Incident not found'}), 404
    
    data = request.get_json()
    
    if 'name' in data:
        incident.name = data['name']
    if 'status' in data:
        incident.status = data['status']
    if 'location' in data:
        incident.location.x = data['location'].get('x', incident.location.x)
        incident.location.y = data['location'].get('y', incident.location.y)
    
    return jsonify(incident.to_dict()), 200

@app.route('/incidents/<int:id>', methods=['DELETE'])
def delete_incident(id):
    """Delete an incident"""
    global incidents
    incident = next((inc for inc in incidents if inc.id == id), None)
    
    if not incident:
        return jsonify({'error': 'Incident not found'}), 404
    
    incidents = [inc for inc in incidents if inc.id != id]
    return jsonify({'message': 'Incident deleted successfully'}), 200

# ========== VEHICLE ENDPOINTS ==========

@app.route('/vehicles', methods=['POST'])
def create_vehicle():
    """Create a new vehicle"""
    global vehicle_counter
    data = request.get_json()
    
    if not data or 'name' not in data or 'location' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
    
    location = Location(
        x=data['location'].get('x', 0),
        y=data['location'].get('y', 0)
    )
    
    vehicle = Vehicle(
        id=vehicle_counter,
        name=data['name'],
        location=location
    )
    
    vehicles.append(vehicle)
    vehicle_counter += 1
    
    return jsonify(vehicle.to_dict()), 201

@app.route('/vehicles', methods=['GET'])
def get_vehicles():
    """Get all vehicles"""
    return jsonify([veh.to_dict() for veh in vehicles]), 200

@app.route('/vehicles/<int:id>', methods=['GET'])
def get_vehicle(id):
    """Get a specific vehicle by ID"""
    vehicle = next((veh for veh in vehicles if veh.id == id), None)
    if vehicle:
        return jsonify(vehicle.to_dict()), 200
    return jsonify({'error': 'Vehicle not found'}), 404

@app.route('/vehicles/<int:id>', methods=['PUT'])
def update_vehicle(id):
    """Update an existing vehicle"""
    vehicle = next((veh for veh in vehicles if veh.id == id), None)
    
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
    
    data = request.get_json()
    
    if 'name' in data:
        vehicle.name = data['name']
    if 'location' in data:
        vehicle.location.x = data['location'].get('x', vehicle.location.x)
        vehicle.location.y = data['location'].get('y', vehicle.location.y)
    
    return jsonify(vehicle.to_dict()), 200

@app.route('/vehicles/<int:id>', methods=['DELETE'])
def delete_vehicle(id):
    """Delete a vehicle"""
    global vehicles
    vehicle = next((veh for veh in vehicles if veh.id == id), None)
    
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
    
    vehicles = [veh for veh in vehicles if veh.id != id]
    return jsonify({'message': 'Vehicle deleted successfully'}), 200

@app.route('/wind-info', methods=['GET'])
def get_pending_incidents():
    """Get wind information"""
    # Get wind direction info
    wind_info = Utilities.wind_info()
    
    return jsonify(wind_info), 200

if __name__ == '__main__':
    app.run(debug=True)
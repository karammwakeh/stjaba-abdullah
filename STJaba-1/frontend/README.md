# frontend2

Minimal React frontend for STJaba to interact with backend endpoints (`/incidents`, `/vehicles`, `/wind-info`).

Quick start

1. Place your `map.png` file into `frontend2/public/map.png` (recommended same aspect ratio as your backend map).
2. Install dependencies and start:

```bash
cd frontend
npm install
npm start
```

Notes
- The app expects the backend at `http://127.0.0.1:5000`. If your backend runs elsewhere, set `REACT_APP_API_BASE` before starting, e.g.: `REACT_APP_API_BASE=http://localhost:5000 npm start`.
- If you see CORS errors, enable CORS in your Flask backend (e.g. `pip install flask-cors` and add `CORS(app)`).
- Clicking the map will produce normalized coordinates (x, y in [0..1]) used when creating incidents. If your backend expects pixel coordinates, adapt mapping accordingly.

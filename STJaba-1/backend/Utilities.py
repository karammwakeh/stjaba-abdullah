import numpy as np
import cv2
import requests

class Utilities:

    @staticmethod
    def load_map():
        """
        Loads the factory map from an image/file and returns:
        - processed map image (for UI)
        - 2D grid representation (for pathfinding)
        """

        try:
            grid_map = np.load("array.npy")          # Load from file: shape e.g. (500, 500)
            img = grid_map / np.max(grid_map)       # Normalize to [0,1] for matplotlib
            
            return img, grid_map

        except FileNotFoundError:
            raise FileNotFoundError(f"Map file not found.")
    
    @staticmethod
    def wind_info(lat=27.059718, lon=49.564937):
        """
        Retrieves wind speed + direction from Open-Meteo API
        Returns a normalized vector (dx, dy)
        """
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}&current_weather=true"
        )

        try:
            response = requests.get(url, timeout=5)  # timeout in seconds
            data = response.json()

            wind_deg = data["current_weather"]["winddirection"]   # degrees
            wind_speed = data["current_weather"]["windspeed"]      # m/s

            # Convert meteorological direction ---> movement direction
            flow_angle = (wind_deg + 180) % 360

            dx = np.cos(np.radians(flow_angle))
            dy = np.sin(np.radians(flow_angle))

            # Normalize
            magnitude = np.sqrt(dx*dx + dy*dy)
            dx /= magnitude
            dy /= magnitude

            return {
                "wind_deg": wind_deg,
                "flow_angle": flow_angle,
                "speed": wind_speed,
                "vector": (dx, dy)
            }

        except Exception as e:
            print("Error fetching wind data:", e)
            # Fallback dummy wind
            return {
                "wind_deg": 0,
                "flow_angle": 180,
                "speed": 0,
                "vector": (0, -1)
            }

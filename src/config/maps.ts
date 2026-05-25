import logger from "../utils/logger";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface DistanceMatrixResult {
  distanceText: string;
  distanceValue: number; // in meters
  durationText: string;
  durationValue: number; // in seconds
}

class GoogleMapsClient {
  private apiKey: string;

  constructor() {
    this.apiKey = GOOGLE_MAPS_API_KEY;
    if (!this.apiKey && process.env.NODE_ENV !== "test") {
      logger.warn("GOOGLE_MAPS_API_KEY is not defined in environment variables");
    }
  }

  /**
   * Calculate distance and ETA between origins and destinations using Distance Matrix API
   */
  async getDistanceAndDuration(
    origin: LatLng,
    destinations: LatLng[]
  ): Promise<DistanceMatrixResult[]> {
    if (!this.apiKey) {
      // Mock for development if key is missing
      logger.warn("Mocking Google Maps API response (API key missing)");
      return destinations.map((dest) => {
        // Calculate a simple mock straight-line distance
        const distance = this.calculateDistanceMock(origin, dest);
        const duration = Math.round((distance / 30000) * 3600); // 30 km/h avg speed
        return {
          distanceText: `${(distance / 1000).toFixed(1)} km`,
          distanceValue: distance,
          durationText: `${Math.round(duration / 60)} mins`,
          durationValue: duration,
        };
      });
    }

    try {
      const originsParam = `${origin.lat},${origin.lng}`;
      const destinationsParam = destinations
        .map((dest) => `${dest.lat},${dest.lng}`)
        .join("|");

      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsParam}&destinations=${destinationsParam}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data: any = await response.json();

      if (data.status !== "OK") {
        throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || ""}`);
      }

      const results: DistanceMatrixResult[] = [];
      const rows = data.rows[0];

      if (rows && rows.elements) {
        for (let i = 0; i < rows.elements.length; i++) {
          const element = rows.elements[i];
          if (element.status === "OK") {
            results.push({
              distanceText: element.distance.text,
              distanceValue: element.distance.value,
              durationText: element.duration.text,
              durationValue: element.duration.value,
            });
          } else {
            // Fallback to straight line calculation if routing fails
            const fallbackDist = this.calculateDistanceMock(origin, destinations[i]!);
            const fallbackDur = Math.round((fallbackDist / 30000) * 3600);
            results.push({
              distanceText: `${(fallbackDist / 1000).toFixed(1)} km (est)`,
              distanceValue: fallbackDist,
              durationText: `${Math.round(fallbackDur / 60)} mins`,
              durationValue: fallbackDur,
            });
          }
        }
      }

      return results;
    } catch (error) {
      logger.error("Error fetching from Google Maps Distance Matrix:", error);
      // Return fallback estimations
      return destinations.map((dest) => {
        const distance = this.calculateDistanceMock(origin, dest);
        const duration = Math.round((distance / 30000) * 3600);
        return {
          distanceText: `${(distance / 1000).toFixed(1)} km (est)`,
          distanceValue: distance,
          durationText: `${Math.round(duration / 60)} mins`,
          durationValue: duration,
        };
      });
    }
  }

  /**
   * Helper to calculate simple Haversine distance (mocking routing)
   */
  private calculateDistanceMock(coord1: LatLng, coord2: LatLng): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (coord1.lat * Math.PI) / 180;
    const phi2 = (coord2.lat * Math.PI) / 180;
    const deltaPhi = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const deltaLambda = ((coord2.lng - coord1.lng) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c); // Distance in meters
  }
}

export const mapsClient = new GoogleMapsClient();
export default mapsClient;

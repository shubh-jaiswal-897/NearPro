import { Request, Response, NextFunction } from "express";
import CityService from "./city.service";

export class CityController {
  /**
   * POST /api/cities
   */
  static async createCity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const city = await CityService.createCity(req.body);
      res.status(201).json({
        status: "success",
        message: "City geofence configured successfully",
        data: { city },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/cities
   */
  static async getCities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cities = await CityService.getActiveCities();
      res.status(200).json({
        status: "success",
        data: { cities },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/cities/check-geofence
   */
  static async checkGeofence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);

      if (isNaN(lat) || isNaN(lng)) {
        res.status(400).json({
          status: "error",
          message: "Coordinates lat and lng are required and must be numbers",
        });
        return;
      }

      const city = await CityService.findCityByCoordinates(lat, lng);
      
      if (!city) {
        res.status(404).json({
          status: "success",
          inCoverage: false,
          message: "Location is outside operational service coverage zones",
        });
        return;
      }

      res.status(200).json({
        status: "success",
        inCoverage: true,
        data: { city },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default CityController;

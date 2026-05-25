import { Request, Response, NextFunction } from "express";
import ServiceCatalogService from "./service.service";

export class ServiceCatalogController {
  /**
   * POST /api/services/categories
   */
  static async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await ServiceCatalogService.createCategory(req.body);
      res.status(201).json({
        status: "success",
        message: "Service category created successfully",
        data: { category },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/services/categories
   */
  static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await ServiceCatalogService.getCategories();
      res.status(200).json({
        status: "success",
        data: { categories },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/services
   */
  static async createService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = await ServiceCatalogService.createService(req.body);
      res.status(201).json({
        status: "success",
        message: "Service created successfully",
        data: { service },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/services/category/:categoryId
   */
  static async getServices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { categoryId } = req.params;
      const cityId = req.query.cityId as string | undefined;

      if (!categoryId) {
        res.status(400).json({
          status: "error",
          message: "Category ID is required",
        });
        return;
      }

      const services = await ServiceCatalogService.getServicesByCategory(categoryId, cityId);
      res.status(200).json({
        status: "success",
        data: { services },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/services/pricing
   */
  static async setPricing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pricing = await ServiceCatalogService.setCityPricing(req.body);
      res.status(200).json({
        status: "success",
        message: "City service pricing rules configured successfully",
        data: { pricing },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/services/pricing/check
   */
  static async getPricing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cityId = req.query.cityId as string;
      const serviceId = req.query.serviceId as string;

      if (!cityId || !serviceId) {
        res.status(400).json({
          status: "error",
          message: "Both cityId and serviceId are required query parameters",
        });
        return;
      }

      const pricing = await ServiceCatalogService.getCityPricing(cityId, serviceId);
      res.status(200).json({
        status: "success",
        data: { pricing },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ServiceCatalogController;

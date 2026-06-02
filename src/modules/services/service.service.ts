import prisma from "../../config/database";

export class ServiceCatalogService {
  /**
   * Create a new service category
   */
  static async createCategory(data: any) {
    return prisma.serviceCategory.create({
      data,
    });
  }

  /**
   * Get all active service categories
   */
  static async getCategories() {
    return prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Create a new service under a category
   */
  static async createService(data: any) {
    return prisma.service.create({
      data,
    });
  }

  /**
   * Get all active services in a category, including pricing for a specific city if cityId is provided
   */
  static async getServicesByCategory(categoryId: string, cityId?: string) {
    const services = await prisma.service.findMany({
      where: {
        categoryId,
        isActive: true,
      },
      include: {
        pricings: cityId
          ? {
              where: { cityId },
            }
          : false,
      },
      orderBy: { name: "asc" },
    });

    // Format output to merge city-specific pricing directly to the service item
    return services.map((service) => {
      const pricing = service.pricings?.[0] || null;
      const { pricings: _, ...serviceData } = service;
      return {
        ...serviceData,
        pricing: pricing
          ? {
              basePrice: Number(pricing.basePrice),
              pricePerKm: Number(pricing.pricePerKm),
              pricePerMinute: Number(pricing.pricePerMinute),
              minimumPrice: Number(pricing.minimumPrice),
              platformFee: Number(pricing.platformFee),
            }
          : null,
      };
    });
  }

  /**
   * Set city-specific pricing rules for a service
   */
  static async setCityPricing(data: any) {
    const { cityId, serviceId, basePrice, pricePerKm, pricePerMinute, minimumPrice, platformFee } = data;

    return prisma.cityServicePricing.upsert({
      where: {
        cityId_serviceId: {
          cityId,
          serviceId,
        },
      },
      update: {
        basePrice,
        pricePerKm,
        pricePerMinute,
        minimumPrice,
        platformFee,
      },
      create: {
        cityId,
        serviceId,
        basePrice,
        pricePerKm,
        pricePerMinute,
        minimumPrice,
        platformFee,
      },
    });
  }

  /**
   * Retrieve city-specific pricing rules
   */
  static async getCityPricing(cityId: string, serviceId: string) {
    const pricing = await prisma.cityServicePricing.findUnique({
      where: {
        cityId_serviceId: {
          cityId,
          serviceId,
        },
      },
    });

    if (!pricing) {
      const error: any = new Error("Pricing structure is not defined for this service in the selected city");
      error.statusCode = 404;
      throw error;
    }

    return {
      id: pricing.id,
      cityId: pricing.cityId,
      serviceId: pricing.serviceId,
      basePrice: Number(pricing.basePrice),
      pricePerKm: Number(pricing.pricePerKm),
      pricePerMinute: Number(pricing.pricePerMinute),
      minimumPrice: Number(pricing.minimumPrice),
      platformFee: Number(pricing.platformFee),
    };
  }

  /**
   * ADMIN: List all categories (active + inactive)
   */
  static async listAllCategories() {
    return prisma.serviceCategory.findMany({
      orderBy: { name: "asc" },
    });
  }

  /**
   * ADMIN: List all services across all categories with pricing
   */
  static async listAllServices() {
    const services = await prisma.service.findMany({
      include: {
        category: true,
        pricings: true,
      },
      orderBy: { name: "asc" },
    });

    return services.map((s) => {
      const pricing = s.pricings?.[0] || null;
      return {
        id: s.id,
        categoryId: s.categoryId,
        category: s.category.name,
        name: s.name,
        description: s.description,
        priceType: s.priceType,
        active: s.isActive,
        basePrice: pricing ? Number(pricing.basePrice) : 0,
      };
    });
  }

  /**
   * ADMIN: Create new service and configure default city pricing
   */
  static async createServiceAdmin(data: {
    name: string;
    categoryId: string;
    basePrice: number;
    description?: string;
  }) {
    const { name, categoryId, basePrice, description } = data;

    // Find the first operational city to seed price rules
    const city = await prisma.city.findFirst({
      where: { isActive: true },
    });

    if (!city) {
      throw new Error("No active cities configured. Please configure an operational city first.");
    }

    const service = await prisma.service.create({
      data: {
        categoryId,
        name,
        description: description || "",
        priceType: "HOURLY",
        isActive: true,
      },
    });

    // Create pricing for that city
    await prisma.cityServicePricing.create({
      data: {
        cityId: city.id,
        serviceId: service.id,
        basePrice,
        pricePerKm: 10.0,
        pricePerMinute: 2.0,
        minimumPrice: basePrice,
        platformFee: 15.0, // Default platform commission
      },
    });

    return service;
  }

  /**
   * ADMIN: Toggle service active/inactive status
   */
  static async toggleServiceActive(serviceId: string) {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      throw new Error("Service not found");
    }

    return prisma.service.update({
      where: { id: serviceId },
      data: { isActive: !service.isActive },
    });
  }

  /**
   * ADMIN: Delete service (deactivates if bookings exist)
   */
  static async deleteServiceAdmin(serviceId: string) {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      throw new Error("Service not found");
    }

    // Check for existing bookings
    const bookingsCount = await prisma.booking.count({ where: { serviceId } });
    if (bookingsCount > 0) {
      // Soft-disable instead
      await prisma.service.update({
        where: { id: serviceId },
        data: { isActive: false },
      });
      return { message: "Service has historical bookings. Deactivated instead of deleted.", deactivated: true };
    }

    // Direct deletion
    await prisma.cityServicePricing.deleteMany({ where: { serviceId } });
    await prisma.service.delete({ where: { id: serviceId } });
    return { message: "Service deleted successfully", deactivated: false };
  }
}

export default ServiceCatalogService;

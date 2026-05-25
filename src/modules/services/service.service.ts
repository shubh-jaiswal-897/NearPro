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
}

export default ServiceCatalogService;

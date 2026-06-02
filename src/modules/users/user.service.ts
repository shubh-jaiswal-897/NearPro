import prisma from "../../config/database";

export class UserService {
  /**
   * List all users with profiles (Customer or Worker)
   */
  static async listAllUsers() {
    return prisma.user.findMany({
      include: {
        customerProfile: true,
        workerProfile: {
          include: {
            city: { select: { name: true } },
            serviceCategory: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  /**
   * Toggle the active status (block/unblock) of a user
   */
  static async toggleUserActive(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const error: any = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    return prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive }
    });
  }

  /**
   * Delete a user from the local DB and Supabase Auth
   */
  static async deleteUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const error: any = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    // Delete user from local database (cascade deletes CustomerProfile / WorkerProfile)
    await prisma.user.delete({ where: { id: userId } });

    // Delete from Supabase auth if not in mock auth mode
    try {
      const isMockAuth = process.env.SUPABASE_SERVICE_ROLE_KEY === "your-service-role-key-here" || !process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!isMockAuth) {
        const supabase = (await import("../../config/supabase")).default;
        await supabase.auth.admin.deleteUser(userId);
      }
    } catch (err) {
      console.error(`Failed to delete user ${userId} from Supabase Auth:`, err);
    }

    return { message: "User deleted successfully" };
  }
}

export default UserService;

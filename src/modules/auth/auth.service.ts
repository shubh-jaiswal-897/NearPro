import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../../config/database";
import { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-production-123456";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export class AuthService {
  /**
   * Register a new user (Customer or Worker)
   */
  static async register(data: any) {
    const {
      email,
      password,
      phoneNumber,
      firstName,
      lastName,
      role,
      profilePictureUrl,
      cityId,
      serviceCategoryId,
      verificationDocUrl,
    } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phoneNumber }],
      },
    });

    if (existingUser) {
      const error: any = new Error("User with this email or phone number already exists");
      error.statusCode = 400;
      throw error;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user and associated profile in transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          phoneNumber,
          passwordHash,
          firstName,
          lastName,
          role,
          profilePictureUrl,
        },
      });

      if (role === Role.CUSTOMER) {
        await tx.customerProfile.create({
          data: {
            userId: user.id,
          },
        });
      } else if (role === Role.WORKER) {
        await tx.workerProfile.create({
          data: {
            userId: user.id,
            cityId: cityId!,
            serviceCategoryId: serviceCategoryId!,
            verificationDocUrl,
          },
        });
      }

      return user;
    });

    // Generate JWT
    const token = this.generateToken(newUser.id, newUser.email, newUser.role);

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Login user
   */
  static async login(data: any) {
    const { email, password, fcmToken } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        customerProfile: true,
        workerProfile: true,
      },
    });

    if (!user || !user.isActive) {
      const error: any = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      const error: any = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    // Update FCM token if provided
    if (fcmToken) {
      await prisma.user.update({
        where: { id: user.id },
        data: { fcmToken },
      });
    }

    // Generate JWT
    const token = this.generateToken(user.id, user.email, user.role);

    // Remove password hash
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Helper to generate JWT token
   */
  private static generateToken(id: string, email: string, role: Role): string {
    return jwt.sign({ id, email, role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }
}

export default AuthService;

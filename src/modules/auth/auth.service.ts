import prisma from "../../config/database";
import supabase from "../../config/supabase";
import { Role } from "@prisma/client";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-production-123456";

export class AuthService {
  /**
   * Register a new user (Customer or Worker) via Supabase Auth.
   * 1. Creates the Supabase Auth user (handles password hashing).
   * 2. Creates the local Prisma User + profile record linked by Supabase UID.
   */
  static async register(data: any) {
    const {
      email,
      password,
      phoneNumber,
      firstName,
      lastName,
      role = Role.CUSTOMER,
      profilePictureUrl,
      cityId,
      serviceCategoryId,
      verificationDocUrl,
      aadhaarNumber,
    } = data;

    // Step 1: Check if phone number is already taken (Supabase only deduplicates by email)
    const existingPhone = await prisma.user.findUnique({ where: { phoneNumber } });
    if (existingPhone) {
      const error: any = new Error("User with this phone number already exists");
      error.statusCode = 400;
      throw error;
    }

    let supabaseUid = `mock-uuid-${Date.now()}`;
    const isMockAuth = process.env.SUPABASE_SERVICE_ROLE_KEY === "your-service-role-key-here" || !process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!isMockAuth) {
      // Step 2: Create user in Supabase Auth (admin API — bypasses email confirmation)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm so user can log in immediately
        user_metadata: {
          firstName,
          lastName,
          phoneNumber,
          role,
        },
      });

      if (authError || !authData.user) {
        const error: any = new Error(authError?.message || "Failed to create auth user");
        error.statusCode = 400;
        throw error;
      }
      supabaseUid = authData.user.id;
    }

    // Step 3: Create local DB user + profile in a transaction using Supabase UID as primary key
    try {
      const newUser = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            id: supabaseUid, // Use Supabase UID as the local User ID
            email,
            phoneNumber,
            firstName,
            lastName,
            role,
            profilePictureUrl,
          },
        });

        if (role === Role.CUSTOMER) {
          await tx.customerProfile.create({
            data: { userId: user.id },
          });
        } else if (role === Role.WORKER) {
          if (!cityId || !serviceCategoryId) {
            throw Object.assign(
              new Error("City ID and Service Category ID are required for Worker registration"),
              { statusCode: 400 }
            );
          }
          await tx.workerProfile.create({
            data: {
              userId: user.id,
              cityId,
              serviceCategoryId,
              verificationDocUrl,
              aadhaarNumber,
              isVerified: false, // Requires admin approval before login
            },
          });
        }

        return user;
      });

      return { user: newUser };
    } catch (dbError: any) {
      // Rollback: remove the Supabase Auth user if DB write fails
      if (!isMockAuth) {
        await supabase.auth.admin.deleteUser(supabaseUid);
      }
      throw dbError;
    }
  }

  /**
   * Login user via Supabase Auth.
   * Returns the Supabase session access_token (JWT) for use as Bearer token.
   */
  static async login(data: any) {
    const { email, password, fcmToken } = data;

    let accessToken = "mock-jwt-token";
    let refreshToken = "mock-refresh-token";
    const isMockAuth = process.env.SUPABASE_SERVICE_ROLE_KEY === "your-service-role-key-here" || !process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!isMockAuth) {
      // Authenticate via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.session) {
        const error: any = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
      }
      accessToken = authData.session.access_token;
      refreshToken = authData.session.refresh_token;
    }

    // Fetch full user profile from local DB
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        customerProfile: true,
        workerProfile: {
          include: {
            city: true,
            serviceCategory: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      const error: any = new Error("Account is inactive or does not exist");
      error.statusCode = 401;
      throw error;
    }

    if (isMockAuth) {
      accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );
    }

    // Block unverified workers — must be approved by admin first
    if (user.role === Role.WORKER) {
      const workerProfile = await prisma.workerProfile.findUnique({
        where: { userId: user.id },
        select: { isVerified: true },
      });
      if (workerProfile && !workerProfile.isVerified) {
        const error: any = new Error(
          "Your account is pending admin approval. You will be notified once approved."
        );
        error.statusCode = 403;
        throw error;
      }
    }

    // Update FCM token if provided
    if (fcmToken) {
      await prisma.user.update({
        where: { id: user.id },
        data: { fcmToken },
      });
    }

    // Return Supabase JWT — this is what the client stores and sends as Bearer token
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token: accessToken,
      refreshToken: refreshToken,
    };
  }
}

export default AuthService;

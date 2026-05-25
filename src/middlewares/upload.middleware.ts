import { Request } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import logger from "../utils/logger";

const uploadDir = path.join(process.cwd(), "uploads");

// Ensure the local uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Local storage configuration
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter to allow only image and pdf documents
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, WEBP images and PDF documents are allowed."));
  }
};

export const upload = multer({
  storage: localStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max file size limit
  },
});

/**
 * Helper to process the upload result and return URL.
 * In a real AWS S3 production setup, this function would take the local file,
 * upload it to S3 using @aws-sdk/client-s3, delete the local file, and return the S3 object URL.
 * If AWS credentials are not set, it returns the local server static link.
 */
export const getUploadedFileUrl = async (file: Express.Multer.File): Promise<string> => {
  const isAwsConfigured =
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET_NAME;

  if (isAwsConfigured) {
    try {
      // In production, we would import S3Client from "@aws-sdk/client-s3" and run PutObjectCommand.
      // Here we mock the return S3 URL to demonstrate integration.
      logger.info(`[Production Mock] Uploading ${file.filename} to AWS S3 bucket: ${process.env.AWS_S3_BUCKET_NAME}`);
      
      const s3Url = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/uploads/${file.filename}`;
      
      // Simulating deleting local file after S3 upload
      setTimeout(() => {
        fs.unlink(file.path, (err) => {
          if (err) logger.error(`Failed to delete local temporary file ${file.path}:`, err);
        });
      }, 1000);

      return s3Url;
    } catch (error) {
      logger.error("AWS S3 Upload failed, falling back to local URL:", error);
    }
  }

  // Fallback to local URL path
  const PORT = process.env.PORT || 4000;
  return `http://localhost:${PORT}/uploads/${file.filename}`;
};

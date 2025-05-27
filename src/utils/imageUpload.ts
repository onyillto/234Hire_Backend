// src/utils/imageUpload.ts
import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";
// Interface for authenticated requests (matching your auth pattern)
interface AuthenticatedRequest extends Request {
  user?: {
    _id?: any; // MongoDB ObjectId
    id?: string; // String version
    role?: string; // Optional since it's optional in your model
    [key: string]: any;
  };
}
// Configuration object for upload settings
export const uploadConfig = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ],
  uploadPath: "uploads/profile-images",
};

// Ensure upload directory exists
export const ensureUploadDir = (uploadPath: string): void => {
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log(`📁 Created upload directory: ${uploadPath}`);
  }
};

// Generate unique filename
export const generateFileName = (
  userId: string,
  originalName: string
): string => {
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const ext = path.extname(originalName);
  return `${userId}_${uniqueSuffix}${ext}`;
};

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    ensureUploadDir(uploadConfig.uploadPath);
    cb(null, uploadConfig.uploadPath);
  },
  filename: function (req, file, cb) {
    const userId =
      (req as AuthenticatedRequest).user?._id ||
      (req as AuthenticatedRequest).user?.id;
    const fileName = generateFileName(userId, file.originalname);
    cb(null, fileName);
  },
});

// File filter for images only
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (uploadConfig.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(
      `Invalid file type. Allowed types: ${uploadConfig.allowedMimeTypes.join(
        ", "
      )}`
    );
    cb(error as any, false);
  }
};

// Main multer configuration
export const profileImageUpload = multer({
  storage: storage,
  limits: {
    fileSize: uploadConfig.maxFileSize,
  },
  fileFilter: fileFilter,
});

// Utility functions for file operations
export class FileManager {
  /**
   * Delete a file from the filesystem
   */
  static deleteFile(filePath: string): boolean {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`🗑️ Deleted file: ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Error deleting file ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Check if a file exists
   */
  static fileExists(filePath: string): boolean {
    const fullPath = path.join(process.cwd(), filePath);
    return fs.existsSync(fullPath);
  }

  /**
   * Get file size in bytes
   */
  static getFileSize(filePath: string): number | null {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      const stats = fs.statSync(fullPath);
      return stats.size;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate full URL for uploaded file
   */
  static generateFileUrl(req: Request, filePath: string): string {
    return `${req.protocol}://${req.get("host")}/${filePath.replace(
      /\\/g,
      "/"
    )}`;
  }

  /**
   * Normalize file path (replace backslashes with forward slashes)
   */
  static normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, "/");
  }

  /**
   * Clean up uploaded file on error
   */
  static cleanupUploadedFile(file: Express.Multer.File | undefined): void {
    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
      console.log(`🧹 Cleaned up uploaded file: ${file.path}`);
    }
  }
}

// Validation helpers
export class ImageValidator {
  /**
   * Validate image file
   */
  static validateImage(file: Express.Multer.File): {
    isValid: boolean;
    error?: string;
  } {
    // Check file size
    if (file.size > uploadConfig.maxFileSize) {
      return {
        isValid: false,
        error: `File size too large. Maximum size is ${
          uploadConfig.maxFileSize / (1024 * 1024)
        }MB`,
      };
    }

    // Check mime type
    if (!uploadConfig.allowedMimeTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: `Invalid file type. Allowed types: ${uploadConfig.allowedMimeTypes.join(
          ", "
        )}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Get file info for response
   */
  static getFileInfo(file: Express.Multer.File, req: Request) {
    const normalizedPath = FileManager.normalizePath(file.path);
    return {
      originalName: file.originalname,
      fileName: file.filename,
      filePath: normalizedPath,
      fileUrl: FileManager.generateFileUrl(req, normalizedPath),
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  }
}

// Export middleware for single file upload
export const uploadSingle = profileImageUpload.single("profileImage");

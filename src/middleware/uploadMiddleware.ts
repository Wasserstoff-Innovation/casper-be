// src/middleware/upload.ts
import multer from 'multer';
import { ImageGenerationError } from '../utils/errorHandler';
import { Request, Response, NextFunction } from 'express';

const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/json' // for brand guidelines
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ImageGenerationError(
      `Invalid file type: ${file.mimetype}. Allowed types: JPEG, PNG, GIF, WebP, JSON`,
      400,
      { receivedType: file.mimetype, allowedTypes: allowedMimes }
    ));
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter
}).any();

export const preprocessFormData = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.style_components && typeof req.body.style_components === "string") {
    try {
      req.body.style_components = JSON.parse(req.body.style_components);
    } catch {
      req.body.style_components = [];
    }
  }

  if (req.body.summarize_prompt && typeof req.body.summarize_prompt === "string") {
    req.body.summarize_prompt = req.body.summarize_prompt === "true";
  }

  next();
};

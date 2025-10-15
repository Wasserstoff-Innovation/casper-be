// src/types/multer.d.ts
import { Express } from 'express';

declare global {
  namespace Express {
    interface Request {
      files?: {
        [fieldname: string]: Express.Multer.File[];
      };
    }
  }
}

export interface MulterFiles {
  [fieldname: string]: Express.Multer.File[];
}

export interface TransformRequestFiles {
  source_image: Express.Multer.File[];
}
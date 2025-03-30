import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Configure storage for multer
const storage = multer.memoryStorage();

// Filter function to allow only CSV files
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  // Accept only csv files
  if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
    callback(null, true);
  } else {
    callback(new Error('Only CSV files are allowed'));
  }
};

// Configure multer with the storage and fileFilter
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB limit
  },
});

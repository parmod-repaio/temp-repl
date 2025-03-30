import multer from "multer";
import { Request } from "express";
import path from "path";
import { randomUUID } from "crypto";

// Set up storage for CSV files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store uploaded files in memory for processing
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = randomUUID();
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

// File filter to only allow CSV files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only csv files
  if (file.mimetype === "text/csv" || 
      file.originalname.toLowerCase().endsWith(".csv")) {
    cb(null, true);
  } else {
    cb(new Error("Only CSV files are allowed"));
  }
};

// Create the multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  }
});

export default upload;

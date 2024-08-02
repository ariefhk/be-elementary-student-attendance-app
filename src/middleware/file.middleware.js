import multer from "multer";
import path from "path";
import { APIError } from "../error/api.error.js";

const FILE_LIMIT = 2 * 1024 * 1024;

export const fileUploader = multer({
  limits: {
    fileSize: FILE_LIMIT,
  },
  fileFilter: function (req, file, cb) {
    let extFile = path.extname(file.originalname);
    if (extFile === ".png" || extFile === ".jpg" || extFile === ".jpeg" || extFile === ".pdf") return cb(null, true);

    // A Multer error occurred when uploading.
    cb(null, false);
    cb(new APIError(400, "Filetype must be PNG/JPG/JPEG"));
  },
  storage: multer.diskStorage({}),
});

// Profile Picture intance
const profilePicture = fileUploader.single("profilePicture");

export class FileUploadMiddleware {
  static async uploadProfilePicture(req, res, next) {
    try {
      profilePicture(req, res, (error) => {
        if (error) {
          next(error);
        }
        next();
      });
    } catch (error) {
      next(error);
    }
  }
}

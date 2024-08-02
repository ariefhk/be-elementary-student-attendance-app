import fs from "fs";
import path from "path";

export const getBaseUrl = (request) => {
  const host = request.get("host");
  const protocol = request.protocol;
  const baseUrl = `${protocol}://${host}`;
  return baseUrl;
};

// Custom function to get MIME type based on file extension
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".html": "text/html",
    ".txt": "text/plain",
    // Add more types as needed
  };

  return mimeTypes[ext] || "application/octet-stream";
};

export const saveFile = (file, fileName, BASE_DIR, DIR) => {
  return new Promise((resolve, reject) => {
    // Check file
    if (!file) {
      return reject(new Error("File not found!"));
    }

    // Check directory
    if (!fs.existsSync(DIR)) {
      fs.mkdirSync(DIR);
    }

    if (!fs.existsSync(BASE_DIR)) {
      fs.mkdirSync(BASE_DIR);
    }

    // Check file name
    const extFile = path.extname(file.originalname);

    // Check file name
    if (!fileName) {
      return reject(new Error("File name is required"));
    }
    // Modify file name
    const modifyfileName = `${fileName}-${Date.now()}${extFile}`;

    // Set file path
    const filePath = path.posix.join(DIR, modifyfileName);

    // Set folder file
    const folderFile = `${path.posix.relative(BASE_DIR, filePath)}`;

    // Save file
    fs.rename(file.path, filePath, (err) => {
      if (err) {
        return reject(err);
      }
      resolve(folderFile);
    });
  });
};

export const getFile = (DIR, fileUrlPath) => {
  const filePath = path.posix.join(DIR, fileUrlPath);

  console.log("filePath", filePath);

  if (fs.existsSync(filePath)) {
    return `${path.posix.relative(DIR, filePath)}`;
  } else {
    return null;
  }
};

export const getFileWithPreview = (DIR, fileUrlPath, res) => {
  const filePath = path.posix.join(DIR, fileUrlPath);

  if (fs.existsSync(filePath)) {
    // Get the mime type using the custom function
    const mimeType = getMimeType(filePath);

    // Set headers for file preview
    res.setHeader("Content-Disposition", `inline; filename="${path.basename(fileUrlPath)}"`);
    res.setHeader("Content-Type", mimeType);

    // Stream the file directly to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } else {
    console.log("File not found:", filePath); // Log the file path not found
    res.status(404).send("File not found");
  }
};

export const deleteFile = (DIR, fileUrlPath) => {
  return new Promise((resolve, reject) => {
    const existedFile = getFile(DIR, fileUrlPath);

    if (!existedFile) {
      return reject(new Error("File Not FOund!"));
    }

    fs.unlink(filePath, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

export const updateFile = async (oldFileName, newFile) => {
  await deleteFile(oldFileName);
  return saveFile(newFile);
};

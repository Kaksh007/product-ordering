const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

// Map MIME (client-supplied but also screened by filter) to a fixed, safe extension.
// Never trust file.originalname for the extension — a client can claim `evil.html`
// and since /uploads is served statically, that HTML would execute on our origin.
const mimeToExt = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
};

const fileFilter = (req, file, cb) => {
  if (mimeToExt[file.mimetype]) return cb(null, true);
  cb(new Error('Only PNG, JPG, and WebP images are allowed'));
};

function buildUploader() {
  const strategy = (process.env.UPLOAD_STRATEGY || 'local').toLowerCase();

  if (strategy === 'cloudinary') {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const storage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder: 'kinetic_gallery/mockups',
        allowed_formats: ['png', 'jpg', 'jpeg', 'webp'],
      },
    });

    return {
      strategy,
      upload: multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } }),
      cloudinary,
    };
  }

  // default: local disk storage
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      // Derive extension from the whitelisted MIME type rather than the attacker-
      // controlled originalname. Fallback shouldn't fire because fileFilter already
      // rejected unknown mimetypes, but belt-and-braces.
      const ext = mimeToExt[file.mimetype] || '.bin';
      const safe = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, safe);
    },
  });

  return {
    strategy,
    upload: multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } }),
    cloudinary: null,
  };
}

module.exports = buildUploader();

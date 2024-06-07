import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from "cloudinary";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'diplomas', // Folder name in your Cloudinary account
    format: async (req, file) => 'pdf', // supports promises as well
    public_id: (req, file) => `${Date.now().toString()}-${file.originalname.split('.')[0]}`,
  },
});

const upload = multer({ storage: storage });

export default upload;

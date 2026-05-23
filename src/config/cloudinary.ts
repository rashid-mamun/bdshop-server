import { v2 as cloudinary } from 'cloudinary';
import environment from './environment';

if (environment.CLOUDINARY_URL) {
    const parsedCloudinaryUrl = new URL(environment.CLOUDINARY_URL);
    cloudinary.config({
        cloud_name: parsedCloudinaryUrl.hostname,
        api_key: decodeURIComponent(parsedCloudinaryUrl.username),
        api_secret: decodeURIComponent(parsedCloudinaryUrl.password),
    });
} else {
    cloudinary.config({
        cloud_name: environment.CLOUDINARY_CLOUD_NAME,
        api_key: environment.CLOUDINARY_API_KEY,
        api_secret: environment.CLOUDINARY_API_SECRET,
    });
}

export default cloudinary;

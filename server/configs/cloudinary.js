import {v2 as cloudinary} from 'cloudinary';
const connectCloudinary = async () => {

const CLOUDINARY_CLOUD_NAME="dsustwkmh"
const CLOUDINARY_API_KEY="989278147613844"
const CLOUDINARY_API_SECRET="w1mhinv8H4v2fxJ4MN7ySrggYzE"

  cloudinary.config({
    cloud_name: `${CLOUDINARY_CLOUD_NAME}`,
    api_key: `${CLOUDINARY_API_KEY}`,
    api_secret: `${CLOUDINARY_API_SECRET}`,
  })
}

export default connectCloudinary;
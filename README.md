# Mobi-world-BE

Backend API for Mobiworld mobile phone inventory management system.

## Features

- User authentication and authorization
- Phone inventory management
- Image upload and storage with Cloudinary
- Sales tracking and analytics
- RESTful API endpoints

## Cloudinary Image Uploads

This project uses [Cloudinary](https://cloudinary.com/) for image uploads instead of local storage. To enable this:

1. Create a free Cloudinary account.
2. In your Cloudinary dashboard, get your **Cloud name**, **API Key**, and **API Secret**.
3. Add these to your `.env` file:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

4. Deploy as usual. Uploaded images will be stored in Cloudinary and accessible via their URLs.

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your configuration:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/phones` - Get all phones (public)
- `POST /api/phones` - Add new phone (authenticated)
- `PUT /api/phones/:id` - Update phone (authenticated)
- `DELETE /api/phones/:id` - Delete phone (authenticated)

## Dependencies

- **cloudinary**: ^2.7.0 - Cloud image and video management
- **multer**: ^1.4.5-lts.1 - File upload middleware
- **express**: ^4.18.2 - Web framework
- **mongoose**: ^7.8.7 - MongoDB ODM
- **bcryptjs**: ^2.4.3 - Password hashing
- **jsonwebtoken**: ^9.0.2 - JWT authentication

## Deployment

The application is configured to work with deployment platforms like Render, Vercel, or Heroku. Images are stored in Cloudinary, so there are no local file storage dependencies. 
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Check file size (10MB limit for Cloudinary free tier)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json({ 
        error: `File size too large. File is ${fileSizeMB}MB, maximum allowed is 10MB. Please compress or resize your image before uploading.` 
      }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'admin-uploads' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    // @ts-ignore
    return NextResponse.json({ url: uploadResult.secure_url, alt: file.name });
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    
    // Check if it's a file size error
    if (error?.http_code === 400 && error?.message?.includes('File size too large')) {
      const fileSizeMB = error.message.match(/Got (\d+)/)?.[1];
      const maxSizeMB = error.message.match(/Maximum is (\d+)/)?.[1];
      const fileSizeFormatted = fileSizeMB ? (parseInt(fileSizeMB) / (1024 * 1024)).toFixed(2) : 'unknown';
      const maxSizeFormatted = maxSizeMB ? (parseInt(maxSizeMB) / (1024 * 1024)).toFixed(0) : '10';
      
      return NextResponse.json({ 
        error: `File size too large. File is ${fileSizeFormatted}MB, maximum allowed is ${maxSizeFormatted}MB. Please compress or resize your image before uploading.` 
      }, { status: 400 });
    }
    
    // Return the error message if available, otherwise generic message
    return NextResponse.json({ 
      error: error?.message || 'Failed to upload file. Please try again or use a smaller file.' 
    }, { status: 500 });
  }
} 
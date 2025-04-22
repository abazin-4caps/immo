import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import prisma from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(
  request: Request,
  { params }: { params: { id: string; documentId: string } }
) {
  console.log('Download route called with params:', params);
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('Download attempt without authentication');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Vérifier l'accès au projet
    const projectActor = await prisma.projectActor.findFirst({
      where: {
        projectId: params.id,
        userId: session.user.id,
      },
    });

    if (!projectActor) {
      console.log('User not authorized for project:', params.id);
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Récupérer le document
    const document = await prisma.document.findUnique({
      where: {
        id: params.documentId,
        projectId: params.id,
      },
    });

    if (!document) {
      console.log('Document not found:', params.documentId);
      return new NextResponse('Document not found', { status: 404 });
    }

    console.log('Document found:', document);

    // Determine resource type based on file extension
    const isPDF = document.url.toLowerCase().endsWith('.pdf');
    const resourceType = isPDF ? 'raw' : 'image';

    // Generate timestamp for URL expiration (1 hour from now)
    const timestamp = Math.floor(Date.now() / 1000) + 3600;

    // Extract the version and public ID from the URL
    // Example: https://res.cloudinary.com/dcahaqjyt/raw/upload/v1234567890/folder/file.pdf
    const matches = document.url.match(/\/v(\d+)\/(.+)$/);
    if (!matches) {
      console.error('Invalid Cloudinary URL format:', document.url);
      return new NextResponse('Invalid document URL', { status: 400 });
    }

    const [_, version, path] = matches;
    
    // Parameters to sign
    const params_to_sign = {
      timestamp,
      resource_type: resourceType,
      type: 'upload',
      version
    };

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      params_to_sign,
      process.env.CLOUDINARY_API_SECRET || ''
    );

    // Construct the download URL with fl_attachment
    const baseUrl = document.url.replace('/upload/', '/upload/fl_attachment/');
    const downloadUrl = `${baseUrl}?timestamp=${timestamp}&signature=${signature}&api_key=${process.env.CLOUDINARY_API_KEY}`;

    console.log('Generated download URL:', downloadUrl);

    // Rediriger vers l'URL de téléchargement
    return NextResponse.redirect(downloadUrl);
  } catch (error) {
    console.error('Error in download route:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
} 
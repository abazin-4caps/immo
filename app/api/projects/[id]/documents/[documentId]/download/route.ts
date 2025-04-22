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

    // Extraire les informations de l'URL Cloudinary
    const urlParts = document.url.split('/');
    const resourceType = urlParts[3]; // 'image' ou 'raw'
    const uploadIndex = urlParts.indexOf('upload');
    const version = urlParts[uploadIndex + 1]; // 'v1234567890'
    const publicId = urlParts.slice(uploadIndex + 2).join('/');

    console.log('Extracted info:', { publicId, version, resourceType });

    // Générer le timestamp et la signature
    const timestamp = Math.floor(Date.now() / 1000) + 3600; // Expire dans 1 heure
    const toSign = {
      public_id: publicId,
      timestamp,
      type: 'upload',
      version: version.replace('v', '')
    };

    const signature = cloudinary.utils.api_sign_request(
      toSign,
      process.env.CLOUDINARY_API_SECRET || ''
    );

    // Construire l'URL de téléchargement
    const downloadUrl = document.url.replace('/upload/', '/upload/fl_attachment/');
    const finalUrl = `${downloadUrl}?timestamp=${timestamp}&signature=${signature}&api_key=${process.env.CLOUDINARY_API_KEY}`;

    console.log('Generated download URL:', finalUrl);

    // Rediriger vers l'URL de téléchargement
    return NextResponse.redirect(finalUrl);
  } catch (error) {
    console.error('Error in download route:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
} 
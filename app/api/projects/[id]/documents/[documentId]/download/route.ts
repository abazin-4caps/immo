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

    try {
      // Générer une URL de téléchargement temporaire
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = cloudinary.utils.api_sign_request(
        {
          public_id: publicId,
          resource_type: resourceType,
          type: 'upload',
          timestamp,
          flags: 'attachment',
          version: version.replace('v', '')
        },
        process.env.CLOUDINARY_API_SECRET || ''
      );

      const downloadUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/fl_attachment/${version}/${publicId}?timestamp=${timestamp}&signature=${signature}&api_key=${process.env.CLOUDINARY_API_KEY}`;
      console.log('Generated download URL:', downloadUrl);

      // Rediriger vers l'URL de téléchargement
      return NextResponse.redirect(downloadUrl);
    } catch (cloudinaryError) {
      console.error('Error generating download URL:', cloudinaryError);
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to generate download URL', 
          details: cloudinaryError instanceof Error ? cloudinaryError.message : 'Unknown error'
        }),
        { 
          status: 502,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }
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
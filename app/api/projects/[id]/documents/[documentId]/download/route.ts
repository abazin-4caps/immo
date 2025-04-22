import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/auth.config';
import prisma from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiOptions } from 'cloudinary';

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

    // Extraire le public ID de l'URL Cloudinary
    const matches = document.url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
    if (!matches) {
      console.error('Could not extract public ID from URL:', document.url);
      return new NextResponse('Invalid document URL', { status: 400 });
    }

    const publicId = matches[1];
    const isPDF = publicId.toLowerCase().endsWith('.pdf');

    // Générer l'URL de téléchargement
    const options: UploadApiOptions = {
      resource_type: isPDF ? 'raw' : 'image',
      type: 'upload',
      attachment: true,
      flags: 'attachment',
      secure: true,
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 heure
    };

    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.explicit(
          publicId,
          options,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
      });

      // @ts-ignore
      const secureUrl = result.secure_url;
      console.log('Generated secure URL:', secureUrl);

      return NextResponse.redirect(secureUrl);
    } catch (cloudinaryError) {
      console.error('Cloudinary API error:', cloudinaryError);
      return new NextResponse(
        'Error generating download URL',
        { status: 500 }
      );
    }
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
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

    // Determine resource type and extract public ID
    const isPDF = document.url.toLowerCase().endsWith('.pdf');
    const resourceType = isPDF ? 'raw' : 'image';

    // Extract the public ID from the URL (everything after the last slash)
    const urlParts = document.url.split('/');
    const fullPublicId = urlParts[urlParts.length - 1].split('.')[0];
    
    console.log('Extracted info:', { fullPublicId, resourceType, url: document.url });

    // Generate the download URL using cloudinary.url()
    const downloadUrl = cloudinary.url(fullPublicId, {
      resource_type: resourceType,
      flags: 'attachment',
      sign_url: true,
      type: 'authenticated'
    });

    console.log('Generated download URL:', downloadUrl);

    // Rediriger vers l'URL signée
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
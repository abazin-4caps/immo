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
    const publicId = urlParts.slice(uploadIndex + 2).join('/');

    console.log('Extracted info:', { publicId, resourceType });

    // Obtenir une URL signée de Cloudinary
    const timestamp = Math.floor(Date.now() / 1000);
    const transformation = 'fl_attachment';
    
    const signedUrl = cloudinary.url(publicId, {
      resource_type: resourceType as "image" | "raw",
      type: 'upload',
      sign_url: true,
      secure: true,
      transformation: [{ flags: 'attachment' }],
      version: urlParts[uploadIndex + 1].replace('v', '')
    });

    console.log('Generated signed URL:', signedUrl);

    // Récupérer le fichier avec l'URL signée
    try {
      const response = await fetch(signedUrl);
      
      if (!response.ok) {
        console.error('Failed to fetch file:', {
          status: response.status,
          statusText: response.statusText,
          url: signedUrl
        });
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      const contentDisposition = `attachment; filename="${document.name}"`;
      const arrayBuffer = await response.arrayBuffer();

      // Renvoyer le fichier au client
      return new NextResponse(arrayBuffer, {
        headers: {
          'Content-Type': contentType || 'application/octet-stream',
          'Content-Disposition': contentDisposition,
          'Content-Length': arrayBuffer.byteLength.toString()
        }
      });
    } catch (fetchError) {
      console.error('Error fetching file from Cloudinary:', fetchError);
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to fetch file', 
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error',
          url: signedUrl
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
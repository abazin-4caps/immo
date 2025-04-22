import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '../../../lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  console.log('POST /api/delete-document - Start');
  
  try {
    // 1. Vérifier le corps de la requête
    const body = await request.json();
    console.log('Request body:', body);

    const { documentId, projectId } = body;
    
    if (!documentId || !projectId) {
      console.log('Missing required fields:', { documentId, projectId });
      return NextResponse.json(
        { error: 'Document ID et Project ID sont requis' },
        { status: 400 }
      );
    }

    // 2. Vérifier l'authentification
    const session = await getServerSession(authOptions);
    console.log('Session:', session);

    if (!session?.user) {
      console.log('No session or user');
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // 3. Vérifier l'accès au projet
    const projectActor = await prisma.projectActor.findFirst({
      where: {
        projectId: projectId,
        userId: session.user.id,
      },
    });
    console.log('Project actor:', projectActor);

    if (!projectActor) {
      console.log('No project access');
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // 4. Récupérer le document
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
        projectId: projectId,
      },
    });
    console.log('Document found:', document);

    if (!document) {
      console.log('Document not found');
      return NextResponse.json(
        { error: 'Document non trouvé' },
        { status: 404 }
      );
    }

    // 5. Supprimer de la base de données
    console.log('Deleting document from database...');
    await prisma.document.delete({
      where: {
        id: documentId,
      },
    });
    console.log('Document deleted from database');

    // 6. Tenter de supprimer de Cloudinary
    if (document.url) {
      console.log('Attempting to delete from Cloudinary:', document.url);
      try {
        const url = new URL(document.url);
        const pathParts = url.pathname.split('/');
        const uploadIndex = pathParts.findIndex(part => part === 'upload');
        
        if (uploadIndex !== -1) {
          const publicId = pathParts
            .slice(uploadIndex + 1)
            .join('/')
            .replace(/\.[^/.]+$/, '');

          console.log('Cloudinary publicId:', publicId);
          const result = await cloudinary.uploader.destroy(publicId);
          console.log('Cloudinary delete result:', result);
        }
      } catch (error) {
        console.error('Failed to delete from Cloudinary:', error);
      }
    }

    console.log('Operation completed successfully');
    return NextResponse.json({ success: true, message: 'Document supprimé avec succès' });
  } catch (error) {
    console.error('Error in document deletion:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la suppression du document',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/auth.config';
import prisma from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(
  request: Request,
  { params }: { params: { id: string; documentId: string } }
) {
  console.log('Route de téléchargement appelée avec les paramètres:', params);
  
  try {
    const session = await auth();
    if (!session?.user) {
      console.log('Tentative de téléchargement sans authentification');
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier l'accès au projet
    const projectActor = await prisma.projectActor.findFirst({
      where: {
        projectId: params.id,
        userId: session.user.id,
      },
    });

    if (!projectActor) {
      console.log('Utilisateur non autorisé pour le projet:', params.id);
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Récupérer le document
    const document = await prisma.document.findUnique({
      where: {
        id: params.documentId,
        projectId: params.id,
      },
    });

    if (!document) {
      console.log('Document non trouvé:', params.documentId);
      return NextResponse.json({ error: 'Document non trouvé' }, { status: 404 });
    }

    console.log('Document trouvé:', document);

    // Extraire les informations de l'URL Cloudinary
    const urlParts = document.url.split('/');
    const resourceType = urlParts[3]; // 'image' ou 'raw'
    const uploadIndex = urlParts.indexOf('upload');
    const version = urlParts[uploadIndex + 1]; // 'v1234567890'
    const publicId = urlParts.slice(uploadIndex + 2).join('/');

    console.log('Informations extraites:', { publicId, version, resourceType });

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

      const downloadUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/fl_attachment/${version}/${publicId}?timestamp=${timestamp}&signature=${signature}&api_key=${process.env.CLOUDINARY_API_KEY}`;
      console.log('URL de téléchargement générée:', downloadUrl);

      // Rediriger vers l'URL de téléchargement
      return NextResponse.redirect(downloadUrl);
    } catch (cloudinaryError) {
      console.error('Erreur lors de la génération de l\'URL de téléchargement:', cloudinaryError);
      return NextResponse.json(
        { 
          error: 'Erreur lors de la génération de l\'URL de téléchargement',
          details: cloudinaryError instanceof Error ? cloudinaryError.message : 'Erreur inconnue'
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Erreur dans la route de téléchargement:', error);
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 
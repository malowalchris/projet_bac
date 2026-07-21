import { NextResponse } from 'next/server';
import { cloudinary } from '@/lib/cloudinary';
import { requireAdminAuth, AuthError } from '@/lib/auth-guard';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    // ── 1. Contrôle d'Accès Stricte (Zero-Trust) ──────────────────
    // Seul un administrateur authentifié peut téléverser des assets
    try {
      await requireAdminAuth();
    } catch (authErr: any) {
      const statusCode = authErr instanceof AuthError ? authErr.statusCode : 403;
      return NextResponse.json({ error: authErr.message || 'Accès refusé' }, { status: statusCode });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string)?.trim() || 'mes-courses-faciles/products';

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // ── 2. Validation du Fichier et Optimisation ──────────────────
    // A. Limitation de la taille (strictement inférieure à 5 Mo)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size >= MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'La taille du fichier ne doit pas dépasser 5 Mo' }, { status: 400 });
    }

    // B. Limitation stricte des types MIME autorisés
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Format non supporté. Seuls les formats JPEG, PNG et WebP sont acceptés' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // C. Encodage et normalisation sécurisés du nom du fichier
    const uniqueId = crypto.randomUUID();
    const cleanFileName = file.name
      .replace(/\.[^/.]+$/, "") // retire l'extension
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // supprime les diacritiques (accents)
      .replace(/[^a-zA-Z0-9-_]/g, "_") // remplace les caractères spéciaux/espaces par des underscores
      .replace(/_+/g, "_") // dédoublonne les underscores consécutifs
      .toLowerCase()
      .substring(0, 50); // limite la longueur à 50 caractères
    const publicId = `${cleanFileName}_${Date.now()}_${uniqueId.substring(0, 8)}`;

    // ── 3. Traçabilité Cloudinary Complète (DAM) ──────────────────
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: folder, public_id: publicId },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const res = result as any;

    // Retour structuré complet pour le suivi DAM et la maintenance
    return NextResponse.json({
      success: true,
      url: res.secure_url,
      publicId: res.public_id,
      format: res.format,
      bytes: res.bytes
    }, { status: 200 });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Erreur lors du téléversement', details: error.message }, { status: 500 });
  }
}

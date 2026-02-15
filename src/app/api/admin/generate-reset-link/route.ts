import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate the password reset link using Firebase Admin SDK
    const link = await adminAuth.generatePasswordResetLink(email);

    return NextResponse.json({ link });
  } catch (error: any) {
    console.error('Error generating reset link:', error);
    
    // Check for specific Firebase errors
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la génération du lien' },
      { status: 500 }
    );
  }
}

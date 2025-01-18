import { NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

// Initialize Firebase (you'll need to add your config)
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

// Initialize KYC provider (example using Onfido)
const Onfido = require('@onfido/api');
const onfido = new Onfido({
  apiToken: process.env.ONFIDO_API_TOKEN,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const idFrontImage = formData.get('idFrontImage') as File;
    const idBackImage = formData.get('idBackImage') as File;
    const selfieImage = formData.get('selfieImage') as File;

    if (!userId || !idFrontImage || !selfieImage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Upload documents to Firebase Storage
    const uploadPromises = [];
    const urls: { [key: string]: string } = {};

    for (const [key, file] of Object.entries({
      idFront: idFrontImage,
      idBack: idBackImage,
      selfie: selfieImage,
    })) {
      if (file) {
        const storageRef = ref(
          storage,
          `kyc/${userId}/${key}-${Date.now()}`
        );
        uploadPromises.push(
          uploadBytes(storageRef, file).then(() =>
            getDownloadURL(storageRef).then((url) => {
              urls[key] = url;
            })
          )
        );
      }
    }

    await Promise.all(uploadPromises);

    // 2. Create Onfido applicant
    const applicant = await onfido.applicant.create({
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      country: formData.get('country'),
    });

    // 3. Upload documents to Onfido
    const documentPromises = [];

    // Upload ID front
    documentPromises.push(
      onfido.document.upload({
        applicantId: applicant.id,
        file: idFrontImage,
        type: 'national-identity-card',
        side: 'front',
      })
    );

    // Upload ID back if provided
    if (idBackImage) {
      documentPromises.push(
        onfido.document.upload({
          applicantId: applicant.id,
          file: idBackImage,
          type: 'national-identity-card',
          side: 'back',
        })
      );
    }

    // Upload selfie
    documentPromises.push(
      onfido.livePhoto.upload({
        applicantId: applicant.id,
        file: selfieImage,
      })
    );

    await Promise.all(documentPromises);

    // 4. Create Onfido check
    const check = await onfido.check.create({
      applicantId: applicant.id,
      reportNames: ['document', 'facial_similarity_photo'],
    });

    // 5. Store KYC submission in Firestore
    await addDoc(collection(db, 'kyc_submissions'), {
      userId,
      applicantId: applicant.id,
      checkId: check.id,
      status: 'pending',
      documentUrls: urls,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: 'KYC submission successful',
      checkId: check.id,
    });
  } catch (error) {
    console.error('KYC submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process KYC submission' },
      { status: 500 }
    );
  }
} 
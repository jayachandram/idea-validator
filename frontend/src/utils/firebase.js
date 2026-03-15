import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";

/**
 * Firebase configuration
 */
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

/**
 * Initialize Firebase
 */
const app = initializeApp(firebaseConfig);

/**
 * Auth instance
 */
export const auth = getAuth(app);

/**
 * Google Provider
 */
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});

/**
 * GOOGLE LOGIN
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);

    const user = result.user;

    if (!user) {
      throw new Error("Google authentication failed");
    }

    const idToken = await user.getIdToken(true);

    return idToken;

  } catch (error) {

    console.error("Google login error:", error);

    throw error;
  }
};


/**
 * PHONE AUTH
 */

/**
 * Setup invisible recaptcha
 */
export const setupRecaptcha = (containerId) => {

  if (window.recaptchaVerifier) return;

  window.recaptchaVerifier = new RecaptchaVerifier(
    containerId,
    {
      size: "invisible",
      callback: () => { }
    },
    auth
  );
};


/**
 * Send OTP
 */
export const sendPhoneOTP = async (phone) => {

  if (!window.recaptchaVerifier) {
    throw new Error("Recaptcha not initialized");
  }

  const confirmation = await signInWithPhoneNumber(
    auth,
    phone,
    window.recaptchaVerifier
  );

  window.confirmationResult = confirmation;

  return confirmation;
};


/**
 * Verify OTP
 */
export const verifyPhoneOTP = async (otp) => {

  if (!window.confirmationResult) {
    throw new Error("OTP not requested");
  }

  const result = await window.confirmationResult.confirm(otp);

  const idToken = await result.user.getIdToken(true);

  return {
    idToken,
    user: result.user
  };
};

export default app;
const admin = require("firebase-admin");
const path = require("path");

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin
 */
const initializeFirebase = () => {

  if (firebaseInitialized) return;

  const serviceAccount = require(path.join(
    __dirname,
    "ideavalidator-7a84d-firebase-adminsdk-fbsvc-d595c06f1a.json"
  ));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  firebaseInitialized = true;

  console.log("✅ Firebase Admin initialized");
};

/**
 * Verify Firebase ID token
 */
const verifyFirebaseToken = async (idToken) => {

  initializeFirebase();

  const decodedToken = await admin.auth().verifyIdToken(idToken);

  return decodedToken;
};

/**
 * Get Firebase user by UID
 */
const getFirebaseUser = async (uid) => {

  initializeFirebase();

  return admin.auth().getUser(uid);
};

module.exports = {
  initializeFirebase,
  verifyFirebaseToken,
  getFirebaseUser
};
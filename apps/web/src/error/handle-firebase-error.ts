import type { FirebaseError } from "firebase/app";

export function handleFirebaseError(error: FirebaseError) {
  switch (error.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password";
    case "auth/email-already-exists":
    case "auth/email-already-in-use":
      return "This email is already in use";
    case "auth/invalid-email":
      return "Please enter a valid email address";
    case "auth/missing-email":
      return "Email is required";
    case "auth/invalid-password":
    case "auth/weak-password":
      return "Password must be at least 6 characters";
    case "auth/missing-password":
      return "Password is required";
    case "auth/invalid-display-name":
      return "Please enter a valid name";
    case "auth/invalid-phone-number":
      return "Please enter a valid phone number";
    case "auth/phone-number-already-exists":
      return "This phone number is already in use";
    case "auth/invalid-photo-url":
      return "Please provide a valid photo URL";
    case "auth/user-disabled":
      return "This account has been disabled";
    case "auth/id-token-expired":
    case "auth/id-token-revoked":
    case "auth/session-cookie-expired":
    case "auth/session-cookie-revoked":
    case "auth/user-token-expired":
    case "auth/requires-recent-login":
      return "Your session has expired, please sign in again";
    case "auth/too-many-requests":
      return "Too many attempts, please try again later";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled";
    case "auth/network-request-failed":
      return "Network error, please check your connection";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled";
    case "auth/internal-error":
      return "Something went wrong, please try again";
    default:
      return "An unknown error occurred";
  }
}

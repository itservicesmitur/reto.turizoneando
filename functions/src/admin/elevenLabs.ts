import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getStorage } from "firebase-admin/storage";
import { defineSecret } from "firebase-functions/params";

const elevenLabsApiKeySecret = defineSecret("ELEVEN_LABS_API_KEY");

export const getElevenLabsVoices = onCall({
  secrets: [elevenLabsApiKeySecret]
}, async (request) => {
  // 1. Validate auth
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  // 2. Validate custom claims for Admin role
  if (request.auth.token.role !== "Admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  const apiKey = elevenLabsApiKeySecret.value().trim();
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "ElevenLabs API key is not configured.");
  }

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": apiKey
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    throw new HttpsError("internal", error.message || "Failed to fetch voices.");
  }
});

export const generateElevenLabsAudio = onCall({
  secrets: [elevenLabsApiKeySecret]
}, async (request) => {
  // 1. Validate auth
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  // 2. Validate custom claims for Admin role
  if (request.auth.token.role !== "Admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  const { text, voiceId } = request.data as { text?: string; voiceId?: string };
  if (!text || !text.trim()) {
    throw new HttpsError("invalid-argument", "Text is required.");
  }
  if (!voiceId || !voiceId.trim()) {
    throw new HttpsError("invalid-argument", "Voice ID is required.");
  }

  const apiKey = elevenLabsApiKeySecret.value().trim();
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "ElevenLabs API key is not configured.");
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId.trim()}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "accept": "audio/mpeg"
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError: any = null;
      try {
        parsedError = JSON.parse(errorText);
      } catch {
        // ignore
      }
      const message = parsedError?.detail?.message || errorText;
      if (
        message.toLowerCase().includes("subscription") ||
        message.toLowerCase().includes("billing") ||
        message.toLowerCase().includes("plan") ||
        message.toLowerCase().includes("quota")
      ) {
        throw new Error("La voz seleccionada (Capitán Turi) requiere un plan de pago en ElevenLabs. Por favor, selecciona una voz estándar gratuita (como Antoni o Rachel) o adquiere un plan en tu cuenta de ElevenLabs.");
      }
      throw new Error(message || `ElevenLabs API error: ${response.status}`);
    }

    const audioArrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(audioArrayBuffer);

    // Upload to Firebase Storage
    const bucket = getStorage().bucket();
    const uniqueFilename = `stops/narration_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.mp3`;
    const file = bucket.file(uniqueFilename);

    const downloadToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Save the file with content type and turn off resumable upload
    await file.save(audioBuffer, {
      resumable: false,
      metadata: {
        contentType: "audio/mpeg"
      }
    });

    // Explicitly set metadata with the Firebase Storage download token
    await file.setMetadata({
      metadata: {
        firebaseStorageDownloadTokens: downloadToken
      }
    });

    const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";
    let downloadUrl = "";
    if (isEmulator) {
      const storageHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST || "localhost:9199";
      downloadUrl = `http://${storageHost}/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${downloadToken}`;
    } else {
      downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${downloadToken}`;
    }
    return { downloadUrl };
  } catch (error: any) {
    throw new HttpsError("internal", error.message || "Failed to generate audio.");
  }
});

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getStorage } from "firebase-admin/storage";
import { defineSecret } from "firebase-functions/params";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const elevenLabsApiKeySecret = defineSecret("ELEVEN_LABS_API_KEY");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildDownloadUrl(bucketName: string, fileName: string, token: string, isEmulator: boolean): string {
  if (isEmulator) {
    const storageHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST || "localhost:9199";
    return `http://${storageHost}/v0/b/${bucketName}/o/${encodeURIComponent(fileName)}?alt=media&token=${token}`;
  }
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(fileName)}?alt=media&token=${token}`;
}

async function uploadBufferToStorage(buffer: Buffer, filePath: string, contentType: string): Promise<string> {
  const bucket = getStorage().bucket();
  const file = bucket.file(filePath);
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  await file.save(buffer, { resumable: false, metadata: { contentType } });
  await file.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } });

  const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";
  return buildDownloadUrl(bucket.name, filePath, token, isEmulator);
}

/**
 * Calls ElevenLabs TTS and returns the raw MP3 buffer.
 * @param {string} text - The text to convert to speech.
 * @param {string} voiceId - The ElevenLabs voice ID to use.
 * @param {string} apiKey - The ElevenLabs API key.
 * @return {Promise<Buffer>} The raw MP3 buffer.
 */
async function generateTTSBuffer(text: string, voiceId: string, apiKey: string): Promise<Buffer> {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId.trim()}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      "accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text: text.trim(),
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
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
      throw new Error("La voz seleccionada requiere un plan de pago en ElevenLabs. Por favor, selecciona una voz estándar gratuita (como Antoni o Rachel) o adquiere un plan en tu cuenta de ElevenLabs.");
    }
    throw new Error(message || `ElevenLabs TTS error: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

/**
 * Calls ElevenLabs Sound Generation API and returns the raw MP3 buffer.
 * @param {string} musicPrompt - The prompt describing the music to generate.
 * @param {number} durationSeconds - The duration of the music clip in seconds (0.5–22).
 * @param {string} apiKey - The ElevenLabs API key.
 * @return {Promise<Buffer>} The raw MP3 buffer.
 */
async function generateMusicBuffer(musicPrompt: string, durationSeconds: number, apiKey: string): Promise<Buffer> {
  // ElevenLabs Sound Generation supports 0.5–22 seconds per call.
  // We cap at 22 seconds and then loop with ffmpeg when mixing.
  const clampedDuration = Math.min(Math.max(durationSeconds, 0.5), 22);

  const response = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      "accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text: musicPrompt,
      duration_seconds: clampedDuration,
      prompt_influence: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs Sound Generation error: ${response.status} — ${errorText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

/**
 * Mixes narration + looping background music using ffmpeg.
 * Narration plays at full volume; music is looped to match narration length.
 * @param {Buffer} narrationBuf - The narration audio buffer.
 * @param {Buffer} musicBuf - The background music audio buffer.
 * @param {number} musicVolume - The music volume level (0–1), default 0.12.
 * @return {Promise<Buffer>} The mixed MP3 as a Buffer.
 */
function mixAudioBuffers(narrationBuf: Buffer, musicBuf: Buffer, musicVolume = 0.12): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const id = Date.now() + "_" + Math.random().toString(36).substring(2, 7);
  const narrationPath = path.join(tmpDir, `narration_${id}.mp3`);
  const musicPath = path.join(tmpDir, `music_${id}.mp3`);
  const outputPath = path.join(tmpDir, `mixed_${id}.mp3`);

  fs.writeFileSync(narrationPath, narrationBuf);
  fs.writeFileSync(musicPath, musicBuf);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(narrationPath)
      // Loop music indefinitely so it always matches narration length
      .input(musicPath).inputOptions(["-stream_loop", "-1"])
      .complexFilter([
        // normalize=0 avoids amix dividing each stream by input count (which would halve volumes)
        // music is looped to match narration duration, then mixed at musicVolume
        `[0:a]volume=2[narr];[1:a]volume=${musicVolume}[bg];[narr][bg]amix=inputs=2:duration=first[out]`,
      ])
      .outputOptions(["-map", "[out]", "-c:a", "libmp3lame", "-q:a", "3"])
      .format("mp3")
      .output(outputPath)
      .on("end", () => {
        const buf = fs.readFileSync(outputPath);
        // Clean up temp files
        [narrationPath, musicPath, outputPath].forEach((f) => {
          try {
            fs.unlinkSync(f);
          } catch {
            // ignore
          }
        });
        resolve(buf);
      })
      .on("error", (err) => {
        [narrationPath, musicPath, outputPath].forEach((f) => {
          try {
            fs.unlinkSync(f);
          } catch {
            // ignore
          }
        });
        reject(err);
      })
      .run();
  });
}

function adjustAudioSpeed(audioBuf: Buffer, speed: number): Promise<Buffer> {
  if (!speed || speed === 1.0) return Promise.resolve(audioBuf);

  const tmpDir = os.tmpdir();
  const id = Date.now() + "_" + Math.random().toString(36).substring(2, 7);
  const inputPath = path.join(tmpDir, `input_${id}.mp3`);
  const outputPath = path.join(tmpDir, `speed_${id}.mp3`);

  fs.writeFileSync(inputPath, audioBuf);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputPath)
      .audioFilter(`atempo=${speed}`)
      .format("mp3")
      .output(outputPath)
      .on("end", () => {
        try {
          const buf = fs.readFileSync(outputPath);
          [inputPath, outputPath].forEach((f) => {
            try {
 fs.unlinkSync(f);
} catch {/* ignore */}
          });
          resolve(buf);
        } catch (readErr) {
          reject(readErr);
        }
      })
      .on("error", (err) => {
        [inputPath, outputPath].forEach((f) => {
          try {
 fs.unlinkSync(f);
} catch {/* ignore */}
        });
        reject(err);
      })
      .run();
  });
}


// ─── Music presets ────────────────────────────────────────────────────────────
// Admins can pick one of these in the UI; each maps to a Sound Generation prompt.

export const MUSIC_PRESETS: Record<string, string> = {
  // ── Ambiente / Exploración ──
  historico: "Soft orchestral ambient background music, historical tour, gentle strings and piano, calming and mysterious, no melody, loop-friendly",
  naturaleza: "Peaceful nature sounds with soft acoustic guitar, birds chirping, wind, relaxing outdoor atmosphere, ambient loop",
  colonial: "Colonial Caribbean acoustic guitar and light percussion, warm and nostalgic, historical ambience, subtle background loop",
  aventura: "Adventurous light orchestral background music, exploration mood, subtle brass and strings, energetic but calm",
  tropical: "Tropical lounge background music, marimba and light bossa nova, Caribbean vibes, relaxing and upbeat, ambient loop",
  mar: "Gentle ocean waves with soft ambient underscore, distant seagulls, peaceful maritime atmosphere, meditative and soothing, loop-friendly",
  // ── Pirata / Suspenso / Motivación ──
  pirata: "Dramatic pirate adventure background music, swashbuckling brass and percussion, bold and cinematic, heroic nautical theme, loop-friendly",
  suspenso: "Dark suspenseful background music, tense strings and low brass, mysterious and foreboding, pirate treasure hunt atmosphere, building tension",
  misterio: "Mysterious underground cave ambience, eerie low strings, subtle ominous tones, hidden treasure suspense, cinematic background loop",
  epico: "Epic motivational orchestral background music, powerful brass fanfare, triumphant strings, inspiring adventure theme, heroic and energizing",
  descubrimiento: "Triumphant discovery fanfare background music, uplifting brass and strings, sense of wonder and achievement, cinematic adventure theme",
  taberna: "Lively pirate tavern background music, upbeat fiddle and accordion, joyful seafaring folk music, energetic and festive, Caribbean loop",
};

/** Generates a short music preview clip (~10 s) and uploads it to Storage. */
export const previewMusicTrack = onCall({
  secrets: [elevenLabsApiKeySecret],
  timeoutSeconds: 120,
  memory: "512MiB",
}, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required");
  if ((request.auth.token.role as string | undefined)?.toLowerCase() !== "admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  const { musicPreset } = request.data as { musicPreset?: string };
  if (!musicPreset || !MUSIC_PRESETS[musicPreset]) {
    throw new HttpsError("invalid-argument", "musicPreset is required and must be a valid preset key.");
  }

  const apiKey = elevenLabsApiKeySecret.value().trim();
  if (!apiKey) throw new HttpsError("failed-precondition", "ElevenLabs API key is not configured.");

  try {
    const musicBuffer = await generateMusicBuffer(MUSIC_PRESETS[musicPreset], 10, apiKey);
    const fileName = `stops/music_preview_${musicPreset}_${Date.now()}.mp3`;
    const downloadUrl = await uploadBufferToStorage(musicBuffer, fileName, "audio/mpeg");
    return { downloadUrl };
  } catch (error: any) {
    throw new HttpsError("internal", error.message || "Failed to generate music preview.");
  }
});

// ─── Cloud Functions ──────────────────────────────────────────────────────────

export const getElevenLabsVoices = onCall({
  secrets: [elevenLabsApiKeySecret],
}, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required");
  if ((request.auth.token.role as string | undefined)?.toLowerCase() !== "admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  const apiKey = elevenLabsApiKeySecret.value().trim();
  if (!apiKey) throw new HttpsError("failed-precondition", "ElevenLabs API key is not configured.");

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey },
    });
    if (!response.ok) {
      throw new Error(await response.text() || `ElevenLabs API error: ${response.status}`);
    }
    const data = await response.json();
    if (data && Array.isArray(data.voices)) {
      const exists = data.voices.some((v: any) => v.voice_id === "cQIBhnciTWugZAxX52uW");
      if (!exists) {
        data.voices.push({
          voice_id: "cQIBhnciTWugZAxX52uW",
          name: "Charlee Fantasy",
          category: "cloned",
        });
      }
    }
    return data;
  } catch (error: any) {
    throw new HttpsError("internal", error.message || "Failed to fetch voices.");
  }
});

/**
 * Generates ElevenLabs TTS narration and optionally mixes it with
 * background music generated by ElevenLabs Sound Generation.
 *
 * Params:
 *   text        — narration text
 *   voiceId     — ElevenLabs voice ID
 *   musicPreset — (optional) key from MUSIC_PRESETS, or "none" / omitted for no music
 *   musicVolume — (optional) 0–1, default 0.2 (20% volume for background music)
 */
export const generateElevenLabsAudio = onCall({
  secrets: [elevenLabsApiKeySecret],
  timeoutSeconds: 300,
  memory: "1GiB",
}, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Authentication required");
  if ((request.auth.token.role as string | undefined)?.toLowerCase() !== "admin") {
    throw new HttpsError("permission-denied", "Access denied: Administrator privileges required.");
  }

  const { text, voiceId, musicPreset, musicVolume, speed } = request.data as {
    text?: string;
    voiceId?: string;
    musicPreset?: string;
    musicVolume?: number;
    speed?: number;
  };

  if (!text?.trim()) throw new HttpsError("invalid-argument", "Text is required.");
  if (!voiceId?.trim()) throw new HttpsError("invalid-argument", "Voice ID is required.");

  const apiKey = elevenLabsApiKeySecret.value().trim();
  if (!apiKey) throw new HttpsError("failed-precondition", "ElevenLabs API key is not configured.");

  const useMusicPreset = musicPreset && musicPreset !== "none" && MUSIC_PRESETS[musicPreset];

  try {
    // 1. Generate narration
    const rawNarrationBuffer = await generateTTSBuffer(text, voiceId, apiKey);
    const targetSpeed = typeof speed === "number" ? Math.min(Math.max(speed, 0.5), 2.0) : 1.0;
    const narrationBuffer = await adjustAudioSpeed(rawNarrationBuffer, targetSpeed);

    let finalBuffer = narrationBuffer;
    let fileName: string;

    if (useMusicPreset) {
      // 2. Generate background music (~22 sec, will be looped by ffmpeg to match narration)
      const musicPrompt = MUSIC_PRESETS[musicPreset ?? ""];
      const musicBuffer = await generateMusicBuffer(musicPrompt, 22, apiKey);

      // 3. Mix narration + music
      const volume = typeof musicVolume === "number"
        ? Math.min(Math.max(musicVolume, 0), 1)
        : 0.12;

      finalBuffer = await mixAudioBuffers(narrationBuffer, musicBuffer, volume);
      fileName = `stops/narration_mixed_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.mp3`;
    } else {
      fileName = `stops/narration_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.mp3`;
    }

    // 4. Upload to Firebase Storage
    const downloadUrl = await uploadBufferToStorage(finalBuffer, fileName, "audio/mpeg");
    return { downloadUrl };
  } catch (error: any) {
    throw new HttpsError("internal", error.message || "Failed to generate audio.");
  }
});

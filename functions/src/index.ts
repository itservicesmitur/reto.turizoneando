/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp();



// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });




export { getPlayers } from "./admin/getPlayers";
export { getPlayerAttempts } from "./admin/getPlayerAttempts";
export { resetPlayer } from "./admin/resetPlayer";
export { updatePlayerProfile } from "./admin/updatePlayerProfile";
export {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  updateSelfAdmin
} from "./admin/admins";
export {
  getLocals,
  createLocal,
  updateLocal,
  deleteLocal
} from "./admin/locals";
export {
  getProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  changeProviderPassword
} from "./admin/providers";
export {
  createSeason,
  updateSeason,
  deleteSeason
} from "./admin/seasons";
export {
  generateTestPrizeCode,
  getPublicPrizeCode,
  redeemPublicPrizeCode,
  validatePrizeCode,
  getProviderCodes
} from "./admin/prizeCodes";
export {
  getElevenLabsVoices,
  generateElevenLabsAudio,
  previewMusicTrack
} from "./admin/elevenLabs";
export { seedTestData } from "./admin/seed";
export { getStopWithQuestions } from "./game/getStopWithQuestions";
export { getCorrectAnswer } from "./game/validateAnswer";
export { registerAttempt } from "./game/registerAttempt";
export { getPlayerStatus, getPlayerStatusAdmin } from "./game/getPlayerStatus";
export { getTopTen, getMyPositionsRanking } from "./game/leaderboard";
export { getPrizes, getPrizeById, getPrizesForStage, claimPrize } from "./prizes/prizes";
export {
  sendAdminCustomEmail,
  sendAdminPasswordResetEmail,
  sendAdminPrizeCodeEmail,
  sendPlayerPrizeCodes,
  claimPrizeAndNotify,
  sendOtpEmail,
  verifyOtp,
  notifyLowStock,
} from "./email/sendGrid";



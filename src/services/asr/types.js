/**
 * ASR (automatic speech recognition) service types.
 *
 * The whisper runtime is abstracted behind `AsrEngine` so the rest of the app
 * never touches `whisper.rn` directly. Model download/install mirrors the TTS
 * neural-engine pattern (per-tier on-disk install + version sentinel).
 */
export {};

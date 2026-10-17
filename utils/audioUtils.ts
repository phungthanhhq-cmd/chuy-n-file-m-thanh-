/**
 * Decodes a base64 string into a Uint8Array.
 * @param base64 The base64 encoded string.
 * @returns A Uint8Array containing the decoded bytes.
 */
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Creates a WAV file Blob from base64 encoded audio data.
 * If the data already contains a RIFF WAV header (default for Gemini unary TTS),
 * it returns the blob directly. If it is raw PCM, it wraps it in a standard WAV header.
 * @param base64Audio The base64 encoded audio string from the Gemini API.
 * @returns A Blob representing the WAV file.
 */
export function createWavBlob(base64Audio: string): Blob {
  const pcmData = decodeBase64(base64Audio);

  // Check if it's already a complete WAV file (starts with 'RIFF' and has 'WAVE' at index 8)
  if (
    pcmData.length >= 12 &&
    pcmData[0] === 0x52 && pcmData[1] === 0x49 && pcmData[2] === 0x46 && pcmData[3] === 0x46 && // 'RIFF'
    pcmData[8] === 0x57 && pcmData[9] === 0x41 && pcmData[10] === 0x56 && pcmData[11] === 0x45    // 'WAVE'
  ) {
    return new Blob([pcmData], { type: 'audio/wav' });
  }

  // Fallback: If raw PCM, synthesize a standard 24kHz mono 16-bit WAV header
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const chunkSize = 36 + dataSize;
  const fileSize = 4 + chunkSize;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF header
  writeString(0, 'RIFF');
  view.setUint32(4, fileSize, true);
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM data
  for (let i = 0; i < dataSize; i++) {
    view.setUint8(44 + i, pcmData[i]);
  }

  return new Blob([view], { type: 'audio/wav' });
}

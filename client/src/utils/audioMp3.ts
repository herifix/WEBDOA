
interface LamejsEncoder {
  encodeBuffer: (buffer: Int16Array) => Int8Array;
  flush: () => Int8Array;
}

interface LamejsStatic {
  Mp3Encoder: new (channels: number, samplerate: number, kbps: number) => LamejsEncoder;
}

// Use global lamejs from index.html CDN to avoid Vite bundling issues (MPEGMode error)
const lamejs = (window as any).lamejs as LamejsStatic;

const MP3_BITRATE_KBPS = 128;
const MP3_BLOCK_SIZE = 1152;

function mergeToMono(audioBuffer: AudioBuffer) {
  const length = audioBuffer.length;
  const mono = new Float32Array(length);
  const channels = Math.max(audioBuffer.numberOfChannels, 1);

  for (let channel = 0; channel < channels; channel += 1) {
    const data = audioBuffer.getChannelData(channel);
    for (let index = 0; index < length; index += 1) {
      mono[index] += data[index] / channels;
    }
  }

  return mono;
}

function float32ToInt16(samples: Float32Array) {
  const result = new Int16Array(samples.length);
  for (let index = 0; index < samples.length; index += 1) {
    const value = Math.max(-1, Math.min(1, samples[index] ?? 0));
    result[index] = value < 0 ? value * 0x8000 : value * 0x7fff;
  }

  return result;
}

async function decodeBlobToAudioBuffer(blob: Blob) {
  const audioContext = new AudioContext();

  try {
    const arrayBuffer = await blob.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    await audioContext.close();
  }
}

function toSafeUint8Array(chunk: Uint8Array) {
  const normalized = new Uint8Array(chunk.byteLength);
  normalized.set(chunk);
  return normalized;
}

export async function convertRecordedBlobToMp3File(blob: Blob, fileName: string) {
  const audioBuffer = await decodeBlobToAudioBuffer(blob);
  const monoSamples = float32ToInt16(mergeToMono(audioBuffer));
  const encoder = new lamejs.Mp3Encoder(1, audioBuffer.sampleRate, MP3_BITRATE_KBPS);
  const mp3Chunks: BlobPart[] = [];

  for (let index = 0; index < monoSamples.length; index += MP3_BLOCK_SIZE) {
    const chunk = monoSamples.subarray(index, index + MP3_BLOCK_SIZE);
    const encoded = encoder.encodeBuffer(chunk);
    if (encoded.length > 0) {
      mp3Chunks.push(toSafeUint8Array(Uint8Array.from(encoded)));
    }
  }

  const flushed = encoder.flush();
  if (flushed.length > 0) {
    mp3Chunks.push(toSafeUint8Array(Uint8Array.from(flushed)));
  }

  const mp3Blob = new Blob(mp3Chunks, { type: "audio/mpeg" });
  return new File([mp3Blob], fileName, {
    type: "audio/mpeg",
    lastModified: Date.now(),
  });
}

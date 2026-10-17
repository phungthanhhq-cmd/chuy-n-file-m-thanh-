interface TTSRequest {
  text: string;
  voiceId: string;
  speed: number;
  pitch: number;
  isSSML: boolean;
  style?: string;
}

export async function generateSpeech({ text, voiceId, speed, pitch, isSSML, style }: TTSRequest): Promise<string> {
  const response = await fetch('/api/generate-speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voiceId,
      speed,
      pitch,
      isSSML,
      style,
    }),
  });

  if (!response.ok) {
    let errorMessage = `Yêu cầu thất bại với mã trạng thái ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData?.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Fallback to text or status
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  if (!data?.audio) {
    throw new Error('Không nhận được dữ liệu âm thanh hợp lệ từ máy chủ.');
  }

  return data.audio;
}

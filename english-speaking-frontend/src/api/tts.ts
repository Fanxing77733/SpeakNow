/**
 * 调用后端 TTS 合成语音
 * @param text 要合成的文本
 * @param voice 语音名称（默认 en-US-AriaNeural）
 * @returns 音频 Blob（audio/mpeg）
 */
export async function synthesizeTTS(text: string, voice?: string): Promise<Blob | null> {
  try {
    const response = await fetch('/api/v1/tts/synthesize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify({ text, voice }),
    })

    if (!response.ok || response.status === 204) {
      return null
    }

    return await response.blob()
  } catch {
    return null
  }
}

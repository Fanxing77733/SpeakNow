/**
 * WebM → WAV 转换工具
 * 浏览器 MediaRecorder 默认输出 WebM/Opus，腾讯云 ASR 需要 WAV/PCM
 */

/**
 * 将 WebM Blob 转换为 WAV Blob（16kHz Mono 16-bit PCM）
 */
export async function webmToWav(webmBlob: Blob): Promise<Blob> {
  const arrayBuffer = await webmBlob.arrayBuffer()
  const audioCtx = new AudioContext({ sampleRate: 16000 })
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
  await audioCtx.close()

  // 重采样到 16kHz Mono
  const targetSampleRate = 16000
  const offlineCtx = new OfflineAudioContext(
    1,
    Math.ceil(audioBuffer.duration * targetSampleRate),
    targetSampleRate
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = audioBuffer
  source.connect(offlineCtx.destination)
  source.start()
  const rendered = await offlineCtx.startRendering()

  // 编码为 16-bit PCM
  const channel = rendered.getChannelData(0)
  const pcmBuffer = new ArrayBuffer(44 + channel.length * 2)
  const view = new DataView(pcmBuffer)

  // WAV 头部
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + channel.length * 2, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)          // chunk size
  view.setUint16(20, 1, true)           // PCM = 1
  view.setUint16(22, 1, true)           // Mono
  view.setUint32(24, targetSampleRate, true)
  view.setUint32(28, targetSampleRate * 2, true) // byte rate
  view.setUint16(32, 2, true)           // block align
  view.setUint16(34, 16, true)          // bits per sample
  writeString(view, 36, 'data')
  view.setUint32(40, channel.length * 2, true)

  // PCM 数据（Float32 → Int16）
  let offset = 44
  for (let i = 0; i < channel.length; i++) {
    const sample = Math.max(-1, Math.min(1, channel[i]))
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
    offset += 2
  }

  return new Blob([pcmBuffer], { type: 'audio/wav' })
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

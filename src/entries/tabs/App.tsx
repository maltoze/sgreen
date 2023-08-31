import { useEffect, useRef, useState } from 'react'
import Confetti from 'react-confetti'
import Recorder from '~/lib/recording'
import { RecordingOptions } from '~/types'

const params = new URLSearchParams(location.search)
const tabId = params.get('tabId')

const recorder = new Recorder()

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'stop-recording') {
    recorder.stop()
  }
})

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoUrl, setVideoUrl] = useState<string>(params.get('videoUrl') || '')

  useEffect(() => {
    if (!tabId) return
    const desktopMediaRequestId = chrome.desktopCapture.chooseDesktopMedia(
      ['screen', 'window', 'audio'],
      (streamId, { canRequestAudioTrack }) => {
        recorder.start(
          {
            streamId,
            audio: canRequestAudioTrack,
            recordingMode: 'desktop',
          } as RecordingOptions,
          (url) => setVideoUrl(url)
        )
        tabId && chrome.tabs.update(parseInt(tabId), { active: true })
      }
    )
    return () => {
      chrome.desktopCapture.cancelChooseDesktopMedia(desktopMediaRequestId)
    }
  }, [])

  if (!videoUrl) return null

  return (
    <>
      <Confetti recycle={false} gravity={0.5} numberOfPieces={300} />
      <main className="flex h-screen items-center justify-center bg-gradient-to-tr from-purple-100 via-green-50 to-pink-100 p-10 lg:p-20">
        <video
          className="max-h-full rounded-lg shadow-[0_4px_6px_-1px_rgb(0_0_0_/0.1),0_2px_4px_-2px_rgb(0_0_0/0.1),0_-2px_4px_-1px_rgb(0_0_0_/0.1)]"
          controls
          ref={videoRef}
          src={videoUrl}
          preload="metadata"
        />
      </main>
    </>
  )
}

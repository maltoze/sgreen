import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import { format } from 'date-fns'
import { useRef } from 'react'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

const params = new URLSearchParams(location.search)
const videoUrl = params.get('videoUrl')

const ffmpeg = new FFmpeg()

async function loadFFmpeg() {
  await ffmpeg.load({
    // coreURL: await toBlobURL('/ffmpeg-core.js', 'text/javascript'),
    // wasmURL: await toBlobURL('/ffmpeg-core.wasm', 'application/wasm'),
    // workerURL: await toBlobURL('/ffmpeg-core.worker.js', 'text/javascript'),
    coreURL: new URL('/ffmpeg-core.js', import.meta.url).href,
    wasmURL: new URL('/ffmpeg-core.wasm', import.meta.url).href,
    workerURL: new URL('/ffmpeg-core.worker.js', import.meta.url).href,
  })
  console.log('ffmpeg loaded')
}
ffmpeg.on('log', ({ message }) => {
  console.log(message)
})

loadFFmpeg()

function generateOutputFilename(extension: string) {
  return `sgreen-${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.${extension}`
}

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null)

  async function handleOnClick() {
    if (!videoRef.current || !videoUrl) return

    await ffmpeg.writeFile('input.webm', await fetchFile(videoUrl))
    const outputFormat = 'mp4'
    const outputName = generateOutputFilename(outputFormat)
    await ffmpeg.exec([
      '-i',
      'input.webm',
      '-vsync',
      'vfr',
      outputName,
    ])
    console.log('done')
    const data = (await ffmpeg.readFile(outputName)) as Uint8Array
    // videoRef.current.src = URL.createObjectURL(
    //   new Blob([data.buffer], { type: 'video/mp4' }),
    // )
    const a = document.createElement('a')
    a.href = URL.createObjectURL(
      new Blob([data.buffer], { type: `video/${outputFormat}` }),
    )
    a.download = outputName
    a.click()
  }

  if (!videoUrl) {
    return null
  }

  return (
    <main className="flex h-screen items-center justify-center">
      <div className="flex grow justify-center p-20">
        <video
          className="h-full rounded-lg shadow-[0_4px_6px_-1px_rgb(0_0_0_/0.1),0_2px_4px_-2px_rgb(0_0_0/0.1),0_-2px_4px_-1px_rgb(0_0_0_/0.1)]"
          controls
          ref={videoRef}
          src={videoUrl}
          preload="metadata"
        />
      </div>
      <div className="flex h-full w-96 flex-col space-y-4 bg-background/30 p-6 shadow-md backdrop-blur md:w-[512px] lg:w-[768px]">
        <div className="space-y-2">
          <Label>Resolution</Label>
          <Select defaultValue="1920*1080">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="1280*720">1280 * 720</SelectItem>
                <SelectItem value="1920*1080">1920 * 1080</SelectItem>
                <SelectItem value="2560*1440">2560 * 1440</SelectItem>
                <SelectItem value="3840*2160">3840 * 2160</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Format</Label>
          <Select defaultValue="webm">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="webm">.webm</SelectItem>
                <SelectItem value="mp4">.mp4</SelectItem>
                <SelectItem value="avi">.avi</SelectItem>
                <SelectItem value="mov">.mov</SelectItem>
                <SelectItem value="flv">.flv</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Button onClick={handleOnClick}>Save</Button>
        </div>
      </div>
    </main>
  )
}

export interface IconProps extends React.SVGAttributes<SVGElement> {
  children?: never
  color?: string
}

export interface RecordingOptions {
  streamId: string
  width: number
  height: number
  audio: boolean
  showKeystrokes: boolean
  scrollbarHidden: boolean
  recordingMode: RecordingMode
  area: {
    x: number
    y: number
    width: number
    height: number
  },
  enableBackground: boolean
  selectedBackground: number
}

export interface ChromeRuntimeMessage<T> {
  type: string
  data?: T
  target?: string
}
export type RecordingMode = 'tab' | 'desktop' | 'area'

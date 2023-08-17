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
}

export interface ChromeRuntimeMessage<T> {
  type: string
  data?: T
  target?: string
}
export type RecordingMode = 'tab' | 'desktop' | 'application' | 'area'

export interface IconProps extends React.SVGAttributes<SVGElement> {
  children?: never
  color?: string
}
export interface RecordingOptions {
  width: number
  height: number
  recordingId: string
  streamId?: string
  audio?: boolean
}

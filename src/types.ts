export interface IconProps extends React.SVGAttributes<SVGElement> {
  children?: never
  color?: string
}

export interface RecordingOptions {
  width: number
  height: number
  streamId?: string
  audio?: boolean
}

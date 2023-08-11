import { create } from 'zustand'
import { RecordingOptions } from '~/types'

export interface IContentState {
  audio: boolean
  showKeystrokes: boolean
  streamId: string
  showCountdown: boolean
  isRecording: boolean
}

// const persistKeys = ['audio', 'showKeyStrokes']

export const useStore = create<IContentState>()(
  (_set, _get) => ({
    streamId: '',
    showKeystrokes: false,
    audio: false,
    showCountdown: false,
    isRecording: false,
  }),
  // {
  //   name: 'sgreen-storage',
  //   storage: createJSONStorage(() => chromeSessionStorage),
  //   partialize: (state) =>
  //     Object.fromEntries(
  //       Object.entries(state).filter(([key]) => persistKeys.includes(key)),
  //     ),
  // },
)

export const setRecordingData = ({
  audio,
  showKeystrokes,
  streamId,
}: RecordingOptions) =>
  useStore.setState({
    audio,
    showKeystrokes,
    streamId,
  })

export const setShowCountdown = (value: boolean) =>
  useStore.setState({
    showCountdown: value,
  })

export const setIsRecording = (recording: boolean) =>
  useStore.setState({ isRecording: recording })

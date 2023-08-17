import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { localStorageName } from '~/constants'
import { chromeLocalStorage } from '~/lib/storage'
import { RecordingMode } from '~/types'

export interface IState {
  isRecording: boolean
  scrollbarHidden: boolean
  audio: boolean
  showKeystrokes: boolean
  showControlbar: boolean
  showCountdown: boolean
  recordingMode: RecordingMode
  countdown: number
}

const persistKeys = [
  'scrollbarHidden',
  'showKeystrokes',
  'audio',
  'isRecording',
]

export const useStore = create<IState>()(
  persist(
    (_set, _get) => ({
      isRecording: false,
      scrollbarHidden: false,
      showKeystrokes: false,
      audio: false,
      showControlbar: false,
      showCountdown: false,
      recordingMode: 'tab',
      countdown: 3,
    }),
    {
      name: localStorageName,
      storage: createJSONStorage(() => chromeLocalStorage),
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => persistKeys.includes(key)),
        ),
    },
  ),
)

export const setIsRecording = (recording: boolean) =>
  useStore.setState({ isRecording: recording })
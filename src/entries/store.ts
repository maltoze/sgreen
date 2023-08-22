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
  showSelectingArea: boolean
  recordingMode: RecordingMode
  countdown: number
  showMouseClicks: boolean
  area: {
    x: number
    y: number
    width: number
    height: number
  }
}

const persistKeys = [
  'scrollbarHidden',
  'showKeystrokes',
  'audio',
  'isRecording',
  'countdown',
  'showMouseClicks',
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
      showSelectingArea: false,
      recordingMode: 'tab',
      countdown: 3,
      area: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      },
      showMouseClicks: false,
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

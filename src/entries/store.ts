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
  showCountdown: boolean
  recordingMode: RecordingMode
  countdown: number
  showMouseClicks: boolean
  showControlbar: boolean
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
  'countdown',
  'showMouseClicks',
  'recordingMode',
  'area',
]

export const useStore = create<IState>()(
  persist(
    (_set, _get) => ({
      isRecording: false,
      scrollbarHidden: false,
      showKeystrokes: false,
      audio: false,
      showCountdown: false,
      recordingMode: 'tab',
      countdown: 3,
      area: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      },
      showMouseClicks: false,
      showControlbar: false,
    }),
    {
      name: localStorageName,
      storage: createJSONStorage(() => chromeLocalStorage),
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => persistKeys.includes(key)),
        ),
      merge: (persistedState, currentState) => {
        const {
          isRecording: _isRecording,
          showControlbar: _showControlbar,
          showCountdown: _showCountdown,
          ...persistedPreferences
        } = (persistedState ?? {}) as Partial<IState>

        return { ...currentState, ...persistedPreferences }
      },
    },
  ),
)

export const setIsRecording = (recording: boolean) =>
  useStore.setState({ isRecording: recording })

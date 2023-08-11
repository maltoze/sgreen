import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { localStorageName } from '~/constants'
import { chromeLocalStorage } from '~/lib/storage'

export interface IContentState {
  audio: boolean
  showKeystrokes: boolean
  streamId: string
  showCountdown: boolean
  isRecording: boolean
  recordingTabId?: number | null
  tabId?: number | null
  scrollbarHidden: boolean
}

const persistKeys = [
  'showKeystrokes',
  'isRecording',
  'recordingTabId',
  'scrollbarHidden',
]

export const useStore = create<IContentState>()(
  persist(
    (_set, _get) => ({
      showKeystrokes: false,
      audio: false,
      showCountdown: false,
      isRecording: false,
      streamId: '',
      tabId: null,
      recordingTabId: null,
      scrollbarHidden: false,
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

export const setRecordingData = ({
  audio,
  showKeystrokes,
  streamId,
  recordingTabId,
  scrollbarHidden,
}: IContentState) =>
  useStore.setState({
    audio,
    showKeystrokes,
    streamId,
    recordingTabId,
    scrollbarHidden,
  })

export const setShowCountdown = (value: boolean) =>
  useStore.setState({
    showCountdown: value,
  })

export const setIsRecording = (recording: boolean) =>
  useStore.setState({ isRecording: recording })

export const setTabId = (tabId: number) => useStore.setState({ tabId })

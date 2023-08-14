import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { localStorageName } from '~/constants'
import { chromeLocalStorage } from '~/lib/storage'

export interface IContentState {
  isRecording: boolean
}

const persistKeys = ['isRecording']

export const useStore = create<IContentState>()(
  persist(
    (_set, _get) => ({
      isRecording: false,
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

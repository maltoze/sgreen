import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { chromeSyncStorage } from '~/lib/storage'

export interface IPopupState {
  audio: boolean
  showKeystrokes: boolean
  scrollbarHidden: boolean
}

const persistKeys = ['showKeystrokes', 'audio', 'scrollbarHidden']

export const useStore = create<IPopupState>()(
  persist(
    (_set) => ({
      showKeystrokes: false,
      audio: false,
      scrollbarHidden: false,
    }),
    {
      name: 'sgreen-sync-storage',
      storage: createJSONStorage(() => chromeSyncStorage),
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => persistKeys.includes(key)),
        ),
    },
  ),
)

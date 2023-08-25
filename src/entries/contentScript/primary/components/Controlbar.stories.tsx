import type { Meta, StoryObj } from '@storybook/react'
import Controlbar from './Controlbar'

const meta: Meta<typeof Controlbar> = {
  component: Controlbar,
  argTypes: {
    onClose: { action: 'onClose' },
    appRoot: { table: { disable: true } },
  },
}

export default meta

type Story = StoryObj<typeof Controlbar>

const chrome = {
  storage: {
    local: {
      get: (key: string, callback: (items: string) => void) => {
        const item = { [key]: localStorage.getItem(key) }
        callback(JSON.stringify(item))
      },

      set: (items: { [key: string]: string }) => {
        Object.keys(items).forEach((key) =>
          localStorage.setItem(key, items[key])
        )
      },
      remove: (key: string, callback: () => void) => {
        localStorage.removeItem(key)
        callback()
      },
    },
  },
  runtime: {
    sendMessage: () => {},
  },
}
// polyfill chrome
// @ts-ignore
window.chrome.storage = chrome.storage
// @ts-ignore
window.chrome.runtime = chrome.runtime

export const ControlbarStory: Story = {
  render: ({ onClose }) => <Controlbar onClose={onClose} />,
}

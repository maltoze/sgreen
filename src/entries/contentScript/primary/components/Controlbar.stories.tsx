import type { Meta, StoryObj } from '@storybook/react'
import Controlbar from './Controlbar'
import '~/lib/storybook-polyfill'

const meta: Meta<typeof Controlbar> = {
  component: Controlbar,
  argTypes: {
    onClose: { action: 'onClose' },
    appRoot: { table: { disable: true } },
  },
}

export default meta

type Story = StoryObj<typeof Controlbar>

export const ControlbarStory: Story = {
  render: ({ onClose }) => <Controlbar onClose={onClose} />,
}

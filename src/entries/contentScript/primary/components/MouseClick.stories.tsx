import type { Meta, StoryObj } from '@storybook/react'
import MouseClick from './MouseClick'

const meta: Meta<typeof MouseClick> = {
  component: MouseClick,
}

export default meta

type Story = StoryObj<typeof MouseClick>

export const MouseClickStory: Story = {}

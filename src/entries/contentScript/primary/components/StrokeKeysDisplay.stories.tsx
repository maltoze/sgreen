import type { Meta, StoryObj } from '@storybook/react'
import StrokeKeysDisplay from './StrokeKeysDisplay'

const meta: Meta<typeof StrokeKeysDisplay> = {
  component: StrokeKeysDisplay,
}

export default meta

type Story = StoryObj<typeof StrokeKeysDisplay>

export const StrokeKeysDisplayStory: Story = {
  render: () => <StrokeKeysDisplay />,
}

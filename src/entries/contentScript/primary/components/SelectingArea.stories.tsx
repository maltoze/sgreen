import type { Meta, StoryObj } from '@storybook/react'
import SelectingArea from './SelectingArea'
import '~/lib/storybook-polyfill'

const meta: Meta<typeof SelectingArea> = {
  component: SelectingArea,
}

export default meta

type Story = StoryObj<typeof SelectingArea>

export const SelectingAreaStory: Story = {}

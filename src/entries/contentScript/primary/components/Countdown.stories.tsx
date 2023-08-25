import type { Meta, StoryObj } from '@storybook/react'
import Countdown from './Countdown'

const meta: Meta<typeof Countdown> = {
  component: Countdown,
  argTypes: {
    onFinish: { action: 'onFinish' },
    count: {
      control: { type: 'number', min: 0, max: 10 },
    },
  },
}

export default meta

type Story = StoryObj<typeof Countdown>

export const CountdownStory: Story = {
  render: ({ count, onFinish }) => (
    <Countdown key={count} count={count} onFinish={onFinish} />
  ),
  args: {
    count: 3,
  },
}

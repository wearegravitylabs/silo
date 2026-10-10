// Scripted Silo AI replies until the API exists. Each prompt maps to how the assistant works
// (label + steps + delay) and what it answers. `pending` carries a multi-step action between turns.
import type { AssetAttachment, PendingAction, ReplyLink, WorkingLabel } from './types'

export interface MockReply {
  label: WorkingLabel
  steps: string[]
  /** Shimmer bars under the label while working. */
  placeholder?: boolean
  /** How long the working state lasts before the reply streams in. */
  delay: number
  text: string
  attachment?: AssetAttachment
  link?: ReplyLink
  /** What the assistant waits for next; omitted clears it. */
  pending?: PendingAction
}

/** Thrown by the mock to exercise the error state ("Simulate an error"). */
export class MockReplyError extends Error {}

export function mockReply(prompt: string, pending: PendingAction | null = null, { retry = false } = {}): MockReply {
  const p = prompt.toLowerCase()

  // Dev: fails the first time, succeeds on Retry — so the whole error → retry loop can be tried.
  if (p.includes('simulate an error')) {
    if (!retry) throw new MockReplyError("Silo AI couldn't reach your portfolio data. Check your connection and try again.")
    return {
      label: 'Thinking',
      steps: ['Retrying'],
      delay: 1000,
      text: 'That worked on the second try. Your portfolio is up **12%** this month.',
    }
  }

  // Step 2 of creating an asset: whatever the user says is taken as the acquisition date.
  if (pending?.kind === 'create-asset') {
    return {
      label: 'Processing',
      steps: [`Setting the acquisition date to "${prompt}"`, `Creating ${pending.name}`],
      placeholder: false, // the design shows only the label here
      delay: 2000,
      text: `Asset ${pending.name} has been created successfully. Please proceed to the Asset page to view the details.`,
      link: { label: 'View in Assets', section: 'assets' },
    }
  }

  // Step 1: "@Assets create a SP500 stock asset with 10,000 shares at a price of 100$ per share"
  if (p.includes('create') && (p.includes('@assets') || p.includes('asset'))) {
    const name = /s\s*&?\s*p\s*500/i.test(prompt) ? 'S&P500' : 'New asset'
    return {
      label: 'Executing',
      steps: ['Reading the asset details', `Looking up ${name}`, 'Preparing the asset'],
      delay: 1800,
      text: `You're about to create an Asset ${name === 'S&P500' ? 'SP500' : name}. Kindly specify the acquisition date to confirm creation`,
      attachment: { kind: 'asset', name, value: '$1,000,000.00', mark: name === 'S&P500' ? 'S&P' : name[0] },
      pending: { kind: 'create-asset', name },
    }
  }

  if (p.includes('how much') && p.includes('make')) {
    return {
      label: 'Thinking',
      steps: ['Reading your net worth history', 'Comparing today with one month ago'],
      delay: 1600,
      text: 'You made **₦10,000.00** over the past month.\n\nThis gain represents a **12% growth**, pushing your total net worth to the **₦1,000,000.00** milestone.',
    }
  }

  if (p.includes('crypto') && p.includes('stock')) {
    return {
      label: 'Thinking',
      steps: ['Grouping your assets by type'],
      delay: 1400,
      text: 'Stocks make up **40%** of your assets across **6** holdings, while crypto is **30%** across **4**.\n\nTogether they are **70%** of your portfolio.',
    }
  }

  if (p.includes('rebalance')) {
    return {
      label: 'Thinking',
      steps: ['Checking your allocation against common targets', 'Looking at recent volatility'],
      delay: 2000,
      text: 'Your crypto share (**30%**) is on the high side for a retirement portfolio.\n\nMoving part of it into stocks or cash would lower your exposure to big swings. This is general guidance, not financial advice.',
    }
  }

  return {
    label: 'Thinking',
    steps: ['Reading your portfolio'],
    delay: 1200,
    text: 'I can help with your net worth, allocation, gains and debts. Try asking **"How much did I make this month?"**',
  }
}

import { apiPost } from './client'
import type { ChatMessage } from '../stores/chatStore'
import type { InvestorProfile } from '../types/profile'
import type { ShortlistedProperty } from '../stores/shortlistStore'

export interface AdvisorResponse {
  reply: string
  red_flags: string[]
}

export function sendMessage(
  messages: ChatMessage[],
  profile: InvestorProfile,
  shortlist: ShortlistedProperty[]
): Promise<AdvisorResponse> {
  return apiPost('/api/advisor/chat', { messages, profile, shortlist })
}

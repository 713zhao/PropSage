import { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../stores/chatStore'
import { useProfileStore } from '../stores/profileStore'
import { useShortlistStore } from '../stores/shortlistStore'
import { sendMessage } from '../api/advisor'

function RedFlagChip({ text }: { text: string }) {
  return (
    <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg px-3 py-2 text-xs text-yellow-300">
      {text}
    </div>
  )
}

function MessageBubble({ role, content }: { role: 'user' | 'model'; content: string }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-blue-700 text-white rounded-br-sm'
            : 'bg-gray-800 text-gray-100 rounded-bl-sm border border-gray-700'
        }`}
      >
        {content}
      </div>
    </div>
  )
}

export function AdvisorPage() {
  const { messages, addMessage, clearHistory } = useChatStore()
  const { profile } = useProfileStore()
  const { properties } = useShortlistStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [redFlags, setRedFlags] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user' as const, content: text }
    addMessage(userMsg)
    setInput('')
    setLoading(true)
    setError(null)
    setRedFlags([])

    try {
      const result = await sendMessage([...messages, userMsg], profile, properties)
      addMessage({ role: 'model', content: result.reply })
      setRedFlags(result.red_flags)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const shortlistCount = properties.length
  const monthlyIncome = profile.annualIncomeSgd / 12

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-400">AI Advisor</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Powered by Gemini 2.5 Flash · advising as:{' '}
            <span className="text-gray-400">
              {profile.citizenship}
              {monthlyIncome > 0 ? `, SGD ${Math.round(monthlyIncome).toLocaleString()}/mo` : ', income not set'}
              {shortlistCount > 0 ? `, ${shortlistCount} shortlisted` : ''}
            </span>
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            Clear chat
          </button>
        )}
      </div>

      {/* Red flags */}
      {redFlags.length > 0 && (
        <div className="space-y-1 mb-3">
          {redFlags.map((f, i) => <RedFlagChip key={i} text={f} />)}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-900/50 rounded-xl border border-gray-800 p-4 mb-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-600">
            <p className="text-4xl mb-3">🤖</p>
            <p className="text-sm">Ask me anything about Singapore property investment.</p>
            <p className="text-xs mt-1">Try: "Is D10 a good district for capital appreciation?" or "Explain ABSD for PRs."</p>
          </div>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} />
        ))}
        {loading && (
          <div className="flex justify-start mb-3">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="text-gray-400 text-sm">Thinking…</span>
            </div>
          </div>
        )}
        {error && (
          <div className="flex justify-start mb-3">
            <div className="bg-red-900/30 border border-red-700 rounded-xl px-4 py-3 text-xs text-red-400">
              {error}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about any Singapore property topic… (Enter to send, Shift+Enter for new line)"
          rows={2}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 resize-none focus:outline-none focus:border-blue-500 placeholder-gray-600"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors text-sm"
        >
          Send
        </button>
      </div>
    </div>
  )
}

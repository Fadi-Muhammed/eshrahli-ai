import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function WordTooltip({ word, translation }) {
  const [show, setShow] = useState(false)

  return (
    <span className="relative inline">
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-help transition-colors"
        style={{
          borderBottom: show ? '2px dashed #00C2CB' : '2px dashed rgba(0,194,203,0.4)',
          paddingBottom: '1px',
        }}
      >
        {word}
      </span>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 6 }}
            transition={{ duration: 0.13, ease: 'easeOut' }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 pointer-events-none"
          >
            <div className="bg-gray-900 border border-[#00C2CB]/30 rounded-xl px-3 py-2 shadow-2xl whitespace-nowrap flex items-center gap-2">
              <span className="text-[9px] font-bold text-[#00C2CB] uppercase tracking-widest bg-[#00C2CB]/10 px-1.5 py-0.5 rounded-md">
                EN
              </span>
              <span className="text-white text-xs font-medium">{translation}</span>
            </div>
            <div className="flex justify-center -mt-[5px]">
              <div className="w-2.5 h-2.5 bg-gray-900 border-b border-r border-[#00C2CB]/30 rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}

// Apply glossary tooltips to a plain string — returns array of React nodes
function applyTooltips(text, glossary, keyPrefix) {
  const words = Object.keys(glossary)
  if (!words.length) return [text]

  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const regex = new RegExp(`(${escaped.join('|')})`, 'g')
  const parts = text.split(regex)
  if (parts.length === 1) return [text]

  return parts.map((part, i) =>
    glossary[part]
      ? <WordTooltip key={`${keyPrefix}-t-${i}`} word={part} translation={glossary[part]} />
      : part
  )
}

// renderInline: handles **bold** markers + glossary tooltips on a raw string.
// Use this instead of ReactMarkdown for quiz question/option text.
export function renderInline(text, glossary = {}, keyPrefix = 'ri') {
  if (!text) return null

  // Split on **...** bold markers
  const boldRegex = /(\*\*[^*\n]+?\*\*)/g
  const parts = text.split(boldRegex)

  return parts.map((part, i) => {
    const isBold = /^\*\*[^*]+\*\*$/.test(part)
    const content = isBold ? part.slice(2, -2) : part

    const inner = applyTooltips(content, glossary, `${keyPrefix}-${i}`)

    if (isBold) {
      return (
        <strong key={`${keyPrefix}-b-${i}`} style={{ color: '#00C2CB', fontWeight: 700 }}>
          {inner}
        </strong>
      )
    }
    return <span key={`${keyPrefix}-s-${i}`}>{inner}</span>
  })
}

// processChildren — used by ReactMarkdown renderers in explanation/Q&A
export function processChildren(children, glossary) {
  if (!glossary || Object.keys(glossary).length === 0) return children

  const words = Object.keys(glossary)
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const regex = new RegExp(`(${escaped.join('|')})`, 'g')

  const processText = (text) => {
    const parts = text.split(regex)
    if (parts.length === 1) return text
    return parts.map((part, i) =>
      glossary[part]
        ? <WordTooltip key={i} word={part} translation={glossary[part]} />
        : part
    )
  }

  if (Array.isArray(children)) {
    return children.map((child, i) =>
      typeof child === 'string' ? processText(child) : child
    )
  }
  if (typeof children === 'string') return processText(children)
  return children
}

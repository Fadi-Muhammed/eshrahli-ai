import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function WordTooltip({ word, translation }) {
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
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 pointer-events-none"
          >
            <div className="bg-gray-900 border border-[#00C2CB]/25 rounded-xl px-3 py-2 shadow-2xl whitespace-nowrap flex items-center gap-2">
              <span className="text-[9px] font-bold text-[#00C2CB] uppercase tracking-widest bg-[#00C2CB]/10 px-1.5 py-0.5 rounded-md">
                EN
              </span>
              <span className="text-white text-xs font-medium">{translation}</span>
            </div>
            {/* Arrow */}
            <div className="flex justify-center -mt-[5px]">
              <div
                className="w-2.5 h-2.5 bg-gray-900 border-b border-r border-[#00C2CB]/25 rotate-45"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}

// Recursively process ReactMarkdown children — wrap matched Arabic words in WordTooltip
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

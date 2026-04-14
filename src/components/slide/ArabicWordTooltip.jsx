import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import katex from 'katex'

// ─── Portal tooltip — renders into document.body, never clipped ───────────────
function TooltipPortal({ anchorRef, translation, show }) {
  const [pos, setPos] = useState(null)
  const tooltipRef = useRef(null)

  const recompute = useCallback(() => {
    if (!anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    const tipH = tooltipRef.current?.offsetHeight ?? 44
    const tipW = tooltipRef.current?.offsetWidth ?? 120
    const spaceAbove = rect.top
    const spaceBelow = window.innerHeight - rect.bottom
    const above = spaceAbove >= tipH + 8 || spaceAbove >= spaceBelow
    const left = Math.min(
      Math.max(rect.left + rect.width / 2 - tipW / 2, 8),
      window.innerWidth - tipW - 8
    )
    const top = above
      ? rect.top + window.scrollY - tipH - 10
      : rect.bottom + window.scrollY + 10

    setPos({ left, top, above })
  }, [anchorRef])

  useEffect(() => {
    if (show) recompute()
  }, [show, recompute])

  if (!show || !pos) return null

  return createPortal(
    <div
      ref={tooltipRef}
      style={{ position: 'absolute', left: pos.left, top: pos.top, zIndex: 9999, pointerEvents: 'none' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: pos.above ? 4 : -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: pos.above ? 4 : -4 }}
        transition={{ duration: 0.13, ease: 'easeOut' }}
      >
        <div className="bg-gray-900 border border-[#00C2CB]/30 rounded-xl px-3 py-2 shadow-2xl whitespace-nowrap flex items-center gap-2">
          <span className="text-[9px] font-bold text-[#00C2CB] uppercase tracking-widest bg-[#00C2CB]/10 px-1.5 py-0.5 rounded-md">
            EN
          </span>
          <span className="text-white text-xs font-medium">{translation}</span>
        </div>
        {/* Arrow — points toward the word */}
        <div className={`flex justify-center ${pos.above ? '-mt-[5px]' : 'order-first -mb-[5px] rotate-180'}`}>
          <div className="w-2.5 h-2.5 bg-gray-900 border-b border-r border-[#00C2CB]/30 rotate-45" />
        </div>
      </motion.div>
    </div>,
    document.body
  )
}

// ─── Word with tooltip ────────────────────────────────────────────────────────
export function WordTooltip({ word, translation }) {
  const [show, setShow] = useState(false)
  const anchorRef = useRef(null)

  return (
    <span className="relative inline">
      <span
        ref={anchorRef}
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
        {show && <TooltipPortal anchorRef={anchorRef} translation={translation} show={show} />}
      </AnimatePresence>
    </span>
  )
}

// ─── Apply glossary tooltips to a plain string ────────────────────────────────
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

// ─── renderInline: math + **bold** + glossary tooltips on raw strings ─────────
function renderMath(src, displayMode, key) {
  try {
    const html = katex.renderToString(src, { throwOnError: false, displayMode })
    return (
      <span
        key={key}
        className={displayMode ? 'block my-1' : 'inline'}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  } catch {
    return <span key={key}>{displayMode ? `$$${src}$$` : `$${src}$`}</span>
  }
}

export function renderInline(text, glossary = {}, keyPrefix = 'ri') {
  if (!text) return null

  // Split on $$block$$, $inline$, and **bold** in one pass
  const tokenRegex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\*\*[^*\n]+?\*\*)/g
  const parts = text.split(tokenRegex)

  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`

    if (/^\$\$[\s\S]+?\$\$$/.test(part)) {
      return renderMath(part.slice(2, -2), true, key)
    }
    if (/^\$[^$\n]+?\$$/.test(part)) {
      return renderMath(part.slice(1, -1), false, key)
    }
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      const inner = applyTooltips(part.slice(2, -2), glossary, key)
      return <strong key={`${key}-b`} style={{ color: '#00C2CB', fontWeight: 700 }}>{inner}</strong>
    }

    const inner = applyTooltips(part, glossary, key)
    return <span key={`${key}-s`}>{inner}</span>
  })
}

// ─── processChildren — for ReactMarkdown renderers (explanation / Q&A) ────────
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

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowRight, Check, Flame, Languages, Plus, RotateCcw, Save, Settings2, Trash2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'

type Vocabulary = { kanji: string | null; kana: string; romaji: string; meaning: string }
type Mode = 'kanji' | 'kana' | 'romaji' | 'meaning'
type Question = { mode: Mode; prompt: string; options: string[]; correct: string }

const DEFAULT_VOCABULARY: Vocabulary[] = [
  { meaning: 'Actor', romaji: 'Danyuu', kana: 'だんゆう', kanji: '男優' },
  { meaning: 'Actress', romaji: 'Joyuu', kana: 'じょゆう', kanji: '女優' },
  { meaning: 'Doctor', romaji: 'Isha', kana: 'いしゃ', kanji: '医者' },
  { meaning: 'Dentist', romaji: 'Haisha', kana: 'はいしゃ', kanji: '歯医者' },
  { meaning: 'Judge', romaji: 'Saibankan', kana: 'さいばんかん', kanji: '裁判官' },
  { meaning: 'Homemaker', romaji: 'Shufu', kana: 'しゅふ', kanji: '主婦' },
  { meaning: 'Prosecutor', romaji: 'Kenji', kana: 'けんじ', kanji: '検事' },
  { meaning: 'University student', romaji: 'Daigakusei', kana: 'だいがくせい', kanji: '大学生' },
  { meaning: 'Student', romaji: 'Seito', kana: 'せいと', kanji: '生徒' },
  { meaning: 'President', romaji: 'Daitouryou', kana: 'だいとうりょう', kanji: '大統領' },
  { meaning: 'Nurse', romaji: 'Kangofu', kana: 'かんごふ', kanji: '看護婦' },
  { meaning: 'Lawyer', romaji: 'Bengoshi', kana: 'べんごし', kanji: '弁護士' },
  { meaning: 'Author', romaji: 'Chosha', kana: 'ちょしゃ', kanji: '著者' },
  { meaning: 'Merchant', romaji: 'Shounin', kana: 'しょうにん', kanji: '商人' },
  { meaning: 'Bank employee', romaji: 'Ginkouin', kana: 'ぎんこういん', kanji: '銀行員' },
  { meaning: 'Civil servant', romaji: 'Koumuin', kana: 'こうむいん', kanji: '公務員' },
  { meaning: 'Interpreter', romaji: 'Tsuyaku', kana: 'つうやく', kanji: '通訳' },
  { meaning: 'Farmer', romaji: 'Noumin', kana: 'のうみん', kanji: '農民' },
  { meaning: 'Singer', romaji: 'Kashu', kana: 'かしゅ', kanji: '歌手' },
  { meaning: 'Flight attendant', romaji: 'Shuchuudesu', kana: 'スチュワーデス', kanji: '客室乗務員' },
  { meaning: 'Secretary', romaji: 'Hisho', kana: 'ひしょ', kanji: '秘書' },
  { meaning: 'Driver', romaji: 'Untenshu', kana: 'うんてんしゅ', kanji: '運転手' },
  { meaning: 'Journalist', romaji: 'Shinbunkisha', kana: 'しんぶんきしゃ', kanji: '新聞記者' },
  { meaning: 'Waiter', romaji: 'Weitaa', kana: 'ウェイター', kanji: null },
  { meaning: 'Waitress', romaji: 'Weitoresu', kana: 'ウェイトレス', kanji: null },
]

const VOCABULARY_KEY = 'japanese-quiz-vocabulary'
const EMPTY_ENTRY: Vocabulary = { meaning: '', romaji: '', kana: '', kanji: null }

function loadVocabulary(): Vocabulary[] {
  try {
    const saved = localStorage.getItem(VOCABULARY_KEY)
    if (!saved) return DEFAULT_VOCABULARY
    const parsed = JSON.parse(saved) as Vocabulary[]
    const valid = Array.isArray(parsed) ? parsed.filter((entry) => entry && typeof entry.meaning === 'string' && typeof entry.romaji === 'string' && typeof entry.kana === 'string').map((entry) => ({ meaning: entry.meaning, romaji: entry.romaji, kana: entry.kana, kanji: typeof entry.kanji === 'string' && entry.kanji ? entry.kanji : null })) : []
    return valid.length ? valid : DEFAULT_VOCABULARY
  } catch { return DEFAULT_VOCABULARY }
}

function completeEntries(entries: Vocabulary[]) {
  return entries.filter((entry) => entry.meaning.trim() && entry.romaji.trim() && entry.kana.trim())
}

function renderJapanese(value: string, vocabulary: Vocabulary[]): ReactNode {
  const entry = vocabulary.find((item) => item.kanji === value)
  return entry ? <ruby className="[ruby-align:center] [ruby-position:over] whitespace-nowrap leading-none">{value}<rt className="px-[0.04em] py-[0.08em] text-[.42em] font-normal leading-none tracking-normal text-[var(--muted-ink)]">{entry.kana}</rt></ruby> : value
}

const MODES: Mode[] = ['kanji', 'kana', 'romaji', 'meaning']
const MODE_LABEL: Record<Mode, string> = { kanji: 'KANJI', kana: 'KANA', romaji: 'ROMAJI', meaning: 'ENGLISH MEANING' }

function shuffled<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function makeQuestion(vocabulary: Vocabulary[], seed: number): Question {
  const answer = vocabulary[seed % vocabulary.length]
  const mode = MODES[Math.floor(seed / vocabulary.length) % MODES.length]
  const japanese = (item: Vocabulary) => item.kanji || item.kana
  const japaneseChoices = shuffled(vocabulary.filter((item) => item !== answer)).slice(0, 3).map(japanese)
  const meaningChoices = shuffled(vocabulary.filter((item) => item !== answer)).slice(0, 3).map((item) => item.meaning)
  const choices = mode === 'meaning' ? [...japaneseChoices, answer.kanji] : [...meaningChoices, answer.meaning]
  const prompt = mode === 'kanji' ? japanese(answer) : mode === 'kana' ? answer.kana : mode === 'romaji' ? answer.romaji : answer.meaning
  return { mode, prompt, options: shuffled(choices.filter(Boolean) as string[]), correct: mode === 'meaning' ? japanese(answer) : answer.meaning }
}

export default function JapaneseQuiz() {
  const [vocabulary, setVocabulary] = useState<Vocabulary[]>(loadVocabulary)
  const [draftVocabulary, setDraftVocabulary] = useState<Vocabulary[]>(vocabulary)
  const [editing, setEditing] = useState(false)
  const [editorError, setEditorError] = useState('')
  const [seed, setSeed] = useState(0)
  const [questionNumber, setQuestionNumber] = useState(1)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(() => Number(localStorage.getItem('japanese-quiz-best') ?? 0))
  const [selected, setSelected] = useState<string | null>(null)
  const question = useMemo(() => makeQuestion(vocabulary, seed), [seed, vocabulary])
  const roundSize = vocabulary.length
  const finished = selected !== null && questionNumber === roundSize

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return
      if (event.key >= '1' && event.key <= '4') choose(question.options[Number(event.key) - 1])
      if (event.key === 'Enter' && selected) nextQuestion()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  function resetQuiz() {
    setSeed(0)
    setQuestionNumber(1)
    setScore(0)
    setStreak(0)
    setSelected(null)
  }

  function openEditor() {
    setDraftVocabulary(vocabulary.map((entry) => ({ ...entry })))
    setEditorError('')
    setEditing(true)
  }

  function updateDraft(index: number, field: keyof Vocabulary, value: string) {
    setDraftVocabulary((entries) => entries.map((entry, entryIndex) => entryIndex === index ? { ...entry, [field]: value, ...(field === 'kanji' && !value.trim() ? { kanji: null } : {}) } : entry))
  }

  function saveVocabulary() {
    const complete = completeEntries(draftVocabulary)
    if (complete.length < 4) {
      setEditorError('Add at least 4 complete entries (English meaning, romaji, and kana) before saving.')
      return
    }
    const cleaned = complete.map((entry) => ({ meaning: entry.meaning.trim(), romaji: entry.romaji.trim(), kana: entry.kana.trim(), kanji: entry.kanji?.trim() || null }))
    setVocabulary(cleaned)
    localStorage.setItem(VOCABULARY_KEY, JSON.stringify(cleaned))
    setEditing(false)
    setEditorError('')
    resetQuiz()
  }

  function resetVocabulary() {
    setDraftVocabulary(DEFAULT_VOCABULARY.map((entry) => ({ ...entry })))
    setEditorError('')
  }

  function choose(option: string) {
    if (selected) return
    setSelected(option)
    if (option === question.correct) {
      setScore((value) => value + 1)
      setStreak((value) => {
        const next = value + 1
        if (next > best) { setBest(next); localStorage.setItem('japanese-quiz-best', String(next)) }
        return next
      })
    } else setStreak(0)
  }

  function nextQuestion() {
    setSeed((value) => value + 1)
    setQuestionNumber((value) => value === roundSize ? 1 : value + 1)
    if (questionNumber === roundSize) setScore(0)
    setSelected(null)
  }

  return (
    <div className="japanese-quiz-tool">
      <section className="border-t border-[var(--ink)]">
        <div className="flex flex-wrap items-end gap-6 border-b border-[var(--ink)] bg-[color-mix(in_oklch,var(--secondary),transparent_30%)] p-5 md:items-center">
          <div className="mr-auto min-w-[14rem]"><p className="eyebrow mb-1">Text / quick practice</p><h1 className="text-3xl md:text-4xl">Japanese <em>vocabulary.</em></h1><p className="mt-2 max-w-lg text-xs leading-relaxed text-[var(--muted-ink)]">Practice Japanese occupational vocabulary with English meanings.</p></div>
          <Button variant="outline" size="sm" className="ml-auto" onClick={openEditor}><Settings2 /> Edit vocabulary</Button>
          <div className="grid grid-cols-4 border-l border-[var(--rule)] text-center">
            <div className="min-w-[4.5rem] border-r border-[var(--rule)] px-2 py-2"><span className="block text-[.58rem] uppercase tracking-widest text-[var(--muted-ink)]">Correct</span><strong className="mt-1 block font-mono text-lg">{score}/{roundSize}</strong></div>
            <div className="min-w-[4.5rem] border-r border-[var(--rule)] px-2 py-2"><span className="block text-[.58rem] uppercase tracking-widest text-[var(--muted-ink)]">Words</span><strong className="mt-1 block font-mono text-lg">{roundSize}</strong></div>
            <div className="min-w-[4.5rem] border-r border-[var(--rule)] px-2 py-2"><span className="block text-[.58rem] uppercase tracking-widest text-[var(--muted-ink)]">Streak</span><strong className="mt-1 flex items-center justify-center gap-1 font-mono text-lg"><Flame size={14} className="text-[var(--rust)]" />{streak}</strong></div>
            <div className="min-w-[4.5rem] px-2 py-2"><span className="block text-[.58rem] uppercase tracking-widest text-[var(--muted-ink)]">Best</span><strong className="mt-1 block font-mono text-lg">{best}</strong></div>
          </div>
        </div>

        {editing && <div className="border-b border-[var(--ink)] bg-[var(--secondary)] p-4 md:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow mb-1">Settings</p><h2 className="font-serif text-2xl">Edit vocabulary</h2><p className="mt-1 text-xs text-[var(--muted-ink)]">English meaning, romaji, and kana are required. Kanji is optional.</p></div><div className="flex gap-2"><Button variant="ghost" size="sm" onClick={resetVocabulary}><RotateCcw /> Reset defaults</Button><Button variant="ghost" size="sm" onClick={() => { setEditing(false); setEditorError('') }}>Cancel</Button></div></div>
          <div className="overflow-x-auto border border-[var(--rule)] bg-[var(--panel)]"><div className="min-w-[42rem]">
            <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr_1.1fr_2.5rem] gap-2 border-b border-[var(--rule)] px-3 py-2 text-[.58rem] font-semibold uppercase tracking-wider text-[var(--muted-ink)]"><span>English</span><span>Romaji</span><span>Kana</span><span>Kanji (optional)</span><span>Preview</span><span /></div>
            {draftVocabulary.map((entry, index) => <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr_1.1fr_2.5rem] gap-2 border-b border-[var(--rule)] p-2 last:border-b-0" key={`${index}-${entry.meaning}`}>
              {(['meaning', 'romaji', 'kana', 'kanji'] as const).map((field) => <input key={field} value={entry[field] ?? ''} onChange={(event) => updateDraft(index, field, event.target.value)} placeholder={field === 'kanji' ? '—' : field} aria-label={`${field} row ${index + 1}`} className="h-8 min-w-0 border border-[var(--rule)] bg-transparent px-2 text-xs outline-none focus:border-[var(--rust)] focus:ring-1 focus:ring-[var(--rust)]" />)}
              <span className="flex min-w-0 items-center overflow-hidden text-sm">{entry.kanji ? renderJapanese(entry.kanji, [entry]) : <span className="text-[var(--muted-ink)]">—</span>}</span>
              <button className="grid h-8 place-items-center text-[var(--muted-ink)] hover:text-[var(--rust)]" onClick={() => setDraftVocabulary((entries) => entries.filter((_, entryIndex) => entryIndex !== index))} aria-label={`Hapus baris ${index + 1}`}><Trash2 size={14} /></button>
            </div>)}
          </div></div>
          {editorError && <p className="mt-3 text-xs text-[var(--rust)]">{editorError}</p>}
          <div className="mt-4 flex flex-wrap justify-between gap-2"><Button variant="outline" size="sm" onClick={() => setDraftVocabulary((entries) => [...entries, { ...EMPTY_ENTRY }])}><Plus /> Add row</Button><Button size="sm" onClick={saveVocabulary}><Save /> Save vocabulary</Button></div>
        </div>}

        <div className="flex min-h-16 items-center justify-between gap-4 border-b border-[var(--ink)] px-4 py-3 md:px-5"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"><Languages size={15} className="text-[var(--rust)]" /> {MODE_LABEL[question.mode]}</div><span className="font-mono text-xs text-[var(--muted-ink)]">{String(questionNumber).padStart(2, '0')} / {roundSize}</span></div>
        <div className="h-1 bg-[var(--secondary)]"><div className="h-full bg-[var(--rust)] transition-all" style={{ width: `${questionNumber / roundSize * 100}%` }} /></div>
        <div className="border-b border-[var(--ink)] bg-[var(--panel)] p-5 md:p-10">
          <p className="mb-5 text-xs text-[var(--muted-ink)]">{question.mode === 'meaning' ? 'Choose the Japanese word' : 'What is the English meaning?'}</p><div className="mb-10 min-h-20 break-words text-center font-serif text-6xl tracking-tight md:text-8xl">{renderJapanese(question.prompt, vocabulary)}</div>
          <div className="grid gap-2 sm:grid-cols-2">{question.options.map((option, index) => { const isCorrect = option === question.correct; const isSelected = option === selected; const state = selected ? (isCorrect ? 'border-[var(--pine)] bg-[var(--pine-soft)]' : isSelected ? 'border-[var(--rust)] bg-[var(--rust-soft)]' : 'opacity-50') : 'border-[var(--rule)] hover:border-[var(--ink)] hover:bg-[var(--accent)]'; return <button key={`${option}-${index}`} onClick={() => choose(option)} className={`flex min-h-14 items-center gap-4 border bg-[var(--panel)] px-4 text-left transition-all ${state}`}><span className={`grid h-7 w-7 shrink-0 place-items-center border font-mono text-xs ${selected && isCorrect ? 'border-[var(--pine)] text-[var(--pine)]' : selected && isSelected ? 'border-[var(--rust)] text-[var(--rust)]' : 'border-[var(--rule)] text-[var(--muted-ink)]'}`}>{index + 1}</span><span className="text-sm">{renderJapanese(option, vocabulary)}</span>{selected && isCorrect && <Check size={16} className="ml-auto text-[var(--pine)]" />}{selected && isSelected && !isCorrect && <X size={16} className="ml-auto text-[var(--rust)]" />}</button> })}</div>
          {selected && <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--rule)] pt-5"><p className={`text-sm ${selected === question.correct ? 'text-[var(--pine)]' : 'text-[var(--rust)]'}`}>{selected === question.correct ? 'Correct — great work!' : <>Not quite. Answer: {renderJapanese(question.correct, vocabulary)}</>}</p><Button onClick={nextQuestion}>{finished ? 'Start new round' : 'Next'} <ArrowRight /></Button></div>}
        </div>
        <div className="flex min-h-14 items-center gap-2 bg-[var(--secondary)] px-4 py-3 text-[.68rem] text-[var(--muted-ink)] md:px-5"><RotateCcw size={13} /> Press 1–4 to answer · Enter to continue</div>
      </section>
    </div>
  )
}

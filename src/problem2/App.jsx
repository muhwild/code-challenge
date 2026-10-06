import { useEffect, useMemo, useRef, useState } from 'react'

const PRICES_URL = 'https://interview.switcheo.com/prices.json'
const iconUrl = (s) => `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${s}.svg`
const fmt = (n, max = 6) =>
  Number(n).toLocaleString('en-US', { maximumFractionDigits: n >= 1 ? 4 : max })

function TokenIcon({ symbol }) {
  const [bad, setBad] = useState(false)
  return bad ? (
    <span className="icon icon-fallback">{symbol[0]}</span>
  ) : (
    <img className="icon" src={iconUrl(symbol)} alt="" onError={() => setBad(true)} />
  )
}

function TokenSelect({ value, tokens, onChange, label }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [])

  const list = tokens.filter((t) => t.currency.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <div className="select" ref={ref}>
      <button type="button" className="select-btn" aria-label={label} aria-expanded={open}
        onClick={() => { setOpen(!open); setQ('') }}>
        <TokenIcon key={value} symbol={value} />
        <span>{value}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="menu">
          <input autoFocus className="menu-search" placeholder="Search token" value={q}
            onChange={(e) => setQ(e.target.value)} />
          <ul>
            {list.map((t) => (
              <li key={t.currency}>
                <button type="button" className={t.currency === value ? 'on' : ''}
                  onClick={() => { onChange(t.currency); setOpen(false) }}>
                  <TokenIcon key={t.currency} symbol={t.currency} />
                  <span>{t.currency}</span>
                  <small>${fmt(t.price, 4)}</small>
                </button>
              </li>
            ))}
            {!list.length && <li className="empty">No token matches “{q}”</li>}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [tokens, setTokens] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [from, setFrom] = useState('ETH')
  const [to, setTo] = useState('USDC')
  const [amount, setAmount] = useState('')
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)

  const load = () => {
    setStatus('loading')
    fetch(PRICES_URL)
      .then((r) => r.json())
      .then((rows) => {
        // keep only the latest priced entry per currency
        const latest = {}
        rows.forEach((r) => {
          if (r.price > 0 && (!latest[r.currency] || r.date > latest[r.currency].date)) latest[r.currency] = r
        })
        const list = Object.values(latest).sort((a, b) => a.currency.localeCompare(b.currency))
        setTokens(list)
        const has = (s) => list.some((t) => t.currency === s)
        if (!has('ETH')) setFrom(list[0].currency)
        if (!has('USDC')) setTo(list[1].currency)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }
  useEffect(load, [])

  const price = useMemo(() => Object.fromEntries(tokens.map((t) => [t.currency, t.price])), [tokens])
  const rate = price[from] / price[to]
  const n = parseFloat(amount)
  const receive = n > 0 ? n * rate : 0

  const error = !amount ? 'Enter an amount to swap'
    : !(n > 0) ? 'Amount must be greater than 0'
    : from === to ? 'Choose two different tokens' : ''
  const showError = (touched || amount) && error

  const onAmount = (e) => {
    const v = e.target.value.replace(/,/g, '')
    if (/^\d*\.?\d*$/.test(v)) { setAmount(v); setDone(null) }
  }
  const flip = () => { setFrom(to); setTo(from); setDone(null) }
  const submit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (error || busy) return
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      setDone({ n, from, to, receive })
      setAmount('')
      setTouched(false)
    }, 1600)
  }

  return (
    <main className="stage">
      <form className="card" onSubmit={submit} noValidate>
        <header>
          <h1>Swap</h1>
          {status === 'ready' && (
            <p className="rate" aria-live="polite">
              1 {from} <span>≈</span> {fmt(rate)} {to}
            </p>
          )}
        </header>

        {status === 'loading' && <div className="state">Loading live prices…</div>}
        {status === 'error' && (
          <div className="state">
            Couldn’t load prices. Check your connection and try again.
            <button type="button" className="link" onClick={load}>Retry</button>
          </div>
        )}

        {status === 'ready' && (
          <>
            <div className={`field ${showError ? 'bad' : ''}`}>
              <label htmlFor="input-amount">Amount to send</label>
              <div className="row">
                <input id="input-amount" inputMode="decimal" autoComplete="off" placeholder="0.00"
                  value={amount} onChange={onAmount} onBlur={() => setTouched(true)}
                  aria-invalid={!!showError} aria-describedby="amount-error" />
                <TokenSelect label="Token to send" value={from} tokens={tokens} onChange={setFrom} />
              </div>
              <small>{n > 0 ? `≈ $${fmt(n * price[from], 2)}` : ' '}</small>
            </div>

            <button type="button" className="flip" onClick={flip} aria-label="Swap direction">
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M6 3v11M6 14l-3-3M6 14l3-3M12 15V4M12 4l-3 3M12 4l3 3" fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="field">
              <label htmlFor="output-amount">Amount to receive</label>
              <div className="row">
                <input id="output-amount" readOnly tabIndex={-1} placeholder="0.00"
                  value={receive ? fmt(receive) : ''} />
                <TokenSelect label="Token to receive" value={to} tokens={tokens} onChange={setTo} />
              </div>
              <small>{receive ? `≈ $${fmt(receive * price[to], 2)}` : ' '}</small>
            </div>

            <p id="amount-error" className="error" role="alert">{showError || ''}</p>

            <button className="cta" disabled={busy}>
              {busy ? <><span className="spin" /> Swapping…</> : 'CONFIRM SWAP'}
            </button>

            {done && (
              <p className="ok" role="status">
                Swapped {fmt(done.n)} {done.from} for {fmt(done.receive)} {done.to}.
              </p>
            )}
          </>
        )}
      </form>

      {status === 'ready' && (
        <div className="ticker" aria-hidden="true">
          <div className="ticker-track">
            {[...tokens.slice(0, 20), ...tokens.slice(0, 20)].map((t, i) => (
              <span key={i}><b>{t.currency}</b>${fmt(t.price, 4)}</span>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

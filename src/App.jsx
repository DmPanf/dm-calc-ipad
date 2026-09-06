import { useEffect, useRef, useState } from 'react'
import './App.css'

const EMPTY_MEMORY = [null, null, null, null, null]

function App() {
  const [display, setDisplay] = useState('0')
  const [storedValue, setStoredValue] = useState(null)
  const [operator, setOperator] = useState(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)
  const [history, setHistory] = useState('')

  const [memory, setMemory] = useState(() => {
    try {
      const saved = localStorage.getItem('dm-calc-memory')
      return saved ? JSON.parse(saved) : EMPTY_MEMORY
    } catch {
      return EMPTY_MEMORY
    }
  })

  const longPressTimer = useRef(null)
  const longPressTriggered = useRef(false)

  useEffect(() => {
    localStorage.setItem('dm-calc-memory', JSON.stringify(memory))
  }, [memory])

  const currentValue = () => {
    const value = Number(display)
    return Number.isFinite(value) ? value : 0
  }

  const formatNumber = (value) => {
    if (!Number.isFinite(value)) return 'Error'

    const rounded =
      Math.round((value + Number.EPSILON) * 1e10) / 1e10

    const absValue = Math.abs(rounded)

    if (
      absValue !== 0 &&
      (absValue >= 1e12 || absValue < 1e-8)
    ) {
      return rounded.toExponential(6)
    }

    return String(rounded)
  }

  const resetIfError = () => {
    if (display === 'Error') {
      setDisplay('0')
      setStoredValue(null)
      setOperator(null)
      setWaitingForOperand(false)
      setHistory('')
      return true
    }

    return false
  }

  const inputDigit = (digit) => {
    if (display === 'Error') {
      setDisplay(digit)
      setWaitingForOperand(false)
      return
    }

    if (waitingForOperand) {
      setDisplay(digit)
      setWaitingForOperand(false)
      return
    }

    if (display.replace('-', '').replace('.', '').length >= 14) {
      return
    }

    setDisplay(display === '0' ? digit : display + digit)
  }

  const inputDecimal = () => {
    if (display === 'Error' || waitingForOperand) {
      setDisplay('0.')
      setWaitingForOperand(false)
      return
    }

    if (!display.includes('.')) {
      setDisplay(display + '.')
    }
  }

  const calculate = (a, b, op) => {
    switch (op) {
      case '+':
        return a + b
      case '−':
        return a - b
      case '×':
        return a * b
      case '÷':
        return b === 0 ? NaN : a / b
      case '^':
        return Math.pow(a, b)
      default:
        return b
    }
  }

  const handleOperator = (nextOperator) => {
    if (display === 'Error') {
      resetIfError()
      return
    }

    const inputValue = currentValue()

    if (storedValue === null) {
      setStoredValue(inputValue)
    } else if (operator && !waitingForOperand) {
      const result = calculate(
        storedValue,
        inputValue,
        operator
      )

      const formatted = formatNumber(result)

      setDisplay(formatted)

      if (formatted === 'Error') {
        setStoredValue(null)
        setOperator(null)
        setWaitingForOperand(true)
        return
      }

      setStoredValue(result)
    }

    setOperator(nextOperator)
    setWaitingForOperand(true)
  }

  const equals = () => {
    if (
      operator === null ||
      storedValue === null ||
      display === 'Error'
    ) {
      return
    }

    const inputValue = currentValue()

    const result = calculate(
      storedValue,
      inputValue,
      operator
    )

    const formatted = formatNumber(result)

    setHistory(
      `${formatNumber(storedValue)} ${
        operator === '^' ? '^' : operator
      } ${formatNumber(inputValue)} =`
    )

    setDisplay(formatted)
    setStoredValue(null)
    setOperator(null)
    setWaitingForOperand(true)
  }

  const clearAll = () => {
    setDisplay('0')
    setStoredValue(null)
    setOperator(null)
    setWaitingForOperand(false)
    setHistory('')
  }

  const backspace = () => {
    if (display === 'Error') {
      clearAll()
      return
    }

    if (waitingForOperand) return

    if (
      display.length <= 1 ||
      (display.startsWith('-') && display.length === 2)
    ) {
      setDisplay('0')
      return
    }

    setDisplay(display.slice(0, -1))
  }

  const toggleSign = () => {
    if (display === 'Error' || display === '0') return

    setDisplay(
      display.startsWith('-')
        ? display.slice(1)
        : '-' + display
    )
  }

  const percent = () => {
    if (display === 'Error') return

    const value = currentValue()
    setHistory(`${formatNumber(value)}% =`)
    setDisplay(formatNumber(value / 100))
    setWaitingForOperand(true)
  }

  const squareRoot = () => {
    if (display === 'Error') return

    const value = currentValue()
    setHistory(`√${formatNumber(value)} =`)

    if (value < 0) {
      setDisplay('Error')
    } else {
      setDisplay(formatNumber(Math.sqrt(value)))
    }

    setWaitingForOperand(true)
  }

  const square = () => {
    if (display === 'Error') return

    const value = currentValue()
    setHistory(`${formatNumber(value)}² =`)
    setDisplay(formatNumber(value * value))
    setWaitingForOperand(true)
  }

  const reciprocal = () => {
    if (display === 'Error') return

    const value = currentValue()
    setHistory(`1 / ${formatNumber(value)} =`)

    if (value === 0) {
      setDisplay('Error')
    } else {
      setDisplay(formatNumber(1 / value))
    }

    setWaitingForOperand(true)
  }

  const recallMemory = (index) => {
    const value = memory[index]

    if (value === null) return

    setDisplay(formatNumber(value))
    setWaitingForOperand(false)
  }

  const saveMemory = (index) => {
    if (display === 'Error') return

    const next = [...memory]
    next[index] = currentValue()

    setMemory(next)
  }

  const clearMemory = (index) => {
    const next = [...memory]
    next[index] = null

    setMemory(next)
  }

  const startMemoryPress = (index) => {
    longPressTriggered.current = false

    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      saveMemory(index)
    }, 550)
  }

  const endMemoryPress = (index) => {
    clearTimeout(longPressTimer.current)

    if (!longPressTriggered.current) {
      recallMemory(index)
    }
  }

  const cancelMemoryPress = () => {
    clearTimeout(longPressTimer.current)
  }

  return (
    <main className="page">
      <section className="calculator">
        <div className="calculator-inner">
          <div className="brand-row">
            <div>
              <div className="brand">Dm Calc</div>
              <div className="subtitle">
                Practical calculator
              </div>
            </div>

            <div className="status-dot" />
          </div>

          <div className="memory-row">
            {memory.map((value, index) => (
              <button
                key={index}
                className={`memory-button ${
                  value !== null ? 'filled' : ''
                }`}
                onPointerDown={() =>
                  startMemoryPress(index)
                }
                onPointerUp={() =>
                  endMemoryPress(index)
                }
                onPointerLeave={cancelMemoryPress}
                onContextMenu={(event) => {
                  event.preventDefault()
                  clearMemory(index)
                }}
                title="Tap: recall · Hold: save · Long context press: clear"
              >
                <span className="memory-label">
                  M{index + 1}
                </span>

                <span className="memory-value">
                  {value === null
                    ? '—'
                    : formatNumber(value)}
                </span>
              </button>
            ))}
          </div>

          <div className="memory-hint">
            Tap to recall · Hold to save
          </div>

          <div className="display-panel">
            <div className="history">
              {history || ' '}
            </div>

            <div className="display">
              {display}
            </div>
          </div>

          <div className="keyboard">
            <button
              className="function"
              onClick={clearAll}
            >
              C
            </button>

            <button
              className="function"
              onClick={toggleSign}
            >
              ±
            </button>

            <button
              className="function"
              onClick={percent}
            >
              %
            </button>

            <button
              className="operator"
              onClick={() =>
                handleOperator('÷')
              }
            >
              ÷
            </button>

            <button
              className="utility"
              onClick={squareRoot}
            >
              √
            </button>

            <button
              className="utility"
              onClick={square}
            >
              x²
            </button>

            <button
              className="utility"
              onClick={reciprocal}
            >
              1/x
            </button>

            <button
              className="operator"
              onClick={() =>
                handleOperator('×')
              }
            >
              ×
            </button>

            <button onClick={() => inputDigit('7')}>
              7
            </button>

            <button onClick={() => inputDigit('8')}>
              8
            </button>

            <button onClick={() => inputDigit('9')}>
              9
            </button>

            <button
              className="operator"
              onClick={() =>
                handleOperator('−')
              }
            >
              −
            </button>

            <button onClick={() => inputDigit('4')}>
              4
            </button>

            <button onClick={() => inputDigit('5')}>
              5
            </button>

            <button onClick={() => inputDigit('6')}>
              6
            </button>

            <button
              className="operator"
              onClick={() =>
                handleOperator('+')
              }
            >
              +
            </button>

            <button onClick={() => inputDigit('1')}>
              1
            </button>

            <button onClick={() => inputDigit('2')}>
              2
            </button>

            <button onClick={() => inputDigit('3')}>
              3
            </button>

            <button
              className="operator power"
              onClick={() =>
                handleOperator('^')
              }
            >
              xʸ
            </button>

            <button
              className="backspace"
              onClick={backspace}
            >
              ⌫
            </button>

            <button onClick={() => inputDigit('0')}>
              0
            </button>

            <button onClick={inputDecimal}>
              .
            </button>

            <button
              className="equals"
              onClick={equals}
            >
              =
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
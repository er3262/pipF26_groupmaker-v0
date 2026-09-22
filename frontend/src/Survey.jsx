import { useEffect, useState } from 'react'

const SCHOOL_YEARS = ['First-year', 'Sophomore', 'Junior', 'Senior', 'Other']

const EMPTY_ANSWERS = {
  name: '',
  school_year: '',
  working_style: '',
}

const FIELD_LABELS = {
  name: 'Your name',
  school_year: 'What year are you?',
  working_style: 'Describe your working style in 1–2 sentences',
}

export default function Survey() {
  const [roster, setRoster] = useState(null)
  const [answers, setAnswers] = useState(EMPTY_ANSWERS)
  const [missing, setMissing] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetch('/api/roster')
      .then((res) => {
        if (!res.ok) throw new Error(`Backend responded ${res.status}`)
        return res.json()
      })
      .then(setRoster)
      .catch((err) => setError(err.message))
  }, [])

  function update(field, value) {
    setAnswers((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextMissing = Object.entries(answers)
      .filter(([, value]) => !String(value).trim())
      .map(([field]) => field)

    if (nextMissing.length) {
      setMissing(nextMissing)
      setError(null)
      return
    }

    setLoading(true)
    setMissing([])
    setError(null)
    try {
      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: answers.name,
          school_year: answers.school_year,
          working_style: answers.working_style.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMissing(data.missing || [])
        throw new Error(data.error || `Backend responded ${res.status}`)
      }
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <section className="survey">
        <h2>Thanks — your survey was saved.</h2>
        <p>You can submit again if you want; each submit adds another row.</p>
        <button
          type="button"
          className="randomize"
          onClick={() => {
            setAnswers(EMPTY_ANSWERS)
            setSubmitted(false)
            setMissing([])
            setError(null)
          }}
        >
          Submit another response
        </button>
      </section>
    )
  }

  if (!roster && !error) {
    return <p>Loading survey…</p>
  }

  return (
    <section className="survey">
      <h2>Survey</h2>
      <p className="subtitle">All fields are required. Names come from the class roster.</p>

      {missing.length > 0 && (
        <p className="error">
          Please fill in: {missing.map((field) => FIELD_LABELS[field] || field).join(', ')}
        </p>
      )}
      {error && <p className="error">{error}</p>}

      <form className="survey-form" onSubmit={handleSubmit}>
        <label>
          {FIELD_LABELS.name}
          <select value={answers.name} onChange={(e) => update('name', e.target.value)} disabled={loading}>
            <option value="">Select your name</option>
            {(roster?.students ?? []).map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          {FIELD_LABELS.school_year}
          <select
            value={answers.school_year}
            onChange={(e) => update('school_year', e.target.value)}
            disabled={loading}
          >
            <option value="">Select a year</option>
            {SCHOOL_YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label>
          {FIELD_LABELS.working_style}
          <textarea
            rows={4}
            value={answers.working_style}
            onChange={(e) => update('working_style', e.target.value)}
            disabled={loading}
          />
        </label>

        <button className="randomize" type="submit" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </section>
  )
}

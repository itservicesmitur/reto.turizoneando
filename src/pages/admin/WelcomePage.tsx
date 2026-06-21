import { useEffect, useRef, useState } from 'react'
import {
  fetchWelcomeMessage,
  saveWelcomeMessage,
  fetchElevenLabsVoices,
  generateElevenLabsAudio,
  previewMusicTrack,
  type WelcomeMessageData,
} from '../../services/adminService'

const DEFAULT_VOICES = [
  { id: 'PPzYpIqttlTYA83688JI', name: 'Antoni — Deep Narrator', category: 'premade' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella — Warm Female', category: 'premade' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni — Classic', category: 'premade' },
  { id: 'custom', name: '— ID personalizado —', category: '' },
]

function resolveAudioUrl(url: string) {
  if (!url) return ''
  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  if (isLocal && url.startsWith('https://firebasestorage.googleapis.com')) {
    return url.replace('https://firebasestorage.googleapis.com', `http://${window.location.hostname}:9199`)
  }
  return url
}

type Lang = 'es' | 'en'

export default function WelcomePage() {
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [lang,     setLang]     = useState<Lang>('es')

  // Text
  const [textEs, setTextEs] = useState('')
  const [textEn, setTextEn] = useState('')

  // Audio URLs (saved)
  const [audioUrlEs, setAudioUrlEs] = useState('')
  const [audioUrlEn, setAudioUrlEn] = useState('')

  // ElevenLabs — ES
  const [voiceEs,        setVoiceEs]        = useState('PPzYpIqttlTYA83688JI')
  const [customVoiceEs,  setCustomVoiceEs]  = useState('')
  const [speedEs,        setSpeedEs]        = useState(1.0)
  const [genLoadingEs,   setGenLoadingEs]   = useState(false)
  const [genErrorEs,     setGenErrorEs]     = useState<string | null>(null)
  const [previewEs,      setPreviewEs]      = useState('')

  // ElevenLabs — EN
  const [voiceEn,        setVoiceEn]        = useState('PPzYpIqttlTYA83688JI')
  const [customVoiceEn,  setCustomVoiceEn]  = useState('')
  const [speedEn,        setSpeedEn]        = useState(1.0)
  const [genLoadingEn,   setGenLoadingEn]   = useState(false)
  const [genErrorEn,     setGenErrorEn]     = useState<string | null>(null)
  const [previewEn,      setPreviewEn]      = useState('')

  // Music — shared for both languages
  const [musicPreset,         setMusicPreset]         = useState('none')
  const [musicVolume,         setMusicVolume]         = useState(0.15)
  const [musicPreviewUrl,     setMusicPreviewUrl]     = useState<string | null>(null)
  const [genMusicLoading,     setGenMusicLoading]     = useState(false)
  const [musicPreviewError,   setMusicPreviewError]   = useState<string | null>(null)

  const [voices,        setVoices]        = useState(DEFAULT_VOICES)
  const [loadingVoices, setLoadingVoices] = useState(false)
  const savedRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function loadWelcome() {
      try {
        const data = await fetchWelcomeMessage()
        if (data) {
          setTextEs(data.text_es)
          setTextEn(data.text_en)
          setAudioUrlEs(data.audioUrl_es)
          setAudioUrlEn(data.audioUrl_en)
        }
      } catch (err: any) {
        setError(err?.message || 'Error al cargar el mensaje de bienvenida.')
      } finally {
        setLoading(false)
      }
    }

    async function loadVoices() {
      setLoadingVoices(true)
      try {
        const voiceData = await fetchElevenLabsVoices()
        if (voiceData?.voices?.length) {
          const loaded = voiceData.voices.map((v: any) => ({
            id: v.voice_id,
            name: v.name,
            category: v.category || 'premade',
          }))
          setVoices([...loaded, { id: 'custom', name: '— ID personalizado —', category: '' }])
        }
      } catch {
        // keep DEFAULT_VOICES
      } finally {
        setLoadingVoices(false)
      }
    }

    loadWelcome()
    loadVoices()
  }, [])

  async function handleGenerateAudio(l: Lang) {
    const isEs = l === 'es'
    const text = isEs ? textEs : textEn
    const voiceRaw = isEs ? voiceEs : voiceEn
    const customId = isEs ? customVoiceEs : customVoiceEn
    const voiceId = voiceRaw === 'custom' ? customId.trim() : voiceRaw
    const speed = isEs ? speedEs : speedEn

    if (!text.trim()) {
      isEs ? setGenErrorEs('Escribe el texto primero.') : setGenErrorEn('Write the text first.')
      return
    }
    if (!voiceId) {
      isEs ? setGenErrorEs('Selecciona una voz.') : setGenErrorEn('Select a voice.')
      return
    }

    isEs ? setGenLoadingEs(true) : setGenLoadingEn(true)
    isEs ? setGenErrorEs(null)  : setGenErrorEn(null)

    try {
      const result = await generateElevenLabsAudio(
        text.trim(),
        voiceId,
        musicPreset !== 'none' ? musicPreset : undefined,
        musicPreset !== 'none' ? musicVolume : undefined,
        speed,
      )
      if (isEs) {
        setPreviewEs(result.downloadUrl)
        setAudioUrlEs(result.downloadUrl)
      } else {
        setPreviewEn(result.downloadUrl)
        setAudioUrlEn(result.downloadUrl)
      }
    } catch (err: any) {
      const msg = err?.message || 'Error al generar audio.'
      isEs ? setGenErrorEs(msg) : setGenErrorEn(msg)
    } finally {
      isEs ? setGenLoadingEs(false) : setGenLoadingEn(false)
    }
  }

  async function handlePreviewMusic() {
    if (musicPreset === 'none') return
    setMusicPreviewError(null)
    setMusicPreviewUrl(null)
    setGenMusicLoading(true)
    try {
      const result = await previewMusicTrack(musicPreset)
      setMusicPreviewUrl(result.downloadUrl)
    } catch (err: any) {
      setMusicPreviewError(err?.message || 'Error al generar vista previa.')
    } finally {
      setGenMusicLoading(false)
    }
  }

  async function handleSave() {
    if (!textEs.trim() || !textEn.trim()) {
      setError('El texto es obligatorio en ambos idiomas.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const data: Omit<WelcomeMessageData, 'updatedAt'> = {
        text_es:     textEs.trim(),
        text_en:     textEn.trim(),
        audioUrl_es: audioUrlEs.trim(),
        audioUrl_en: audioUrlEn.trim(),
      }
      await saveWelcomeMessage(data)
      setSaved(true)
      if (savedRef.current) clearTimeout(savedRef.current)
      savedRef.current = setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      setError(err?.message || 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  // ── Styles ─────────────────────────────────────────────────────────────────

  const card: React.CSSProperties = {
    background: 'var(--color-surface)',
    borderRadius: 16,
    padding: 24,
    boxShadow: 'var(--shadow-card)',
    marginBottom: 20,
  }

  const label: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    display: 'block',
  }

  const textarea: React.CSSProperties = {
    width: '100%',
    minHeight: 160,
    borderRadius: 12,
    border: '2px solid var(--color-border)',
    padding: '12px 14px',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text)',
    background: 'var(--color-gray-light)',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box',
    lineHeight: 1.6,
  }

  const select: React.CSSProperties = {
    width: '100%',
    height: 42,
    borderRadius: 10,
    border: '2px solid var(--color-border)',
    padding: '0 12px',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text)',
    background: 'var(--color-gray-light)',
    outline: 'none',
  }

  const input: React.CSSProperties = {
    width: '100%',
    height: 42,
    borderRadius: 10,
    border: '2px solid var(--color-border)',
    padding: '0 12px',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text)',
    background: 'var(--color-gray-light)',
    outline: 'none',
    boxSizing: 'border-box',
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(27,43,110,0.12)', borderTopColor: 'var(--color-navy)', animation: 'wp-spin 0.7s linear infinite' }} />
        <style>{`@keyframes wp-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const isEs = lang === 'es'
  const text          = isEs ? textEs          : textEn
  const setText       = isEs ? setTextEs       : setTextEn
  const voice         = isEs ? voiceEs         : voiceEn
  const setVoice      = isEs ? setVoiceEs      : setVoiceEn
  const customVoice   = isEs ? customVoiceEs   : customVoiceEn
  const setCustom     = isEs ? setCustomVoiceEs : setCustomVoiceEn
  const speed         = isEs ? speedEs         : speedEn
  const setSpeed      = isEs ? setSpeedEs      : setSpeedEn
  const genLoading    = isEs ? genLoadingEs    : genLoadingEn
  const genError      = isEs ? genErrorEs      : genErrorEn
  const preview       = isEs ? previewEs       : previewEn
  const savedAudioUrl = isEs ? audioUrlEs      : audioUrlEn

  return (
    <div style={{ animation: 'fade-in 0.3s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-navy)', fontSize: 28, margin: '0 0 4px' }}>
            Mensaje de Bienvenida
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
            Texto y narración de voz que se muestra al usuario antes del tutorial del mapa.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            height: 48, padding: '0 24px', borderRadius: 12,
            background: saved ? 'var(--color-teal)' : 'var(--color-navy)',
            color: '#fff', fontSize: 14, fontWeight: 700, border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 14px rgba(27,43,110,0.3)',
            transition: 'background 300ms ease',
          }}
        >
          {saving ? (
            <><i className="ri-loader-4-line" style={{ animation: 'wp-spin 0.8s linear infinite' }} /> Guardando…</>
          ) : saved ? (
            <><i className="ri-check-line" /> ¡Guardado!</>
          ) : (
            <><i className="ri-save-line" /> Guardar cambios</>
          )}
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderRadius: 12, background: 'rgba(230,51,41,0.07)', border: '1.5px solid rgba(230,51,41,0.2)', marginBottom: 20 }}>
          <i className="ri-error-warning-line" style={{ color: 'var(--color-error)', fontSize: 16, marginTop: 1 }} />
          <span style={{ fontSize: 13, color: 'var(--color-error)' }}>{error}</span>
        </div>
      )}

      {/* Language tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['es', 'en'] as Lang[]).map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            style={{
              height: 38, padding: '0 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 13,
              background: lang === l ? 'var(--color-navy)' : 'var(--color-surface)',
              color: lang === l ? '#fff' : 'var(--color-text-muted)',
              boxShadow: lang === l ? '0 4px 12px rgba(27,43,110,0.25)' : 'var(--shadow-card)',
              transition: 'all 150ms ease',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <i className={l === 'es' ? 'ri-translate-2' : 'ri-global-line'} />
            {l === 'es' ? 'Español' : 'English'}
            {((l === 'es' && audioUrlEs) || (l === 'en' && audioUrlEn)) && (
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80' }} />
            )}
          </button>
        ))}
      </div>

      {/* Text card */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={label}>
            Texto de bienvenida — {isEs ? 'Español' : 'English'}
          </span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {text.split(/\s+/).filter(Boolean).length} palabras
          </span>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={isEs
            ? '¡Bienvenido a Turizoneando! Estás a punto de comenzar una aventura por la Ciudad Colonial…'
            : 'Welcome to Turizoneando! You are about to begin an adventure through the Colonial City…'}
          style={textarea}
        />
      </div>

      {/* ElevenLabs audio card */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#096d7d,#00bbb4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ri-mic-2-line" style={{ color: '#fff', fontSize: 18 }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: 15 }}>Narración con ElevenLabs</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{isEs ? 'Español' : 'English'}</div>
          </div>
        </div>

        {/* Voice selector */}
        <div style={{ marginBottom: 16 }}>
          <span style={label}>Voz — {isEs ? 'Español' : 'English'}</span>
          <select value={voice} onChange={e => setVoice(e.target.value)} style={select}>
            {loadingVoices ? (
              <option>Cargando voces…</option>
            ) : (
              voices.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name}{v.category ? ` (${v.category})` : ''}
                </option>
              ))
            )}
          </select>
        </div>

        {voice === 'custom' && (
          <div style={{ marginBottom: 16 }}>
            <span style={label}>Voice ID personalizado</span>
            <input type="text" value={customVoice} onChange={e => setCustom(e.target.value)} placeholder="Ej: cQIBhnciTWugZAxX52uW" style={input} />
          </div>
        )}

        {/* Music — shared for ES and EN */}
        <div style={{
          marginBottom: 20,
          padding: 14,
          borderRadius: 10,
          background: 'rgba(16,185,129,0.04)',
          border: '1px dashed rgba(16,185,129,0.35)',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="ri-music-2-line" style={{ fontSize: 16, color: '#059669' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>
              Música de Fondo (aplica a ES y EN)
            </span>
          </div>

          {/* Preset selector + preview button */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                Estilo de música (generado con ElevenLabs)
              </label>
              <select
                value={musicPreset}
                onChange={e => {
                  setMusicPreset(e.target.value)
                  setMusicPreviewUrl(null)
                  setMusicPreviewError(null)
                }}
                style={{
                  height: 32, borderRadius: 6, border: '1px solid rgba(16,185,129,0.4)',
                  padding: '0 8px', fontSize: 12, fontFamily: 'var(--font-body)',
                  outline: 'none', cursor: 'pointer', background: '#fff',
                }}
              >
                <option value="none">Sin música de fondo</option>
                <optgroup label="── Ambiente / Exploración ──">
                  <option value="historico">🏛️ Histórico — cuerdas y piano suaves</option>
                  <option value="naturaleza">🌿 Naturaleza — guitarra acústica y aves</option>
                  <option value="colonial">🎸 Colonial Caribeño — guitarra y percusión</option>
                  <option value="aventura">⚔️ Aventura — orquesta exploración</option>
                  <option value="tropical">🌴 Tropical Lounge — marimba y bossa nova</option>
                  <option value="mar">🌊 Mar Tranquilo — olas y ambiente náutico</option>
                </optgroup>
                <optgroup label="── Pirata / Suspenso / Motivación ──">
                  <option value="pirata">🏴‍☠️ Pirata Épico — metales y percusión dramática</option>
                  <option value="suspenso">🔦 Suspenso — cuerdas tensas, caza del tesoro</option>
                  <option value="misterio">🕳️ Misterio — ambiente oscuro, cueva subterránea</option>
                  <option value="epico">⚡ Épico Motivacional — fanfarria triunfal</option>
                  <option value="descubrimiento">✨ Descubrimiento — fanfarria de logro heroico</option>
                  <option value="taberna">🍺 Taberna Pirata — violín y acordeón festivo</option>
                </optgroup>
              </select>
            </div>

            {musicPreset !== 'none' && (
              <button
                type="button"
                disabled={genMusicLoading}
                onClick={handlePreviewMusic}
                style={{
                  height: 32, padding: '0 12px', borderRadius: 6, flexShrink: 0,
                  background: genMusicLoading ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.12)',
                  border: '1px solid rgba(16,185,129,0.5)',
                  color: '#059669', fontSize: 11, fontWeight: 700,
                  cursor: genMusicLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
                }}
              >
                {genMusicLoading ? (
                  <>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid rgba(5,150,105,0.3)', borderTopColor: '#059669', animation: 'wp-spin 0.8s linear infinite' }} />
                    Generando…
                  </>
                ) : (
                  <><i className="ri-play-circle-line" style={{ fontSize: 13 }} /> Escuchar pista</>
                )}
              </button>
            )}
          </div>

          {musicPreviewError && (
            <div style={{ fontSize: 11, color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ri-error-warning-line" /> {musicPreviewError}
            </div>
          )}
          {musicPreviewUrl && (
            <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#059669' }}>
                <i className="ri-music-2-line" /> Pista de muestra (~10 s)
              </span>
              <audio key={musicPreviewUrl} src={resolveAudioUrl(musicPreviewUrl)} controls style={{ width: '100%', height: 28 }} autoPlay />
            </div>
          )}

          {musicPreset !== 'none' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                Volumen mezcla: {Math.round(musicVolume * 100)}%
              </label>
              <input
                type="range" min={0.05} max={0.40} step={0.05}
                value={musicVolume}
                onChange={e => setMusicVolume(Number(e.target.value))}
                style={{ accentColor: '#059669', flex: 1 }}
              />
            </div>
          )}

          {musicPreset !== 'none' && (
            <p style={{ fontSize: 10, color: '#059669', margin: 0 }}>
              ✓ El archivo .mp3 guardado incluirá la narración mezclada con la pista musical
            </p>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <span style={{ ...label, marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span>Velocidad de voz</span>
            <span style={{ fontWeight: 800, color: 'var(--color-navy)' }}>{speed.toFixed(1)}×</span>
          </span>
          <input
            type="range" min={0.5} max={2.0} step={0.1}
            value={speed} onChange={e => setSpeed(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-teal)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
            <span>0.5× Lento</span><span>1.0× Normal</span><span>2.0× Rápido</span>
          </div>
        </div>

        {genError && (
          <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(230,51,41,0.07)', border: '1.5px solid rgba(230,51,41,0.2)', marginBottom: 16 }}>
            <i className="ri-error-warning-line" style={{ color: 'var(--color-error)', fontSize: 15 }} />
            <span style={{ fontSize: 13, color: 'var(--color-error)' }}>{genError}</span>
          </div>
        )}

        <button
          onClick={() => handleGenerateAudio(lang)}
          disabled={genLoading}
          style={{
            width: '100%', height: 46, borderRadius: 12,
            background: genLoading ? 'var(--color-gray-mid)' : 'linear-gradient(135deg, #096d7d, #00bbb4)',
            color: '#fff', fontWeight: 700, fontSize: 14, border: 'none',
            cursor: genLoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: genLoading ? 'none' : '0 4px 14px rgba(0,187,180,0.35)',
            marginBottom: 16,
          }}
        >
          {genLoading
            ? <><i className="ri-loader-4-line" style={{ animation: 'wp-spin 0.8s linear infinite' }} /> Generando audio…</>
            : <><i className="ri-sparkling-2-line" /> Generar narración con ElevenLabs</>
          }
        </button>

        {/* Preview player */}
        {(preview || savedAudioUrl) && (
          <div style={{ background: 'var(--color-gray-light)', borderRadius: 12, padding: '12px 16px', border: '1.5px solid var(--color-border)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ri-headphone-line" />
              {preview ? 'Vista previa del audio generado' : 'Audio guardado actualmente'}
            </div>
            <audio
              key={preview || savedAudioUrl}
              controls
              src={resolveAudioUrl(preview || savedAudioUrl)}
              style={{ width: '100%', height: 36, borderRadius: 8 }}
            />
            {preview && preview !== savedAudioUrl && (
              <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--color-text-muted)' }}>
                <i className="ri-information-line" /> Este audio se guardará al hacer clic en <strong>Guardar cambios</strong>.
              </p>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes wp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

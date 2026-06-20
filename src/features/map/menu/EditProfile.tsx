import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import CountrySelect from '../../../components/CountrySelect'
import { auth, storage } from '../../../config/firebase'
import { getPlayerProfile, updatePlayerProfile } from '../../../services/authService'

interface Props { onBack: () => void }

const fieldStyle: React.CSSProperties = {
  background: '#f8fffe',
  border: '1.5px solid rgba(0,187,180,0.22)',
  color: '#096d7d',
  borderRadius: '8px',
}

const GENDER_OPTIONS = [
  { value: 'g_male',   label: 'Masculino' },
  { value: 'g_female', label: 'Femenino' },
  { value: 'g_other',  label: 'Otros' },
]

export default function EditProfile({ onBack }: Props) {
  const { t } = useTranslation()

  const [loading,         setLoading]         = useState(true)
  const [saving,          setSaving]          = useState(false)
  const [uploadProgress,  setUploadProgress]  = useState<number | null>(null)
  const [success,         setSuccess]         = useState(false)
  const [errorMsg,        setErrorMsg]        = useState<string | null>(null)

  const [firstName,   setFirstName]   = useState('')
  const [lastName,    setLastName]    = useState('')
  const [nationality, setNationality] = useState('')
  const [gender,      setGender]      = useState('g_male')
  const [age,         setAge]         = useState('')
  const [photoURL,    setPhotoURL]    = useState('')

  const [genderOpen, setGenderOpen] = useState(false)
  const genderRef  = useRef<HTMLDivElement>(null)
  const fileRef    = useRef<HTMLInputElement>(null)

  const uid = auth.currentUser?.uid

  // Cargar datos reales del jugador
  useEffect(() => {
    if (!uid) { setLoading(false); return }
    getPlayerProfile(uid)
      .then(p => {
        if (p) {
          setFirstName(p.firstName   || '')
          setLastName(p.lastName     || '')
          setNationality(p.nationality || '')
          setGender(GENDER_OPTIONS.some(o => o.value === p.gender) ? p.gender! : 'g_male')
          setAge(p.ageRange || '')
          setPhotoURL(p.photoURL || '')
        }
      })
      .finally(() => setLoading(false))
  }, [uid])

  // Cerrar dropdown género al click fuera
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (genderRef.current && !genderRef.current.contains(e.target as Node))
        setGenderOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // Upload foto
  const handlePhotoFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) { setErrorMsg('La imagen no debe superar 5 MB'); return }
    if (!uid) return

    const ext = file.name.split('.').pop() || 'jpg'
    const storageRef = ref(storage, `players/${uid}/avatar.${ext}`)
    const task = uploadBytesResumable(storageRef, file)

    setUploadProgress(0)
    setErrorMsg(null)

    task.on(
      'state_changed',
      snap => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      ()   => { setErrorMsg('Error al subir la foto'); setUploadProgress(null) },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        setPhotoURL(url)
        setUploadProgress(null)
      }
    )
  }

  // Guardar perfil
  const handleSave = async () => {
    if (!uid) return
    setSaving(true)
    setErrorMsg(null)
    try {
      await updatePlayerProfile(uid, {
        firstName:   firstName.trim(),
        lastName:    lastName.trim(),
        gender,
        nationality,
        ageRange:    age,
        ...(photoURL ? { photoURL } : {}),
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    } catch {
      setErrorMsg('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || '?'
  const selectedGender = GENDER_OPTIONS.find(o => o.value === gender)
  const labelCls = 'text-[10px] font-black uppercase tracking-wider block mb-1.5'
  const inputCls = 'w-full px-4 py-3 text-sm font-semibold outline-none transition-all'

  return (
    <div
      className="fixed inset-0 z-60 flex flex-col menu-view-slide-in"
      style={{ background: 'linear-gradient(to bottom, #075f6e 0%, #00bbb4 100%)' }}
    >
      {/* ── Zona teal ── */}
      <div className="shrink-0 px-5 pt-7">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: 'rgba(255,255,255,0.18)' }}
          >
            <i className="ri-arrow-left-line text-xl text-white" />
          </button>
          <span className="font-black text-sm text-white tracking-widest uppercase">
            {t('map.menu_edit_profile')}
          </span>
          <div className="w-10" />
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-2 pb-10">
          <div className="relative">
            {/* Foto o iniciales */}
            <div
              className="h-24 w-24 rounded-full overflow-hidden flex items-center justify-center"
              style={{ border: '4px solid #ffffff', boxShadow: '0 8px 28px rgba(0,0,0,0.22)', background: 'linear-gradient(135deg,#18d5cd 0%,#096d7d 100%)' }}
            >
              {uploadProgress !== null ? (
                <div className="flex flex-col items-center gap-1">
                  <i className="ri-loader-4-line text-white text-xl animate-spin" />
                  <span className="text-white text-[10px] font-bold">{uploadProgress}%</span>
                </div>
              ) : photoURL ? (
                <img
                  src={photoURL}
                  alt="avatar"
                  className="w-full h-full object-cover"
                  onError={() => setPhotoURL('')}
                />
              ) : (
                <span className="text-3xl font-black text-white">{initials}</span>
              )}
            </div>

            {/* Botón lápiz */}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0.5 right-0.5 h-8 w-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}
            >
              <i className="ri-pencil-line text-sm" style={{ color: '#ff9447' }} />
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => e.target.files?.[0] && handlePhotoFile(e.target.files[0])}
            />
          </div>

          {loading ? (
            <i className="ri-loader-4-line text-white text-xl animate-spin mt-1" />
          ) : (
            <h3 className="font-black text-lg mt-1" style={{ color: '#e5dcc6' }}>
              {firstName || lastName ? `${firstName} ${lastName}`.trim() : auth.currentUser?.displayName || ''}
            </h3>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs"
            style={{ color: 'rgba(229,220,198,0.7)' }}
          >
            {t('map.change_photo')}
          </button>
        </div>
      </div>

      {/* ── Card blanca ── */}
      <div
        className="flex-1 min-h-0 rounded-t-3xl flex flex-col overflow-hidden"
        style={{ background: '#ffffff', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)' }}
      >
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <i className="ri-loader-4-line text-3xl animate-spin" style={{ color: '#00bbb4' }} />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 pt-8 pb-6 space-y-4 min-h-0" style={{ scrollbarWidth: 'none' }}>

              {/* Nombre + Apellido */}
              <div className="flex gap-3 min-[400px]:flex-col">
                <div className="flex-1 min-w-0">
                  <label className={labelCls} style={{ color: 'rgba(9,109,125,0.55)' }}>{t('register.firstName')}</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} style={fieldStyle} />
                </div>
                <div className="flex-1 min-w-0">
                  <label className={labelCls} style={{ color: 'rgba(9,109,125,0.55)' }}>{t('register.lastName')}</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className={inputCls} style={fieldStyle} />
                </div>
              </div>

              {/* Nacionalidad */}
              <div>
                <label className={labelCls} style={{ color: 'rgba(9,109,125,0.55)' }}>{t('register.nationality')}</label>
                <CountrySelect value={nationality} onChange={setNationality} isBrandTheme />
              </div>

              {/* Género + Edad */}
              <div className="flex gap-3 min-[400px]:flex-col">
                <div className="flex-1 min-w-0" ref={genderRef}>
                  <label className={labelCls} style={{ color: 'rgba(9,109,125,0.55)' }}>{t('register.gender')}</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setGenderOpen(o => !o)}
                      className="w-full px-4 py-3 text-sm font-semibold text-left flex items-center justify-between transition-all"
                      style={fieldStyle}
                    >
                      <span style={{ color: '#096d7d' }}>{selectedGender?.label}</span>
                      <i className={genderOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ color: '#00bbb4', fontSize: 18 }} />
                    </button>
                    {genderOpen && (
                      <div className="absolute left-0 right-0 mt-1.5 overflow-hidden z-20" style={{ background: '#ffffff', border: '1.5px solid rgba(0,187,180,0.3)', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', top: '100%' }}>
                        {GENDER_OPTIONS.map((opt, i) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => { setGender(opt.value); setGenderOpen(false) }}
                            className="w-full px-4 py-3 text-left text-sm font-semibold flex items-center justify-between transition-colors"
                            style={{ background: gender === opt.value ? '#00bbb4' : 'transparent', color: gender === opt.value ? '#ffffff' : '#096d7d', borderBottom: i < GENDER_OPTIONS.length - 1 ? '1px solid rgba(0,187,180,0.12)' : 'none' }}
                          >
                            <span>{opt.label}</span>
                            {gender === opt.value && <i className="ri-check-line" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <label className={labelCls} style={{ color: 'rgba(9,109,125,0.55)' }}>{t('register.age') || 'Edad'}</label>
                  <input type="number" inputMode="numeric" value={age} onChange={e => setAge(e.target.value)} placeholder="Ej: 25" className={inputCls} style={fieldStyle} />
                </div>
              </div>

              {/* Feedback */}
              {errorMsg && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg animate-fade-in" style={{ background: 'rgba(224,52,75,0.08)', border: '1px solid rgba(224,52,75,0.25)' }}>
                  <i className="ri-error-warning-line shrink-0" style={{ color: '#e0344b' }} />
                  <p className="text-xs font-semibold" style={{ color: '#e0344b' }}>{errorMsg}</p>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg animate-fade-in" style={{ background: 'rgba(0,187,180,0.08)', border: '1px solid rgba(0,187,180,0.3)' }}>
                  <i className="ri-checkbox-circle-fill shrink-0" style={{ color: '#00bbb4' }} />
                  <p className="text-xs font-semibold" style={{ color: '#096d7d' }}>Perfil actualizado correctamente</p>
                </div>
              )}
            </div>

            {/* Botón guardar */}
            <div className="px-5 pb-8 pt-3 shrink-0" style={{ borderTop: '1px solid rgba(0,187,180,0.12)' }}>
              <button
                onClick={handleSave}
                disabled={saving || uploadProgress !== null}
                className="w-full py-4 rounded-2xl text-sm font-black uppercase tracking-wider text-white transition-all active:scale-95 disabled:opacity-60"
                style={{ background: 'linear-gradient(180deg,#18d5cd 0%,#00bbb4 45%,#096d7d 100%)', border: '2px solid #0c7f89', boxShadow: 'inset 0 2px 0 rgba(255,255,255,.35), 0 6px 0 #054f5c, 0 12px 22px rgba(9,109,125,.25)' }}
              >
                {saving
                  ? <i className="ri-loader-4-line animate-spin text-xl" />
                  : t('map.save_changes')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

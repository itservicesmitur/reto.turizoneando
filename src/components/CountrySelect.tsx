import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export interface Country {
  code: string;
  es: string;
  en: string;
}

export const countries: Country[] = [
  { code: 'DO', es: 'República Dominicana', en: 'Dominican Republic' },
  { code: 'US', es: 'Estados Unidos', en: 'United States' },
  { code: 'ES', es: 'España', en: 'Spain' },
  { code: 'CO', es: 'Colombia', en: 'Colombia' },
  { code: 'VE', es: 'Venezuela', en: 'Venezuela' },
  { code: 'MX', es: 'México', en: 'Mexico' },
  { code: 'PR', es: 'Puerto Rico', en: 'Puerto Rico' },
  { code: 'AR', es: 'Argentina', en: 'Argentina' },
  { code: 'CA', es: 'Canadá', en: 'Canada' },
  { code: 'CL', es: 'Chile', en: 'Chile' },
  { code: 'PE', es: 'Perú', en: 'Peru' },
  { code: 'BR', es: 'Brasil', en: 'Brazil' },
  { code: 'IT', es: 'Italia', en: 'Italy' },
  { code: 'FR', es: 'Francia', en: 'France' },
  { code: 'DE', es: 'Alemania', en: 'Germany' },
  { code: 'GB', es: 'Reino Unido', en: 'United Kingdom' },
  { code: 'UY', es: 'Uruguay', en: 'Uruguay' },
  { code: 'PA', es: 'Panamá', en: 'Panama' },
  { code: 'CR', es: 'Costa Rica', en: 'Costa Rica' },
  { code: 'CU', es: 'Cuba', en: 'Cuba' },
  { code: 'EC', es: 'Ecuador', en: 'Ecuador' },
  { code: 'GT', es: 'Guatemala', en: 'Guatemala' },
  { code: 'HN', es: 'Honduras', en: 'Honduras' },
  { code: 'NI', es: 'Nicaragua', en: 'Nicaragua' },
  { code: 'PY', es: 'Paraguay', en: 'Paraguay' },
  { code: 'SV', es: 'El Salvador', en: 'El Salvador' },
  { code: 'BO', es: 'Bolivia', en: 'Bolivia' },
  { code: 'CH', es: 'Suiza', en: 'Switzerland' },
  { code: 'NL', es: 'Países Bajos', en: 'Netherlands' },
  { code: 'BE', es: 'Bélgica', en: 'Belgium' },
  { code: 'PT', es: 'Portugal', en: 'Portugal' },
  { code: 'SE', es: 'Suecia', en: 'Sweden' },
  { code: 'NO', es: 'Noruega', en: 'Norway' },
  { code: 'FI', es: 'Finlandia', en: 'Finland' },
  { code: 'DK', es: 'Dinamarca', en: 'Denmark' },
  { code: 'IE', es: 'Irlanda', en: 'Ireland' },
  { code: 'AT', es: 'Austria', en: 'Austria' },
  { code: 'GR', es: 'Grecia', en: 'Greece' },
  { code: 'CN', es: 'China', en: 'China' },
  { code: 'JP', es: 'Japón', en: 'Japan' },
  { code: 'KR', es: 'Corea del Sur', en: 'South Korea' },
  { code: 'IN', es: 'India', en: 'India' },
  { code: 'RU', es: 'Rusia', en: 'Russia' },
  { code: 'IL', es: 'Israel', en: 'Israel' },
  { code: 'TR', es: 'Turquía', en: 'Turkey' },
  { code: 'ZA', es: 'Sudáfrica', en: 'South Africa' },
  { code: 'AU', es: 'Australia', en: 'Australia' },
  { code: 'NZ', es: 'Nueva Zelanda', en: 'New Zealand' },
];

interface CountrySelectProps {
  value: string;
  onChange: (val: string) => void;
  id?: string;
  isMapTheme?: boolean;
  isBrandTheme?: boolean;
  error?: boolean;
}

export default function CountrySelect({ value, onChange, id, isMapTheme, isBrandTheme, error }: CountrySelectProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const lang = i18n.language === 'en' ? 'en' : 'es';

  // Find country name matching current translation
  const getCountryName = (val: string) => {
    if (!val) return '';
    const match = countries.find(
      c => c.es.toLowerCase() === val.toLowerCase() || c.en.toLowerCase() === val.toLowerCase()
    );
    return match ? (lang === 'en' ? match.en : match.es) : val;
  };

  const filteredCountries = countries.filter(c => {
    const name = lang === 'en' ? c.en : c.es;
    return name.toLowerCase().includes(search.toLowerCase());
  });

  // Handle outside clicks to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (country: Country) => {
    // Save Spanish name in DB by default, or the current selected language name
    const selectedVal = lang === 'en' ? country.en : country.es;
    onChange(selectedVal);
    setIsOpen(false);
    setSearch('');
  };

  // ── Styles based on theme ───────────────────────────────────────────
  const triggerStyle: React.CSSProperties = isBrandTheme
    ? {
        width: '100%',
        height: '46px',
        borderRadius: '8px',
        border: `1.5px solid ${error ? 'var(--color-error)' : 'rgba(0,187,180,0.3)'}`,
        padding: '0 16px',
        fontSize: '14px',
        fontFamily: 'var(--font-body)',
        color: '#096d7d',
        background: '#ffffff',
        outline: 'none',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        transition: 'all 150ms ease'
      }
    : isMapTheme
    ? {
        width: '100%',
        height: '46px',
        borderRadius: '12px',
        border: `1.5px solid ${error ? 'var(--color-error)' : 'rgba(168,127,42,0.3)'}`,
        padding: '0 16px',
        fontSize: '14px',
        fontFamily: 'var(--font-body)',
        color: 'var(--color-map-wood-dark)',
        background: 'var(--color-map-cream-light)',
        outline: 'none',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        transition: 'all 150ms ease'
      }
    : {
        width: '100%',
        height: '52px',
        borderRadius: '14px',
        border: `2px solid ${error ? 'var(--color-error)' : 'var(--color-border)'}`,
        paddingLeft: '42px',
        paddingRight: '14px',
        fontSize: '16px',
        fontFamily: 'var(--font-body)',
        color: 'var(--color-text)',
        background: 'var(--color-gray-light)',
        outline: 'none',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        transition: 'all 150ms ease'
      };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '6px',
    background: '#fff',
    border: isBrandTheme ? '1.5px solid rgba(0,187,180,0.3)' : isMapTheme ? '1.5px solid var(--color-map-gold)' : '2px solid var(--color-border)',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
    zIndex: 100,
    boxSizing: 'border-box',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  };

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    height: '42px',
    border: 'none',
    borderBottom: isBrandTheme ? '1px solid rgba(0,187,180,0.2)' : isMapTheme ? '1px solid rgba(168,127,42,0.2)' : '1px solid var(--color-border)',
    padding: '0 12px',
    fontSize: '14px',
    outline: 'none',
    background: 'transparent',
    color: isBrandTheme ? '#096d7d' : isMapTheme ? 'var(--color-map-wood-dark)' : 'var(--color-text)',
    boxSizing: 'border-box'
  };

  return (
    <div id={id} ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Icon (only for Main Theme) */}
      {!isMapTheme && !isBrandTheme && (
        <i className="ri-earth-line" style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--color-gray-mid)', fontSize: 16, pointerEvents: 'none', zIndex: 2
        }} />
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={triggerStyle}
        onFocus={e => {
          if (!isMapTheme && !isBrandTheme && !error) {
            e.currentTarget.style.borderColor = 'var(--color-navy)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(27,43,110,0.1)';
          }
        }}
        onBlur={e => {
          if (!isMapTheme && !isBrandTheme && !error) {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        <span style={{
          textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap',
          color: value
            ? (isBrandTheme ? '#096d7d' : isMapTheme ? 'var(--color-map-wood-dark)' : 'var(--color-text)')
            : (isBrandTheme ? 'rgba(9,109,125,0.4)' : 'var(--color-gray-mid)')
        }}>
          {getCountryName(value) || (lang === 'en' ? 'Select nationality...' : 'Selecciona nacionalidad...')}
        </span>
        <i className={isOpen ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} style={{
          color: isBrandTheme ? '#00bbb4' : isMapTheme ? 'var(--color-map-gold)' : 'var(--color-gray-mid)', fontSize: 18
        }} />
      </button>

      {/* Dropdown list */}
      {isOpen && (
        <div style={dropdownStyle}>
          {/* Search Box */}
          <input
            type="text"
            placeholder={lang === 'en' ? 'Search country...' : 'Buscar país...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={searchInputStyle}
            autoFocus
          />

          {/* List */}
          <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
            {filteredCountries.length > 0 ? (
              filteredCountries.map(c => {
                const isSelected = value.toLowerCase() === c.es.toLowerCase() || value.toLowerCase() === c.en.toLowerCase();
                const displayName = lang === 'en' ? c.en : c.es;

                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelect(c)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      textAlign: 'left',
                      border: 'none',
                      background: isSelected
                        ? (isBrandTheme ? '#00bbb4' : isMapTheme ? 'var(--color-map-wood-dark)' : 'var(--color-navy)')
                        : 'transparent',
                      color: isSelected
                        ? '#fff'
                        : (isBrandTheme ? '#096d7d' : isMapTheme ? 'var(--color-map-wood-dark)' : 'var(--color-text)'),
                      fontSize: '13px',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 100ms ease'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = isBrandTheme ? 'rgba(0,187,180,0.08)' : isMapTheme ? 'rgba(168,127,42,0.1)' : 'var(--color-gray-light)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <span>{displayName}</span>
                    {isSelected && <i className="ri-check-line" />}
                  </button>
                );
              })
            ) : (
              <div style={{
                padding: '12px', textAlign: 'center', fontSize: '12px',
                color: 'var(--color-text-muted)'
              }}>
                {lang === 'en' ? 'No countries found' : 'No se encontraron países'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Props {
  className?: string
  style?: React.CSSProperties
  /** Frame exacto a mostrar (default 8.875 = 0:00:08:21 @ 24fps) */
  holdAt?: number
}

export default function PersonajePlayer({ className, style, holdAt = 8.875 }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const w = mount.clientWidth  || 200
    const h = mount.clientHeight || 200
    const cAspect = w / h

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: false })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(w, h)
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    const scene  = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-cAspect, cAspect, 1, -1, 0, 1)

    const video = document.createElement('video')
    video.src         = '/assets/img/prueva20.webm'
    video.muted       = true
    video.playsInline = true
    video.crossOrigin = 'anonymous'
    video.preload     = 'auto'

    const texture = new THREE.VideoTexture(video)
    texture.colorSpace       = THREE.SRGBColorSpace
    texture.minFilter        = THREE.LinearFilter
    texture.magFilter        = THREE.LinearFilter
    texture.format           = THREE.RGBAFormat
    texture.premultiplyAlpha = false

    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false })
    const mesh     = new THREE.Mesh(new THREE.PlaneGeometry(2 * cAspect, 2), material)
    scene.add(mesh)

    const fitPlane = () => {
      const vAspect = video.videoWidth / video.videoHeight || 16 / 9
      let pw: number, ph: number
      if (vAspect > cAspect) { pw = 2 * cAspect; ph = pw / vAspect }
      else                   { ph = 2;            pw = ph * vAspect  }
      mesh.geometry.dispose()
      mesh.geometry = new THREE.PlaneGeometry(pw, ph)
    }

    // Saltar al frame deseado en cuanto el video cargue metadata
    video.addEventListener('loadedmetadata', () => {
      fitPlane()
      video.currentTime = holdAt
    })

    // Actualizar textura cuando el seek termina
    video.addEventListener('seeked', () => {
      texture.needsUpdate = true
    })

    let rafId: number
    const render = () => {
      rafId = requestAnimationFrame(render)
      renderer.render(scene, camera)
    }
    render()

    const ro = new ResizeObserver(() => {
      const nw = mount.clientWidth
      const nh = mount.clientHeight
      renderer.setSize(nw, nh)
      const na = nw / nh
      camera.left = -na; camera.right = na
      camera.updateProjectionMatrix()
      fitPlane()
      texture.needsUpdate = true
    })
    ro.observe(mount)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      video.pause()
      video.src = ''
      texture.dispose()
      material.dispose()
      mesh.geometry.dispose()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [holdAt])

  return <div ref={mountRef} className={className} style={style} />
}

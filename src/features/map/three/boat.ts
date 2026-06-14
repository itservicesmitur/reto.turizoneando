import * as THREE from 'three'

export interface BoatColorTheme {
  woodColor: number
  sailsColor: number
  flagColor: number
}

export function createProceduralBoat(theme: BoatColorTheme): THREE.Group {
  const boatGroup = new THREE.Group()

  const woodMaterial = new THREE.MeshStandardMaterial({
    color: theme.woodColor,
    roughness: 0.7,
    metalness: 0.1,
  })

  const deckMaterial = new THREE.MeshStandardMaterial({
    color: 0xd2b48c,
    roughness: 0.8,
    metalness: 0.1,
  })

  const darkWoodMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(theme.woodColor).multiplyScalar(0.5).getHex(),
    roughness: 0.9,
    metalness: 0.1,
  })

  const sailMaterial = new THREE.MeshStandardMaterial({
    color: theme.sailsColor,
    roughness: 0.8,
    metalness: 0.0,
    side: THREE.DoubleSide,
  })

  const flagMaterial = new THREE.MeshStandardMaterial({
    color: theme.flagColor,
    roughness: 0.6,
    metalness: 0.1,
    side: THREE.DoubleSide,
  })

  // Casco
  const hullBodyGeom = new THREE.BoxGeometry(3.5, 9, 2.2)
  const hullBody = new THREE.Mesh(hullBodyGeom, woodMaterial)
  hullBody.position.z = 1.1
  boatGroup.add(hullBody)

  const deckGeom = new THREE.BoxGeometry(3.3, 8.8, 0.1)
  const deck = new THREE.Mesh(deckGeom, deckMaterial)
  deck.position.set(0, 0, 2.2)
  boatGroup.add(deck)

  const bowGeom = new THREE.ConeGeometry(1.75, 3.5, 4)
  const bow = new THREE.Mesh(bowGeom, woodMaterial)
  bow.rotation.y = Math.PI / 4
  bow.position.set(0, 4.5 + 1.75, 1.1)
  bow.scale.set(1.41, 1, 0.88)
  boatGroup.add(bow)

  const sternGeom = new THREE.BoxGeometry(3.5, 2.8, 1.5)
  const stern = new THREE.Mesh(sternGeom, darkWoodMaterial)
  stern.position.set(0, -3.1, 2.2 + 0.75)
  boatGroup.add(stern)

  const createCurvedSail = (width: number, height: number, depth: number) => {
    const sailGeom = new THREE.PlaneGeometry(width, height, 10, 2)
    const posAttr = sailGeom.attributes.position
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i)
      const bulge = Math.cos((x / width) * Math.PI) * depth
      posAttr.setZ(i, posAttr.getZ(i) - bulge)
    }
    sailGeom.computeVertexNormals()
    const sailMesh = new THREE.Mesh(sailGeom, sailMaterial)
    sailMesh.rotation.x = Math.PI / 2
    sailMesh.rotation.z = Math.PI / 2
    return sailMesh
  }

  const addMast = (yPos: number, mastHeight: number, zStart: number, mastRadius: number) => {
    const mastGroup = new THREE.Group()
    mastGroup.position.set(0, yPos, zStart)

    const mastGeom = new THREE.CylinderGeometry(mastRadius * 0.7, mastRadius, mastHeight, 8)
    const mast = new THREE.Mesh(mastGeom, darkWoodMaterial)
    mast.rotation.x = Math.PI / 2
    mast.position.z = mastHeight / 2
    mastGroup.add(mast)

    const yardGeom1 = new THREE.CylinderGeometry(0.08, 0.08, mastRadius * 25, 8)
    const yard1 = new THREE.Mesh(yardGeom1, darkWoodMaterial)
    yard1.position.z = mastHeight * 0.4
    yard1.rotation.z = Math.PI / 2
    mastGroup.add(yard1)

    const yardGeom2 = new THREE.CylinderGeometry(0.06, 0.06, mastRadius * 18, 8)
    const yard2 = new THREE.Mesh(yardGeom2, darkWoodMaterial)
    yard2.position.z = mastHeight * 0.8
    yard2.rotation.z = Math.PI / 2
    mastGroup.add(yard2)

    const sail1 = createCurvedSail(mastRadius * 24, mastHeight * 0.35, 0.8)
    sail1.position.set(0, 0.3, mastHeight * 0.4)
    mastGroup.add(sail1)

    const sail2 = createCurvedSail(mastRadius * 17, mastHeight * 0.3, 0.6)
    sail2.position.set(0, 0.2, mastHeight * 0.8)
    mastGroup.add(sail2)

    boatGroup.add(mastGroup)
    return mastGroup
  }

  addMast(2.2, 8.5, 2.0, 0.12)
  addMast(-0.5, 11, 2.2, 0.16)

  const mizzenMastGroup = new THREE.Group()
  mizzenMastGroup.position.set(0, -3.1, 3.7)

  const mizzenMastGeom = new THREE.CylinderGeometry(0.08, 0.1, 6.5, 8)
  const mizzenMast = new THREE.Mesh(mizzenMastGeom, darkWoodMaterial)
  mizzenMast.rotation.x = Math.PI / 2
  mizzenMast.position.z = 3.25
  mizzenMastGroup.add(mizzenMast)

  const triangularSailGeom = new THREE.ConeGeometry(1.6, 5, 4)
  const triangularSail = new THREE.Mesh(triangularSailGeom, sailMaterial)
  triangularSail.rotation.z = Math.PI
  triangularSail.rotation.y = Math.PI / 4
  triangularSail.rotation.x = Math.PI / 2.2
  triangularSail.position.set(0, -0.4, 3.25)
  triangularSail.scale.set(0.1, 1, 1)
  mizzenMastGroup.add(triangularSail)

  boatGroup.add(mizzenMastGroup)

  const flagGroup = new THREE.Group()
  flagGroup.position.set(0, -0.5, 13.2)
  const flagGeom = new THREE.BoxGeometry(1.4, 0.04, 0.6)
  const flag = new THREE.Mesh(flagGeom, flagMaterial)
  flag.position.set(0, -0.7, 0)
  flagGroup.add(flag)
  boatGroup.add(flagGroup)

  return boatGroup
}

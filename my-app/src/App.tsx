import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import './index.css'

type Tire = { id: string; position: string; status: string; pressure: string; tread: string; life: number; top: string; left: string }
const tires: Tire[] = [
  { id: 'Dianteiro esquerdo', position: '1E', status: 'Bom', pressure: '102 PSI', tread: '13,2 mm', life: 78, top: '63%', left: '35%' },
  { id: 'Dianteiro direito', position: '1D', status: 'Atenção', pressure: '88 PSI', tread: '9,8 mm', life: 54, top: '62%', left: '64%' },
  { id: 'Traseiro esquerdo', position: '2E', status: 'Bom', pressure: '106 PSI', tread: '15,1 mm', life: 91, top: '78%', left: '73%' },
  { id: 'Traseiro direito', position: '2D', status: 'Bom', pressure: '104 PSI', tread: '14,6 mm', life: 86, top: '77%', left: '21%' },
]

function TruckScene({ onTireSelect }: { onTireSelect: (tire: Tire) => void }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const rotationRef = useRef(Math.PI)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(28, mount.clientWidth / mount.clientHeight, 0.1, 100)
    camera.position.set(-9.4, 5.1, 9.8)
    camera.lookAt(0, 1.15, 0)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)

    scene.add(new THREE.HemisphereLight(0xdce8ff, 0x1a2029, 2.5))
    const keyLight = new THREE.DirectionalLight(0xffffff, 4)
    keyLight.position.set(-5, 8, 7)
    keyLight.castShadow = true
    scene.add(keyLight)
    const rimLight = new THREE.PointLight(0x4a98ff, 22, 16)
    rimLight.position.set(4, 1.5, -4)
    scene.add(rimLight)

    const truck = new THREE.Group()
    const metal = new THREE.MeshStandardMaterial({ color: 0xc1c8d0, metalness: 0.7, roughness: 0.3 })
    const dark = new THREE.MeshStandardMaterial({ color: 0x171d24, metalness: 0.5, roughness: 0.5 })
    const rubber = new THREE.MeshStandardMaterial({ color: 0x090b0d, roughness: 0.92 })
    const blue = new THREE.MeshStandardMaterial({ color: 0x1e79e5, emissive: 0x062b66, emissiveIntensity: 0.8, metalness: 0.5 })
    const addBox = (size: [number, number, number], position: [number, number, number], material: THREE.Material, bevel = 0) => {
      const geometry = new RoundedBoxGeometry(...size, Math.min(0.12, Math.min(...size) / 5), 4)
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(...position)
      mesh.castShadow = true
      mesh.receiveShadow = true
      truck.add(mesh)
      if (bevel) mesh.geometry.center()
      return mesh
    }
    addBox([2.2, 2.25, 3.7], [-2.2, 1.65, 0], metal, 1)
    addBox([2.35, 0.22, 3.75], [-2.2, 2.85, 0], dark, 1)
    addBox([2.05, 1.25, 1.1], [-2.15, 1.25, 1.5], dark, 1)
    addBox([1.5, 0.9, 0.08], [-2.2, 1.9, 1.88], new THREE.MeshStandardMaterial({ color: 0x15202b, roughness: 0.12 }))
    addBox([0.65, 0.8, 4.8], [0.25, 2.05, 0], metal, 1)
    addBox([0.75, 0.16, 4.9], [0.25, 3.08, 0], dark, 1)
    addBox([0.16, 1.8, 4.0], [-0.2, 2.0, 0], metal, 1)
    addBox([0.14, 0.45, 0.72], [-3.32, 1.18, 1.22], new THREE.MeshStandardMaterial({ color: 0xf3f6fb, emissive: 0xb7d6ff, emissiveIntensity: 1.2 }), 1)
    addBox([0.14, 0.45, 0.72], [-3.32, 1.18, -1.22], new THREE.MeshStandardMaterial({ color: 0xf3f6fb, emissive: 0xb7d6ff, emissiveIntensity: 1.2 }), 1)
    addBox([0.16, 0.7, 2.6], [-3.3, 0.55, 0], dark, 1)
    addBox([0.2, 0.35, 1.2], [-3.28, 0.75, 1.35], dark)
    addBox([0.2, 0.35, 1.2], [-3.28, 0.75, -1.35], dark)
    addBox([5.5, 0.25, 0.25], [-0.15, 0.8, 0], dark)

    const tireMeshes: THREE.Mesh[] = []
    const tireGeometry = new THREE.CylinderGeometry(0.63, 0.63, 0.34, 32)
    const rimGeometry = new THREE.CylinderGeometry(0.29, 0.29, 0.36, 24)
    const wheelPositions: [number, number, number, number][] = [[-2.25, 0.65, 1.82, 0], [-2.25, 0.65, -1.82, 1], [1.45, 0.65, 1.82, 2], [1.45, 0.65, -1.82, 3]]
    wheelPositions.forEach(([x, y, z, tireIndex]) => {
      const wheel = new THREE.Mesh(tireGeometry, rubber)
      wheel.rotation.x = Math.PI / 2
      wheel.position.set(x, y, z)
      wheel.castShadow = true
      wheel.userData.tireIndex = tireIndex
      truck.add(wheel)
      const rim = new THREE.Mesh(rimGeometry, blue)
      rim.rotation.x = Math.PI / 2
      rim.position.set(x, y, z + (z > 0 ? 0.02 : -0.02))
      truck.add(rim)
      tireMeshes.push(wheel)
    })
    truck.position.set(0.72, -0.1, 0)
    scene.add(truck)
    const modelMeshes: THREE.Mesh[] = []
    let importedModel: THREE.Object3D | null = null
    const modelLoader = new OBJLoader()
    const loadModel = (model: THREE.Group) => {
      importedModel = model
      const modelBounds = new THREE.Box3().setFromObject(model)
      const modelSize = modelBounds.getSize(new THREE.Vector3())
      const modelCenter = modelBounds.getCenter(new THREE.Vector3())
      const scale = 4.9 / Math.max(modelSize.x, modelSize.y, modelSize.z)
      model.scale.setScalar(scale)
      model.position.set(-modelCenter.x * scale, -modelCenter.y * scale + 0.58, -modelCenter.z * scale)
      model.rotation.y = Math.PI
      model.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return
        child.castShadow = true
        child.receiveShadow = true
        modelMeshes.push(child)
      })
      truck.visible = false
      scene.add(model)
    }
    const materialLoader = new MTLLoader()
    materialLoader.load('/model/camion%20jugete.mtl', (materials) => {
      materials.preload()
      modelLoader.setMaterials(materials)
      modelLoader.load('/model/camion%20jugete.obj', loadModel)
    }, undefined, () => modelLoader.load('/model/camion%20jugete.obj', loadModel))
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.5, 0.18, 64), new THREE.MeshStandardMaterial({ color: 0x29323c, metalness: 0.75, roughness: 0.38 }))
    floor.position.y = -0.08
    floor.receiveShadow = true
    scene.add(floor)

    let dragging = false
    let lastX = 0
    const pointerDown = (event: PointerEvent) => { dragging = true; lastX = event.clientX; renderer.domElement.setPointerCapture(event.pointerId) }
    const pointerMove = (event: PointerEvent) => { if (!dragging) return; rotationRef.current += (event.clientX - lastX) * 0.01; lastX = event.clientX }
    const pointerUp = () => { dragging = false }
    const wheel = (event: WheelEvent) => { event.preventDefault(); camera.position.multiplyScalar(event.deltaY > 0 ? 1.08 : 0.92); camera.position.clampLength(6, 13) }
    const click = (event: MouseEvent) => {
      if (dragging) return
      const bounds = renderer.domElement.getBoundingClientRect()
      const pointer = new THREE.Vector2(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1)
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(modelMeshes.length ? modelMeshes : tireMeshes)[0]
      if (hit) {
        const hitPoint = hit.point
        const nearestTire = tires.reduce((closest, _, index) => {
          const expectedX = index < 2 ? -2.25 : 1.45
          const distance = Math.abs(hitPoint.x - (expectedX + 0.72))
          return distance < closest.distance ? { distance, index } : closest
        }, { distance: Infinity, index: 0 })
        onTireSelect(tires[nearestTire.index])
      }
    }
    renderer.domElement.addEventListener('pointerdown', pointerDown)
    renderer.domElement.addEventListener('pointermove', pointerMove)
    renderer.domElement.addEventListener('pointerup', pointerUp)
    renderer.domElement.addEventListener('click', click)
    renderer.domElement.addEventListener('wheel', wheel, { passive: false })
    const resize = () => { camera.aspect = mount.clientWidth / mount.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(mount.clientWidth, mount.clientHeight) }
    window.addEventListener('resize', resize)
    let frame = 0
    const animate = () => {
      frame = requestAnimationFrame(animate)
      const activeModel = importedModel ?? truck
      activeModel.rotation.y += (rotationRef.current - activeModel.rotation.y) * 0.12
      renderer.render(scene, camera)
    }
    animate()
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); renderer.dispose(); mount.removeChild(renderer.domElement) }
  }, [onTireSelect])

  return <div className="truck-stage"><div ref={mountRef} className="three-canvas" /><div className="stage-glow" /></div>
}

function App() {
  const [selectedTire, setSelectedTire] = useState<Tire | null>(null)
  const [plate, setPlate] = useState('ABC1D23')
  const [showHelp, setShowHelp] = useState(false)

  return <main className="app-shell">
    <header className="topbar"><div className="brand-lockup"><div className="brand-mark">◉</div><div><h1>Controle de Pneus</h1><p>Troca, Recapagens e Vida Útil</p></div></div><button className="settings-button" type="button" aria-label="Abrir configurações">⚙ <span>Configurações</span></button></header>
    <section className="workspace">
      <div className="plate-area"><span className="eyebrow">Placa do veículo</span><div className="plate"><div className="plate-header">BRASIL <span>◆</span></div><input aria-label="Placa do veículo" maxLength={7} value={plate} onChange={(event) => setPlate(event.target.value.toUpperCase())} /><span className="plate-country">BR</span></div></div>
      <TruckScene onTireSelect={setSelectedTire} />
      <div className="rotate-hint"><b>↪</b><span>Arraste para girar o caminhão</span><b>↩</b></div>
      <div className="guide-panel"><button className="guide-title" type="button" onClick={() => setShowHelp(!showHelp)}>ⓘ <span>Como usar</span><i /></button>{showHelp && <p className="help-copy">Selecione um pneu no caminhão para consultar pressão, sulco e vida útil.</p>}<div className="guide-items"><div><strong>♧</strong><p><b>Clique em um pneu</b><br />para ver detalhes</p></div><div><strong>⟳</strong><p><b>Registre trocas</b><br />e recapagens</p></div><div><strong>▥</strong><p><b>Acompanhe a vida útil</b><br />de cada pneu</p></div></div></div>
    </section>
    {selectedTire && <aside className="tire-drawer"><button className="close-button" type="button" onClick={() => setSelectedTire(null)} aria-label="Fechar detalhes">×</button><span className="eyebrow">Posição {selectedTire.position}</span><h2>{selectedTire.id}</h2><span className={`status status-${selectedTire.status === 'Bom' ? 'good' : 'warning'}`}>{selectedTire.status}</span><div className="detail-metric"><span>Vida útil estimada</span><strong>{selectedTire.life}%</strong><div className="progress"><i style={{ width: `${selectedTire.life}%` }} /></div></div><div className="metric-grid"><div>◌ <span>Pressão<strong>{selectedTire.pressure}</strong></span></div><div>◉ <span>Sulco<strong>{selectedTire.tread}</strong></span></div></div><button className="primary-button" type="button">Registrar ocorrência</button></aside>}
  </main>
}

export default App

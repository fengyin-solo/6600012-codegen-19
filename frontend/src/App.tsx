import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import ParticleSystem from './components/ParticleSystem'
import ControlPanel from './components/ControlPanel'
import StatsOverlay from './components/StatsOverlay'
import ObserverNotes from './components/ObserverNotes'

export default function App() {
  const [activeTab, setActiveTab] = useState<'control' | 'notes'>('control')

  return (
    <div className="flex w-full h-full">
      <div className="flex-1 relative">
        <Canvas camera={{ position: [0, 0, 30], fov: 60 }}>
          <color attach="background" args={['#050510']} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Stars radius={80} depth={50} count={1000} factor={3} />
          <ParticleSystem />
          <OrbitControls makeDefault enableDamping />
        </Canvas>
        <StatsOverlay />
      </div>
      <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col">
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('control')}
            className={`flex-1 py-2.5 text-xs font-medium transition ${
              activeTab === 'control'
                ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800/50'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            🎛️ 控制面板
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex-1 py-2.5 text-xs font-medium transition relative ${
              activeTab === 'notes'
                ? 'text-green-400 border-b-2 border-green-400 bg-gray-800/50'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            📝 观察笔记
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {activeTab === 'control' ? <ControlPanel /> : <ObserverNotes />}
        </div>
      </div>
    </div>
  )
}

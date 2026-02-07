import React, { useState, useMemo } from 'react';
import { AppState, SavedAnimation, EasingType } from '../../types';
import { Settings, Play, Pause, Save, Monitor, Film, Plus, Trash2, Download, Folder, ChevronRight, ChevronDown, Sparkles, RotateCcw } from 'lucide-react';

interface Props {
    state: AppState;
    updateSphere: (k: keyof AppState['sphere'], v: any) => void;
    updateRings: (k: keyof AppState['rings'], v: any) => void;
    updateParticles: (k: keyof AppState['particles'], v: any) => void;
    updateTransform: (obj: 'sphere'|'ring1'|'ring2'|'ring3', type: 'position'|'rotation'|'scale', axis: 'x'|'y'|'z', val: number) => void;
    setAnimation: (k: keyof AppState['animation'], v: any) => void;
    addKeyframe: (easing: EasingType) => void;
    scrubTimeline: (time: number) => void;
    savedAnimations: SavedAnimation[];
    onSave: (name: string, folder: string) => void;
    onLoad: (anim: SavedAnimation) => void;
    onDelete: (id: string) => void;
    onExport: () => void;
}

export const ControlPanel: React.FC<Props> = ({ 
    state, updateSphere, updateRings, updateParticles, updateTransform, setAnimation, addKeyframe, scrubTimeline, savedAnimations, onSave, onLoad, onDelete, onExport 
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'sphere'|'rings'|'particles'|'anim'|'library'>('anim');
    const [selectedObj, setSelectedObj] = useState<'sphere'|'ring1'|'ring2'|'ring3'>('sphere');
    const [selectedEasing, setSelectedEasing] = useState<EasingType>('easeInOut');
    const [saveName, setSaveName] = useState('');
    const [saveFolder, setSaveFolder] = useState('My Animations');
    const [openFolders, setOpenFolders] = useState<Record<string,boolean>>({'My Animations': true});

    const Slider = ({ label, value, min, max, step, onChange }: any) => (
        <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-400">{label}</span>
                <input type="number" value={value} step={step} min={min} max={max} onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="w-14 bg-slate-800 border border-slate-700 rounded px-1 text-[10px] text-right text-cyan-200 focus:outline-none focus:border-cyan-500" />
            </div>
            <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-cyan-500" />
        </div>
    );

    const Toggle = ({ label, value, onChange }: any) => (
        <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-slate-400">{label}</span>
            <button 
                onClick={() => onChange(!value)}
                className={`w-8 h-4 rounded-full relative transition-colors ${value ? 'bg-cyan-600' : 'bg-slate-700'}`}
            >
                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${value ? 'translate-x-4' : ''}`} />
            </button>
        </div>
    );

    const VectorInput = ({ label, vec, onChange }: any) => (
        <div className="mb-2">
            <span className="text-[10px] text-cyan-400 block mb-1">{label}</span>
            <div className="flex gap-1">
                {['x','y','z'].map(axis => (
                    <div key={axis} className="relative w-full">
                        <span className="absolute left-1 top-0.5 text-[9px] text-slate-500 uppercase font-bold">{axis}</span>
                        <input type="number" value={vec[axis]} onChange={(e) => onChange(axis, parseFloat(e.target.value))}
                            onContextMenu={(e) => { e.preventDefault(); onChange(axis, 0); }}
                            className="w-full bg-slate-800 border border-slate-700 rounded pl-3 pr-1 py-0.5 text-[10px] text-white focus:border-cyan-500 outline-none" 
                        />
                    </div>
                ))}
            </div>
        </div>
    );

    const updateRingSpeed = (key: 'ring1Speed'|'ring2Speed'|'ring3Speed', axis: string, val: number) => {
        updateRings(key, { ...state.rings[key], [axis]: val });
    };

    const groupedAnimations = useMemo(() => {
        const groups: Record<string, SavedAnimation[]> = {};
        savedAnimations.forEach(anim => {
            const f = anim.folder || 'Unsorted';
            if(!groups[f]) groups[f] = [];
            groups[f].push(anim);
        });
        return groups;
    }, [savedAnimations]);

    return (
        <div className={`absolute top-0 right-0 h-full bg-slate-900/95 backdrop-blur-xl text-slate-200 transition-all z-20 border-l border-slate-800 ${isOpen ? 'w-80' : 'w-0'}`}>
            <button onClick={() => setIsOpen(!isOpen)} className="absolute -left-10 top-4 bg-slate-800 p-2 rounded-l-md border border-slate-700">
                <Settings size={20} className={isOpen?"text-cyan-400":"text-slate-400"} />
            </button>
            <div className={`p-4 h-full overflow-y-auto ${!isOpen&&'hidden'}`}>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-cyan-400"><Monitor size={18} /><span>CHRONOS OS</span></h2>
                <div className="flex gap-1 mb-4 border-b border-slate-700 pb-1 overflow-x-auto">
                    {['anim','sphere','rings','particles','library'].map(t => (
                        <button key={t} onClick={() => setActiveTab(t as any)} className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wide ${activeTab===t ? 'text-cyan-400 border-b-2 border-cyan-400':'text-slate-500'}`}>{t}</button>
                    ))}
                </div>

                {activeTab === 'anim' && (
                    <div className="space-y-4">
                        <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
                            <h3 className="text-xs font-bold text-cyan-300 mb-2 flex items-center gap-1"><Film size={12}/> TIMELINE EDITOR</h3>
                            <div className="flex items-center gap-2 mb-3">
                                <button onClick={() => setAnimation('isPlaying', !state.animation.isPlaying)} className={`p-2 rounded ${state.animation.isPlaying?'bg-red-500/20 text-red-400':'bg-cyan-500/20 text-cyan-400'}`}>
                                    {state.animation.isPlaying ? <Pause size={14}/> : <Play size={14}/>}
                                </button>
                                <button onClick={() => { setAnimation('isPlaying', false); scrubTimeline(0); }} className="p-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-300" title="Reset Timeline">
                                    <RotateCcw size={14}/>
                                </button>
                                <div className="flex-1">
                                    <input type="range" min={0} max={state.animation.duration} value={state.animation.currentTime} 
                                        onChange={(e) => scrubTimeline(parseFloat(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                    />
                                </div>
                                <span className="text-[10px] font-mono text-cyan-200 w-10 text-right">{(state.animation.currentTime/1000).toFixed(1)}s</span>
                            </div>
                            <div className="mb-2">
                                <span className="text-[10px] text-slate-400 block mb-1">Easing Curve</span>
                                <div className="flex gap-1 mb-2">
                                    {(['linear', 'easeIn', 'easeOut', 'easeInOut'] as EasingType[]).map(e => (
                                        <button key={e} onClick={() => setSelectedEasing(e)} className={`flex-1 text-[8px] py-1 border rounded ${selectedEasing===e?'bg-cyan-500 text-white border-cyan-500':'border-slate-600 text-slate-500'}`}>
                                            {e.replace('ease','').toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => addKeyframe(selectedEasing)} className="w-full bg-slate-700 hover:bg-cyan-600 text-white text-xs py-1.5 rounded flex items-center justify-center gap-2">
                                    <Plus size={12}/> ADD KEYFRAME AT CURRENT TIME
                                </button>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-700">
                                <span>Duration:</span>
                                <input type="number" value={state.animation.duration} onChange={(e) => setAnimation('duration', parseFloat(e.target.value))} className="w-12 bg-slate-900 border border-slate-700 rounded px-1" />
                            </div>
                        </div>

                        <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
                            <h3 className="text-xs font-bold text-cyan-300 mb-2">TRANSFORMS (Scrub to Edit)</h3>
                            <div className="flex gap-1 mb-3">
                                {['sphere','ring1','ring2','ring3'].map(o => (
                                    <button key={o} onClick={() => setSelectedObj(o as any)} className={`flex-1 py-1 text-[9px] rounded border ${selectedObj===o?'bg-cyan-500/20 border-cyan-500 text-cyan-200':'border-slate-600 text-slate-500'}`}>{o.replace(/\d/,' $&').toUpperCase()}</button>
                                ))}
                            </div>
                            <VectorInput label="POSITION" vec={state.transforms[selectedObj].position} onChange={(a:any,v:any)=>updateTransform(selectedObj,'position',a,v)} />
                            <VectorInput label="ROTATION" vec={state.transforms[selectedObj].rotation} onChange={(a:any,v:any)=>updateTransform(selectedObj,'rotation',a,v)} />
                            <VectorInput label="SCALE" vec={state.transforms[selectedObj].scale} onChange={(a:any,v:any)=>updateTransform(selectedObj,'scale',a,v)} />
                        </div>

                        <div className="p-2 bg-cyan-900/20 border border-cyan-800/50 rounded">
                             <h3 className="text-xs font-bold text-cyan-300 mb-2">SAVE TO LIBRARY</h3>
                             <input type="text" placeholder="Folder Name" value={saveFolder} onChange={(e)=>setSaveFolder(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs mb-2 text-white" />
                             <input type="text" placeholder="Animation Name" value={saveName} onChange={(e)=>setSaveName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs mb-2 text-white" />
                             <button onClick={() => { onSave(saveName, saveFolder); setSaveName(''); }} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs py-1 rounded flex items-center justify-center gap-2"><Save size={12}/> SET END & SAVE</button>
                        </div>
                    </div>
                )}

                {activeTab === 'particles' && (
                     <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-4 text-cyan-300"><Sparkles size={16}/><span className="text-sm font-bold">Particle Field</span></div>
                        <div className="mb-3">
                            <span className="text-[10px] text-slate-400 block mb-1">Bind To Object</span>
                            <select value={state.particles.target} onChange={(e) => updateParticles('target', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-cyan-200 focus:outline-none">
                                {['global', 'sphere', 'ring1', 'ring2', 'ring3'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                            </select>
                        </div>
                        <input type="color" value={state.particles.color} onChange={(e) => updateParticles('color', e.target.value)} className="w-full h-6 bg-slate-800 rounded mb-2" />
                        <Slider label="Twist" value={state.particles.twist} min={-5} max={5} step={0.1} onChange={(v:number) => updateParticles('twist', v)} />
                        <Slider label="Cloud Scale" value={state.particles.overallScale} min={0} max={5} step={0.1} onChange={(v:number) => updateParticles('overallScale', v)} />
                        <Slider label="Bloom Disp" value={state.particles.bloom} min={0} max={5} step={0.1} onChange={(v:number) => updateParticles('bloom', v)} />
                        <div className="h-px bg-slate-700 my-2"></div>
                        <Slider label="Count" value={state.particles.count} min={0} max={10000} step={100} onChange={(v:number) => updateParticles('count', v)} />
                        <Slider label="Point Size" value={state.particles.size} min={0.01} max={0.5} step={0.01} onChange={(v:number) => updateParticles('size', v)} />
                        <Slider label="Radius" value={state.particles.radius} min={1} max={50} step={0.5} onChange={(v:number) => updateParticles('radius', v)} />
                        <Slider label="Speed" value={state.particles.speed} min={0} max={2} step={0.01} onChange={(v:number) => updateParticles('speed', v)} />
                        <Slider label="Opacity" value={state.particles.opacity} min={0} max={1} step={0.01} onChange={(v:number) => updateParticles('opacity', v)} />
                        <Slider label="Noise" value={state.particles.noiseStrength} min={0} max={2} step={0.01} onChange={(v:number) => updateParticles('noiseStrength', v)} />
                    </div>
                )}
                
                {(activeTab === 'sphere' || activeTab === 'rings') && (
                     <div className="space-y-1">
                        {activeTab === 'sphere' ? (
                            <>
                                <input type="color" value={state.sphere.color} onChange={(e) => updateSphere('color', e.target.value)} className="w-full h-6 bg-slate-800 rounded mb-2" />
                                <Toggle label="Wireframe" value={state.sphere.wireframe} onChange={(v: boolean) => updateSphere('wireframe', v)} />
                                <Slider label="Pulse Speed" value={state.sphere.pulseSpeed} min={0} max={10} step={0.1} onChange={(v:number) => updateSphere('pulseSpeed', v)} />
                                <Slider label="Pulse Amp" value={state.sphere.pulseAmplitude} min={0} max={2} step={0.1} onChange={(v:number) => updateSphere('pulseAmplitude', v)} />
                                <Slider label="Faces" value={state.sphere.widthSegments} min={16} max={128} step={1} onChange={(v:number) => { updateSphere('widthSegments', v); updateSphere('heightSegments', v); }} />
                                <Slider label="Radius" value={state.sphere.radius} min={0.5} max={4} step={0.1} onChange={(v:number) => updateSphere('radius', v)} />
                                <Slider label="Fold" value={state.sphere.foldAmount} min={0} max={5} step={0.1} onChange={(v:number) => updateSphere('foldAmount', v)} />
                                <Slider label="Luma Scale" value={state.sphere.lumaPatternScale} min={1} max={20} step={0.1} onChange={(v:number) => updateSphere('lumaPatternScale', v)} />
                            </>
                        ) : (
                             <>
                                <input type="color" value={state.rings.color} onChange={(e) => updateRings('color', e.target.value)} className="w-full h-6 bg-slate-800 rounded mb-2" />
                                <Slider label="Base Radius" value={state.rings.baseRadius} min={2} max={8} step={0.1} onChange={(v:number) => updateRings('baseRadius', v)} />
                                <Slider label="Thickness" value={state.rings.tubeThickness} min={0.01} max={1} step={0.01} onChange={(v:number) => updateRings('tubeThickness', v)} />
                                
                                <div className="h-px bg-slate-700 my-2"></div>
                                <span className="text-xs font-bold text-cyan-300 mb-2 block">Ring 1 Orbit</span>
                                <Slider label="Speed X" value={state.rings.ring1Speed.x} min={-2} max={2} step={0.05} onChange={(v:number) => updateRingSpeed('ring1Speed', 'x', v)} />
                                <Slider label="Speed Y" value={state.rings.ring1Speed.y} min={-2} max={2} step={0.05} onChange={(v:number) => updateRingSpeed('ring1Speed', 'y', v)} />
                                <Slider label="Speed Z" value={state.rings.ring1Speed.z} min={-2} max={2} step={0.05} onChange={(v:number) => updateRingSpeed('ring1Speed', 'z', v)} />

                                <span className="text-xs font-bold text-cyan-300 mb-2 block mt-3">Ring 2 Orbit</span>
                                <Slider label="Speed X" value={state.rings.ring2Speed.x} min={-2} max={2} step={0.05} onChange={(v:number) => updateRingSpeed('ring2Speed', 'x', v)} />
                                <Slider label="Speed Y" value={state.rings.ring2Speed.y} min={-2} max={2} step={0.05} onChange={(v:number) => updateRingSpeed('ring2Speed', 'y', v)} />
                                <Slider label="Speed Z" value={state.rings.ring2Speed.z} min={-2} max={2} step={0.05} onChange={(v:number) => updateRingSpeed('ring2Speed', 'z', v)} />

                                <span className="text-xs font-bold text-cyan-300 mb-2 block mt-3">Ring 3 Orbit</span>
                                <Slider label="Speed X" value={state.rings.ring3Speed.x} min={-2} max={2} step={0.05} onChange={(v:number) => updateRingSpeed('ring3Speed', 'x', v)} />
                                <Slider label="Speed Y" value={state.rings.ring3Speed.y} min={-2} max={2} step={0.05} onChange={(v:number) => updateRingSpeed('ring3Speed', 'y', v)} />
                                <Slider label="Speed Z" value={state.rings.ring3Speed.z} min={-2} max={2} step={0.05} onChange={(v:number) => updateRingSpeed('ring3Speed', 'z', v)} />
                             </>
                        )}
                    </div>
                )}

                 {activeTab === 'library' && (
                    <div className="space-y-2">
                         <button onClick={onExport} className="w-full bg-slate-700 hover:bg-cyan-800 text-xs py-1 rounded flex items-center justify-center gap-2 mb-2"><Download size={12}/> Export Library to .GLB</button>
                         {Object.entries(groupedAnimations).map(([folder, anims]: [string, SavedAnimation[]]) => (
                             <div key={folder} className="mb-2">
                                <button onClick={() => setOpenFolders(p => ({...p, [folder]: !p[folder]}))} className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-cyan-300 mb-1 w-full text-left">
                                    {openFolders[folder] ? <ChevronDown size={12}/> : <ChevronRight size={12}/>} <Folder size={12}/> {folder}
                                </button>
                                {openFolders[folder] && (
                                    <div className="pl-2 space-y-1">
                                        {anims.map(anim => (
                                            <div key={anim.id} className="flex justify-between items-center bg-slate-800/50 p-2 rounded border border-slate-700 hover:border-cyan-500/30">
                                                <span className="text-[10px] text-cyan-100 truncate w-24">{anim.name}</span>
                                                <div className="flex gap-2">
                                                    <button onClick={() => onLoad(anim)} title="Load"><Play size={12} className="text-cyan-400 hover:text-cyan-200"/></button>
                                                    <button onClick={() => onDelete(anim.id)} title="Delete"><Trash2 size={12} className="text-red-500 hover:text-red-300"/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                             </div>
                         ))}
                    </div>
                )}
            </div>
        </div>
    );
};
import React, { useState } from 'react';
import { ApiProvider } from '../types';

interface BatchFilters {
    ageMin?: number;
    ageMax?: number;
    gender?: string;
    race?: string;
    disposition?: string;
    height?: string;
    weight?: string;
    bodyType?: string;
}

interface BatchGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string, count: number, type: 'character' | 'scenario', filters?: BatchFilters) => Promise<void>;
  isGenerating: boolean;
  provider: ApiProvider;
}

const BatchGenerator: React.FC<BatchGeneratorProps> = ({ 
  isOpen, onClose, onGenerate, isGenerating, provider 
}) => {
  const [theme, setTheme] = useState('');
  const [count, setCount] = useState(3);
  const [type, setType] = useState<'character' | 'scenario'>('character');

  // Filters
  const [ageMin, setAgeMin] = useState<number | ''>('');
  const [ageMax, setAgeMax] = useState<number | ''>('');
  const [gender, setGender] = useState('Any');
  const [race, setRace] = useState('');
  const [disposition, setDisposition] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bodyType, setBodyType] = useState('');

  const [showFilters, setShowFilters] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme.trim()) return;
    
    const filters: BatchFilters = {
        ageMin: ageMin !== '' ? ageMin : undefined,
        ageMax: ageMax !== '' ? ageMax : undefined,
        gender: gender !== 'Any' ? gender : undefined,
        race: race.trim() || undefined,
        disposition: disposition.trim() || undefined,
        height: height.trim() || undefined,
        weight: weight.trim() || undefined,
        bodyType: bodyType.trim() || undefined,
    };

    onGenerate(theme, count, type, filters);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-gray-800 bg-gray-950 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-blue-400">Batch Creative Engine</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
           {/* Basic Info */}
           <div className="space-y-2">
             <label className="block text-sm text-gray-300">Generation Type</label>
             <div className="flex bg-gray-800 rounded p-1">
               <button 
                 type="button"
                 onClick={() => setType('character')}
                 className={`flex-1 py-1 text-sm rounded transition-colors ${type === 'character' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
               >
                 Characters
               </button>
               <button 
                 type="button"
                 onClick={() => setType('scenario')}
                 className={`flex-1 py-1 text-sm rounded transition-colors ${type === 'scenario' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
               >
                 Scenarios
               </button>
             </div>
           </div>

           <div className="space-y-2">
             <label className="block text-sm text-gray-300">Theme / Concept</label>
             <textarea 
               value={theme}
               onChange={(e) => setTheme(e.target.value)}
               placeholder={type === 'character' ? "Cyberpunk hackers, high fantasy elves..." : "A heist gone wrong, a haunted spaceship..."}
               className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none h-20 text-sm"
             />
           </div>

           <div className="space-y-2">
             <label className="block text-sm text-gray-300">Count: {count}</label>
             <input 
               type="range" min="1" max="10" 
               value={count}
               onChange={(e) => setCount(parseInt(e.target.value))}
               className="w-full accent-blue-500"
             />
           </div>

           {/* Filters Toggle */}
           <div className="pt-2">
               <button 
                type="button" 
                onClick={() => setShowFilters(!showFilters)}
                className="text-xs flex items-center gap-2 text-gray-400 hover:text-white w-full border-b border-gray-800 pb-2 mb-2"
               >
                 <span className="transform transition-transform">{showFilters ? '▼' : '▶'}</span>
                 Advanced Filters {type === 'scenario' && '(Applies to Scenario Characters)'}
               </button>
               
               {showFilters && (
                   <div className="grid grid-cols-2 gap-3 bg-gray-800/30 p-3 rounded border border-gray-800">
                       {/* Gender */}
                       <div className="col-span-1">
                           <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Gender</label>
                           <select 
                             value={gender}
                             onChange={(e) => setGender(e.target.value)}
                             className="w-full bg-gray-900 border border-gray-700 rounded text-xs px-2 py-1.5 text-white"
                           >
                               <option value="Any">Any</option>
                               <option value="Male">Male</option>
                               <option value="Female">Female</option>
                               <option value="Non-Binary">Non-Binary</option>
                               <option value="Androgynous">Androgynous</option>
                           </select>
                       </div>

                       {/* Age Range */}
                       <div className="col-span-1">
                           <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Age Range</label>
                           <div className="flex gap-2">
                               <input 
                                 type="number" 
                                 placeholder="Min"
                                 value={ageMin}
                                 onChange={(e) => setAgeMin(e.target.value ? parseInt(e.target.value) : '')}
                                 className="w-full bg-gray-900 border border-gray-700 rounded text-xs px-2 py-1.5 text-white"
                               />
                               <input 
                                 type="number" 
                                 placeholder="Max"
                                 value={ageMax}
                                 onChange={(e) => setAgeMax(e.target.value ? parseInt(e.target.value) : '')}
                                 className="w-full bg-gray-900 border border-gray-700 rounded text-xs px-2 py-1.5 text-white"
                               />
                           </div>
                       </div>
                       
                        {/* Race */}
                       <div className="col-span-1">
                           <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Race/Species</label>
                           <input 
                             type="text" 
                             placeholder="e.g. Elf, Human"
                             value={race}
                             onChange={(e) => setRace(e.target.value)}
                             className="w-full bg-gray-900 border border-gray-700 rounded text-xs px-2 py-1.5 text-white"
                           />
                       </div>

                       {/* Disposition */}
                       <div className="col-span-1">
                           <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Disposition</label>
                           <input 
                             type="text" 
                             placeholder="e.g. Grumpy, Kind"
                             value={disposition}
                             onChange={(e) => setDisposition(e.target.value)}
                             className="w-full bg-gray-900 border border-gray-700 rounded text-xs px-2 py-1.5 text-white"
                           />
                       </div>

                        {/* Height / Weight / Body */}
                       <div className="col-span-2 grid grid-cols-3 gap-2 border-t border-gray-800 pt-2 mt-1">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Height</label>
                                <input type="text" placeholder="e.g. 6ft, Tall" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded text-xs px-2 py-1.5 text-white" />
                            </div>
                             <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Weight</label>
                                <input type="text" placeholder="e.g. 180lbs" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded text-xs px-2 py-1.5 text-white" />
                            </div>
                             <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Body Type</label>
                                <input type="text" placeholder="e.g. Athletic" value={bodyType} onChange={(e) => setBodyType(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded text-xs px-2 py-1.5 text-white" />
                            </div>
                       </div>
                   </div>
               )}
           </div>

           <div className="pt-2">
             <button 
               type="submit"
               disabled={isGenerating || !theme}
               className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg hover:shadow-xl transition-all"
             >
               {isGenerating ? (
                 <>
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   Generating...
                 </>
               ) : (
                 'Generate'
               )}
             </button>
           </div>
        </form>
      </div>
    </div>
  );
};

export default BatchGenerator;
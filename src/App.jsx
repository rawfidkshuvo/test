import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion,
  increment,
} from "firebase/firestore";
import {
  Hexagon,
  TreeDeciduous,
  Mountain,
  Waves,
  Sun,
  Home,
  MoreHorizontal,
  Play,
  LogOut,
  History,
  CheckCircle,
  AlertTriangle,
  Crown,
  Copy,
  User,
  Trash2,
  BookOpen,
  ArrowUp,
  X,
  Hammer,
  Loader,
  Sparkles,
  Trophy,
  PawPrint,
  Bird,
  Fish,
  Bug,
  Cat,
  Eye,
  Grid,
  Info,
  Rat,
  Rabbit,
  Snail,
  SkipForward
} from "lucide-react";

// ---------------------------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------------------------

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const APP_ID = typeof __app_id !== "undefined" ? __app_id : "equilibrium-game";
const GAME_ID = "equilibrium"; 

// ---------------------------------------------------------------------------
// GAME LOGIC & CONSTANTS
// ---------------------------------------------------------------------------

const TOKEN_TYPES = {
  WOOD: { id: "WOOD", color: "bg-amber-800", border: "border-amber-950", icon: MoreHorizontal, name: "Log", validOn: ["EMPTY", "WOOD"] },
  LEAF: { id: "LEAF", color: "bg-emerald-500", border: "border-emerald-700", icon: TreeDeciduous, name: "Foliage", validOn: ["WOOD"] },
  STONE: { id: "STONE", color: "bg-slate-400", border: "border-slate-600", icon: Mountain, name: "Stone", validOn: ["EMPTY", "STONE"] },
  WATER: { id: "WATER", color: "bg-cyan-500", border: "border-cyan-700", icon: Waves, name: "Water", validOn: ["EMPTY"] },
  SAND: { id: "SAND", color: "bg-yellow-400", border: "border-yellow-600", icon: Sun, name: "Sand", validOn: ["EMPTY"] },
  BRICK: { id: "BRICK", color: "bg-red-600", border: "border-red-800", icon: Home, name: "Brick", validOn: ["EMPTY", "BRICK"] },
};

// HELPER FOR PATTERNS
const getNeighbors = (q, r) => [
    {q: q+1, r: r}, {q: q+1, r: r-1}, {q: q, r: r-1},
    {q: q-1, r: r}, {q: q-1, r: r+1}, {q: q, r: r+1}
];

const checkNeighbors = (board, q, r, predicate) => {
    const neighbors = getNeighbors(q, r);
    return neighbors.some(n => {
        const cell = board[`${n.q},${n.r}`];
        return cell && predicate(cell);
    });
};

const ANIMALS = {
  // HIGH MOUNTAINS
  EAGLE: { 
      id: "EAGLE", name: "Eagle", desc: "Perches on a Mountain of Height 3.", 
      points: 4, slots: 2, icon: Bird, iconColor: "text-amber-300", 
      check: (cell) => cell.stack.length === 3 && cell.stack.every(t => t === "STONE"),
      visual: { type: 'stack', tokens: ['STONE', 'STONE', 'STONE'] }
  },
  // TREES
  DEER: { 
      id: "DEER", name: "Deer", desc: "Hides in a mature Tree (2 Logs + 1 Foliage).", 
      points: 3, slots: 3, icon: PawPrint, iconColor: "text-orange-400", 
      check: (cell) => cell.stack.length === 3 && cell.stack[0] === "WOOD" && cell.stack[1] === "WOOD" && cell.stack[2] === "LEAF",
      visual: { type: 'stack', tokens: ['WOOD', 'WOOD', 'LEAF'] }
  },
  SQUIRREL: {
      id: "SQUIRREL", name: "Squirrel", desc: "Climbs small Trees (1 Log + 1 Foliage).",
      points: 2, slots: 4, icon: Rat, iconColor: "text-orange-300",
      check: (cell) => cell.stack.length === 2 && cell.stack[0] === "WOOD" && cell.stack[1] === "LEAF",
      visual: { type: 'stack', tokens: ['WOOD', 'LEAF'] }
  },
  OWL: { 
      id: "OWL", name: "Owl", desc: "Perches on any Tree of Height 3.", 
      points: 3, slots: 3, icon: Bird, iconColor: "text-purple-300", 
      check: (cell) => cell.stack.length === 3 && cell.stack[2] === "LEAF",
      visual: { type: 'stack', tokens: ['WOOD', 'WOOD', 'LEAF'] }
  },
  // WATER & ADJACENCY
  FROG: { 
      id: "FROG", name: "Frog", desc: "Water adjacent to a Field (Sand).", 
      points: 2, slots: 4, icon: Bug, iconColor: "text-green-400", 
      check: (cell, board) => cell.stack[0] === "WATER" && checkNeighbors(board, cell.q, cell.r, n => n.stack[0] === "SAND"),
      visual: { type: 'adj', main: 'WATER', others: ['SAND'] }
  },
  FISH: { 
      id: "FISH", name: "Salmon", desc: "Water adjacent to another Water.", 
      points: 3, slots: 3, icon: Fish, iconColor: "text-cyan-300", 
      check: (cell, board) => cell.stack[0] === "WATER" && checkNeighbors(board, cell.q, cell.r, n => n.stack[0] === "WATER"),
      visual: { type: 'adj', main: 'WATER', others: ['WATER'] }
  },
  // ROCKS & FIELDS
  LIZARD: { 
      id: "LIZARD", name: "Lizard", desc: "Short Stone (Height 1) adjacent to Sand.", 
      points: 2, slots: 4, icon: Cat, iconColor: "text-emerald-300", 
      check: (cell, board) => cell.stack.length === 1 && cell.stack[0] === "STONE" && checkNeighbors(board, cell.q, cell.r, n => n.stack[0] === "SAND"),
      visual: { type: 'adj', main: 'STONE', others: ['SAND'] }
  },
  RABBIT: {
      id: "RABBIT", name: "Rabbit", desc: "Field (Sand) adjacent to at least 2 other Fields.",
      points: 4, slots: 2, icon: Rabbit, iconColor: "text-yellow-200",
      check: (cell, board) => {
          if (cell.stack[0] !== "SAND") return false;
          let count = 0;
          getNeighbors(cell.q, cell.r).forEach(n => {
              if (board[`${n.q},${n.r}`]?.stack[0] === "SAND") count++;
          });
          return count >= 2;
      },
      visual: { type: 'adj', main: 'SAND', others: ['SAND', 'SAND'] }
  },
  // BUILDINGS
  SPIDER: {
      id: "SPIDER", name: "Spider", desc: "Building (Brick) adjacent to Tree.",
      points: 3, slots: 3, icon: Bug, iconColor: "text-slate-400",
      check: (cell, board) => cell.stack[0] === "BRICK" && checkNeighbors(board, cell.q, cell.r, n => n.stack.includes("LEAF")),
      visual: { type: 'adj', main: 'BRICK', others: ['LEAF'] }
  },
  CAT: {
      id: "CAT", name: "Stray Cat", desc: "Building (Brick) adjacent to Field.",
      points: 3, slots: 3, icon: Cat, iconColor: "text-indigo-300",
      check: (cell, board) => cell.stack[0] === "BRICK" && checkNeighbors(board, cell.q, cell.r, n => n.stack[0] === "SAND"),
      visual: { type: 'adj', main: 'BRICK', others: ['SAND'] }
  }
};

// --- CORE ENGINE ---

const isValidPlacement = (cell, token) => {
    if (!cell) return false;
    if (cell.animal) return false; // Cannot build on animal
    if (cell.stack.length >= 3) return false; // Max height
    
    const topType = cell.stack.length > 0 ? cell.stack[cell.stack.length - 1] : "EMPTY";
    return TOKEN_TYPES[token].validOn.includes(topType);
};

const calculateLandscapeScore = (board) => {
    let score = 0;
    const visited = new Set();
    const cells = Object.values(board);

    // 1. TREES
    cells.forEach(cell => {
        if(cell.stack.includes("LEAF")) {
            const height = cell.stack.length;
            if(height === 2) score += 3;
            if(height === 3) score += 7;
        }
    });

    // 2. MOUNTAINS (Stone)
    cells.forEach(cell => {
        if(cell.stack.includes("STONE")) {
            const height = cell.stack.length;
            const touchesMountain = checkNeighbors(board, cell.q, cell.r, n => n.stack.includes("STONE"));
            if(touchesMountain) score += height;
        }
    });

    // 3. FIELDS (Sand) - Groups
    const getGroupSize = (startCell, type) => {
        let size = 0;
        let queue = [startCell];
        while(queue.length > 0) {
            const current = queue.pop();
            const key = `${current.q},${current.r}`;
            if(visited.has(key)) continue;
            visited.add(key);
            size++;
            getNeighbors(current.q, current.r).forEach(n => {
                const neighbor = board[`${n.q},${n.r}`];
                if(neighbor && neighbor.stack[0] === type && !visited.has(`${n.q},${n.r}`)) {
                    queue.push(neighbor);
                }
            });
        }
        return size;
    };

    visited.clear();
    cells.forEach(cell => {
        if(cell.stack[0] === "SAND" && !visited.has(`${cell.q},${cell.r}`)) {
            const size = getGroupSize(cell, "SAND");
            if(size >= 2) score += 5;
        }
    });

    // 4. RIVERS (Water) - Longest Chain
    visited.clear();
    let maxRiverLength = 0;
    cells.forEach(cell => {
        if(cell.stack[0] === "WATER" && !visited.has(`${cell.q},${cell.r}`)) {
            const size = getGroupSize(cell, "WATER");
            if(size > maxRiverLength) maxRiverLength = size;
        }
    });
    if(maxRiverLength === 2) score += 2;
    else if(maxRiverLength === 3) score += 4;
    else if(maxRiverLength === 4) score += 7;
    else if(maxRiverLength === 5) score += 10;
    else if(maxRiverLength >= 6) score += 15;

    // 5. BUILDINGS (Brick)
    cells.forEach(cell => {
        if(cell.stack[0] === "BRICK") {
            const neighbors = getNeighbors(cell.q, cell.r);
            const distinctColors = new Set();
            neighbors.forEach(n => {
                const neighbor = board[`${n.q},${n.r}`];
                if(neighbor && neighbor.stack.length > 0) {
                    distinctColors.add(neighbor.stack[neighbor.stack.length-1]);
                }
            });
            if(distinctColors.size >= 3) score += 5;
        }
    });

    return score;
};

const GENERATE_HEX_GRID = () => {
  const grid = {};
  const radius = 2; 
  for (let q = -radius; q <= radius; q++) {
    let r1 = Math.max(-radius, -q - radius);
    let r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      grid[`${q},${r}`] = { q, r, stack: [], animal: null };
    }
  }
  return grid;
};

const CREATE_BAG = () => {
  const distribution = { WOOD: 15, LEAF: 15, STONE: 12, WATER: 12, SAND: 9, BRICK: 9 };
  let bag = [];
  Object.entries(distribution).forEach(([type, count]) => {
    for(let i=0; i<count; i++) bag.push(type);
  });
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
};

const CREATE_ANIMAL_DECK = () => {
    const types = Object.keys(ANIMALS);
    let deck = [];
    for(let i=0; i<3; i++) deck = [...deck, ...types];
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

const REFILL_MARKET = (currentMarket, currentBag) => {
  let market = [...currentMarket];
  let bag = [...currentBag];
  while(market.length < 5 && bag.length >= 3) {
    market.push({
      id: Math.random().toString(36).substr(2, 9),
      tokens: [bag.pop(), bag.pop(), bag.pop()].filter(Boolean)
    });
  }
  return { market, bag };
};

const REFILL_ANIMAL_MARKET = (currentMarket, currentDeck) => {
    let market = [...currentMarket];
    let deck = [...currentDeck];
    while(market.length < 4 && deck.length > 0) {
        const type = deck.pop();
        market.push({
            id: Math.random().toString(36).substr(2, 9),
            type: type
        });
    }
    return { market, deck };
};

// ---------------------------------------------------------------------------
// COMPONENTS
// ---------------------------------------------------------------------------

const PatternPreview = ({ visual }) => {
    if (!visual) return null;
    
    // Stack Preview: Uses absolute positioning to simulate a vertical stack (Totem)
    if (visual.type === 'stack') {
        return (
            <div className="relative w-8 h-10 mx-auto mt-2">
                {visual.tokens.map((t, i) => (
                    <div 
                        key={i} 
                        className={`absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border shadow-sm ${TOKEN_TYPES[t].color} ${TOKEN_TYPES[t].border}`} 
                        style={{ bottom: `${i * 10}px`, zIndex: i }}
                    />
                ))}
            </div>
        );
    }
    // Adjacency Preview
    if (visual.type === 'adj') {
        return (
            <div className="flex items-center justify-center gap-1 py-2 scale-90 origin-center">
                <div className={`w-8 h-8 rounded-full border-2 border-white shadow-sm ${TOKEN_TYPES[visual.main].color} ${TOKEN_TYPES[visual.main].border} z-10 flex items-center justify-center`}>
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="flex flex-col gap-1">
                    {visual.others.map((t, i) => (
                        <div key={i} className={`w-4 h-4 rounded-full border opacity-80 ${TOKEN_TYPES[t].color} ${TOKEN_TYPES[t].border}`} />
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const FloatingBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black" />
    <div className="absolute top-0 left-0 w-full h-full opacity-5">
      {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float text-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${15 + Math.random() * 20}s`,
              transform: `scale(${0.5 + Math.random()})`,
            }}
          >
            <Hexagon size={48} />
          </div>
      ))}
    </div>
    <style>{`@keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(10deg); } } .animate-float { animation: float infinite ease-in-out; }`}</style>
  </div>
);

const GameLogo = () => (
  <div className="flex items-center justify-center gap-2 opacity-40 mt-auto pb-4 pt-2 relative z-10 pointer-events-none select-none">
    <Hexagon size={14} className="text-cyan-500" />
    <span className="text-[10px] font-black tracking-[0.2em] text-cyan-500 uppercase">EQUILIBRIUM</span>
  </div>
);

const HexTile = ({ q, r, stack, animal, onClick, ghostToken, isPlaceable, ghostAnimal, isValidTarget }) => {
  const size = 40; 
  const x = size * (Math.sqrt(3) * q + Math.sqrt(3)/2 * r);
  const y = size * (3/2 * r);
  
  return (
    <div
      onClick={() => onClick && onClick(q, r)}
      className="absolute flex items-center justify-center transition-all duration-300"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        width: `${size * 1.8}px`,
        height: `${size * 2}px`,
        transform: 'translate(-50%, -50%)',
        zIndex: 10 + r,
        cursor: isPlaceable || ghostAnimal ? 'pointer' : 'default'
      }}
    >
      <div 
        className={`w-full h-full absolute transition-all duration-300 ${
          isPlaceable || ghostAnimal || isValidTarget ? "bg-slate-700 hover:bg-slate-600 hover:scale-105 shadow-[0_0_10px_rgba(34,211,238,0.2)]" : "bg-slate-800"
        }`}
        style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)", zIndex: 0 }}
      />

      {/* SVG Dotted Border Overlay - Moved After bg to be visible */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 pointer-events-none z-10 overflow-visible" style={{width: '100%', height: '100%'}}>
         <polygon 
            points="50 0, 100 25, 100 75, 50 100, 0 75, 0 25" 
            fill="none" 
            stroke={isValidTarget ? "#34d399" : "rgba(255,255,255,0.4)"}
            strokeWidth={isValidTarget ? "3" : "1.5"}
            strokeDasharray="4 2" 
            className={isValidTarget ? "animate-pulse" : ""}
         />
      </svg>
      
      <div className="relative z-20 flex items-center justify-center w-full h-full pb-2 pointer-events-none">
        {stack.map((t, i) => {
          const def = TOKEN_TYPES[t];
          return (
            <div key={i} className={`absolute w-8 h-8 rounded-full border shadow-md flex items-center justify-center ${def.color} ${def.border}`} style={{ transform: `translateY(-${i * 6}px) scale(${1 - i*0.05})`, zIndex: i }}>
              {i === stack.length - 1 && <def.icon size={14} className="text-white/80" />}
            </div>
          )
        })}
        {isPlaceable && ghostToken && (
           <div className={`absolute w-8 h-8 rounded-full border-2 border-dashed opacity-60 flex items-center justify-center animate-pulse ${TOKEN_TYPES[ghostToken].color} border-white`} style={{ transform: `translateY(-${stack.length * 6}px)`, zIndex: 10 }}>
             <ArrowUp size={14} className="text-white" />
           </div>
        )}
        {isValidTarget && !animal && (
            <div className="absolute -top-6 w-8 h-8 rounded-full border-2 border-dashed border-emerald-400 shadow-xl flex items-center justify-center z-50 animate-pulse bg-emerald-500/20">
               <CheckCircle size={16} className="text-emerald-400" />
            </div>
        )}
        {ghostAnimal && !animal && (
            <div className="absolute -top-6 w-8 h-8 rounded-full border-2 border-dashed border-white shadow-xl flex items-center justify-center z-50 animate-pulse opacity-70">
                {(() => {
                    const Def = ANIMALS[ghostAnimal];
                    const Icon = Def.icon;
                    return <Icon size={16} className={Def.iconColor} fill="currentColor" fillOpacity={0.2} />;
                })()}
            </div>
        )}
        {animal && (
            <div 
                className="absolute w-6 h-6 rounded-full bg-white border-2 border-cyan-300 shadow-xl flex items-center justify-center z-50 animate-in zoom-in duration-300"
                style={{ transform: `translateY(-${stack.length * 6 + 4}px)` }}
            >
                {(() => {
                    const Def = ANIMALS[animal];
                    const Icon = Def.icon;
                    return <Icon size={14} className={Def.iconColor} fill="currentColor" fillOpacity={0.2} />;
                })()}
            </div>
        )}
      </div>
    </div>
  );
};

const FeedbackOverlay = ({ type, message, subtext, icon: Icon }) => (
  <div className="fixed inset-0 z-[160] flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-300">
    <div className={`flex flex-col items-center justify-center p-8 md:p-12 rounded-3xl border-4 shadow-2xl backdrop-blur-xl max-w-sm md:max-w-xl mx-4 text-center ${type === "success" ? "bg-emerald-900/90 border-emerald-500 text-emerald-100" : type === "failure" ? "bg-red-900/90 border-red-500 text-red-100" : type === "warning" ? "bg-amber-900/90 border-amber-500 text-amber-100" : "bg-blue-900/90 border-blue-500 text-blue-100"}`}>
      {Icon && <div className="mb-4 p-4 bg-black/20 rounded-full"><Icon size={64} className="animate-bounce" /></div>}
      <h2 className="text-3xl md:text-5xl font-black uppercase tracking-widest drop-shadow-md mb-2">{message}</h2>
      {subtext && <p className="text-lg md:text-xl font-bold opacity-90 tracking-wide">{subtext}</p>}
    </div>
  </div>
);

const RulesModal = ({ onClose }) => (
    <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full"><X size={24} /></button>
        <h2 className="text-3xl font-black text-center mb-6 text-cyan-400">Architect's Handbook</h2>
        <div className="space-y-6">
            <section>
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Hexagon className="text-emerald-500"/> Landscape Scoring</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <strong className="text-emerald-400 block mb-1">Trees (Wood + Foliage)</strong>
                        <ul className="list-disc pl-4 text-xs">
                            <li>2 High (Wood+Leaf): 3 Pts</li>
                            <li>3 High (Wood+Wood+Leaf): 7 Pts</li>
                            <li className="text-slate-500 mt-1">Foliage MUST be on Wood.</li>
                        </ul>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <strong className="text-slate-400 block mb-1">Mountains (Stone)</strong>
                        <ul className="list-disc pl-4 text-xs">
                            <li>Score Height (1-3) per stack.</li>
                            <li>Only scores if adjacent to another Mountain.</li>
                        </ul>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <strong className="text-yellow-400 block mb-1">Fields (Sand)</strong>
                        <ul className="list-disc pl-4 text-xs">
                            <li>5 Pts for every group of 2+ connected Sand.</li>
                            <li>Cannot stack.</li>
                        </ul>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <strong className="text-cyan-400 block mb-1">Rivers (Water)</strong>
                        <ul className="list-disc pl-4 text-xs">
                            <li>Longest Chain scoring:</li>
                            <li>2=2pts, 3=4pts, 4=7pts, 5=10pts, 6+=15pts.</li>
                        </ul>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-xl md:col-span-2 border border-slate-700">
                        <strong className="text-red-400 block mb-1">Buildings (Brick)</strong>
                        <ul className="list-disc pl-4 text-xs">
                            <li>5 Pts if surrounded by 3+ different colors.</li>
                        </ul>
                    </div>
                </div>
            </section>
            <section>
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><PawPrint className="text-orange-500"/> Animal Scoring</h3>
                <p className="text-slate-400 text-sm mb-4">Complete patterns to place animals. Animals score points AND allow you to score again on the same card.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.values(ANIMALS).map(a => (
                        <div key={a.id} className="bg-slate-800 p-2 rounded border border-slate-700 flex flex-col items-center gap-2 text-xs">
                            <div className="scale-75"><PatternPreview visual={a.visual} /></div>
                            <div className="text-center">
                                <div className="font-bold text-white">{a.name}</div>
                                <div className="text-[10px] text-slate-400 leading-none mb-1">{a.desc}</div>
                                <div className="text-[9px] text-yellow-500 font-bold">+{a.points}pts</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
      </div>
    </div>
);

const AnimalDetailModal = ({ animal, onClose }) => (
    <div className="fixed inset-0 z-[210] bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
        <div className="bg-slate-900 border-2 border-slate-700 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 p-4 rounded-full border-4 border-slate-900">
                <animal.icon size={48} className={animal.iconColor} />
            </div>
            <h3 className="text-2xl font-black text-white mt-8 mb-2 uppercase">{animal.name}</h3>
            <div className="text-yellow-500 font-bold text-lg mb-4">+{animal.points} Pts per placement</div>
            
            <div className="flex justify-center mb-6 bg-black/20 p-4 rounded-xl">
                <PatternPreview visual={animal.visual} />
            </div>

            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 mb-4">
                <p className="text-slate-300 text-sm">{animal.desc}</p>
            </div>
            <div className="flex justify-center gap-1 mb-4">
                {Array.from({length: animal.slots}).map((_, i) => (
                    <div key={i} className="w-4 h-4 rounded-full bg-slate-700 border border-slate-600"></div>
                ))}
            </div>
            <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 w-full py-3 rounded-xl font-bold">Close</button>
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

export default function Equilibrium() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("menu");
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [roomId, setRoomId] = useState("");
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // UI States
  const [showLogs, setShowLogs] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [viewingPlayerId, setViewingPlayerId] = useState(null);
  const [activePalette, setActivePalette] = useState(null); 
  const [inspectedAnimal, setInspectedAnimal] = useState(null);

  // Gameplay State
  const [selectedHoldingIdx, setSelectedHoldingIdx] = useState(null);
  const [selectedAnimalIdx, setSelectedAnimalIdx] = useState(null);
  const lastLogIdRef = useRef(null);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const savedName = localStorage.getItem("equilibrium_playerName");
        if (savedName) setPlayerName(savedName);
        setViewingPlayerId(u.uid);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "game_hub_settings", "config"), (doc) => {
      if (doc.exists() && doc.data()[GAME_ID]?.maintenance) setIsMaintenance(true);
      else setIsMaintenance(false);
    }, (err) => console.log("Config Read Error (Safe to ignore):", err));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!roomId || !user) return;
    const roomRef = doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId);
    const unsub = onSnapshot(roomRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setGameState(data);
        if (data.status === "playing" || data.status === "finished") setView("game");
        else if (data.status === "lobby") setView("lobby");
      } else {
        setView("menu");
        setRoomId("");
        setError("Voyage ended.");
      }
    }, (err) => { console.error(err); setError("Connection lost."); });
    return () => unsub();
  }, [roomId, user]);

  useEffect(() => {
    if (!gameState?.logs || gameState.logs.length === 0) return;
    const latestLog = gameState.logs[gameState.logs.length - 1];
    if (lastLogIdRef.current === null) { lastLogIdRef.current = latestLog.id; return; }
    if (latestLog.id <= lastLogIdRef.current) return;
    lastLogIdRef.current = latestLog.id;
    if (latestLog.type === "success") { setFeedback({ type: "success", message: "HARMONY!", subtext: latestLog.text, icon: Sparkles }); setTimeout(() => setFeedback(null), 2500); } 
    else if (latestLog.type === "warning") { setFeedback({ type: "warning", message: "ATTENTION", subtext: latestLog.text, icon: AlertTriangle }); setTimeout(() => setFeedback(null), 2500); }
  }, [gameState?.logs]);

  const createRoom = async () => {
    if (!playerName) return setError("Enter Name");
    localStorage.setItem("equilibrium_playerName", playerName);
    setLoading(true);
    const newId = Math.random().toString(36).substr(2, 6).toUpperCase();
    const initialBag = CREATE_BAG();
    const initialAnimalDeck = CREATE_ANIMAL_DECK();
    const { market, bag } = REFILL_MARKET([], initialBag);
    const animalFill = REFILL_ANIMAL_MARKET([], initialAnimalDeck);
    const initialData = {
      roomId: newId, hostId: user.uid, status: "lobby",
      players: [{ id: user.uid, name: playerName, score: 0, landscapeScore: 0, board: GENERATE_HEX_GRID(), holding: [], animals: [], ready: true }],
      market, bag, animalMarket: animalFill.market, animalDeck: animalFill.deck,
      turnIndex: 0, turnPhase: "DRAFT", logs: [], winnerId: null
    };
    try {
      await setDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", newId), initialData);
      setRoomId(newId);
      setViewingPlayerId(user.uid);
    } catch (e) { console.error(e); setError("Failed to create world."); }
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!roomCode || !playerName) return setError("Enter details");
    localStorage.setItem("equilibrium_playerName", playerName);
    setLoading(true);
    try {
        const code = roomCode.toUpperCase().trim();
        const ref = doc(db, "artifacts", APP_ID, "public", "data", "rooms", code);
        const snap = await getDoc(ref);
        if(snap.exists() && snap.data().status === "lobby") {
            const data = snap.data();
            if(!data.players.some(p => p.id === user.uid)) {
                const newPlayers = [...data.players, { id: user.uid, name: playerName, score: 0, landscapeScore: 0, board: GENERATE_HEX_GRID(), holding: [], animals: [], ready: false }];
                await updateDoc(ref, { players: newPlayers });
            }
            setRoomId(code);
            setViewingPlayerId(user.uid);
        } else { setError("Room not found or in progress"); }
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const startGame = async () => {
      await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), { 
          status: "playing",
          logs: arrayUnion({ text: "The ecosystem awakens.", type: "neutral", id: Date.now() })
      });
  };

  const toggleReady = async () => {
      if(!gameState) return;
      const players = [...gameState.players];
      const me = players.find(p => p.id === user.uid);
      if(me) { me.ready = !me.ready; await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), { players }); }
  };

  const handleLeave = async () => {
    if (!roomId) return;
    try {
      const ref = doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId);
      if (gameState.hostId === user.uid) await deleteDoc(ref);
      else { const newPlayers = gameState.players.filter((p) => p.id !== user.uid); await updateDoc(ref, { players: newPlayers }); }
    } catch (e) { console.log("Room gone"); }
    setRoomId(""); setView("menu"); setShowLeaveConfirm(false); setGameState(null);
  };

  const returnToLobby = async () => {
     if(gameState.hostId !== user.uid) return;
     const initialBag = CREATE_BAG();
     const initialAnimalDeck = CREATE_ANIMAL_DECK();
     const { market, bag } = REFILL_MARKET([], initialBag);
     const animalFill = REFILL_ANIMAL_MARKET([], initialAnimalDeck);
     const players = gameState.players.map(p => ({ ...p, score: 0, landscapeScore: 0, board: GENERATE_HEX_GRID(), holding: [], animals: [], ready: false }));
     await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), {
         status: "lobby", players, market, bag, animalMarket: animalFill.market, animalDeck: animalFill.deck, logs: [], winnerId: null, turnIndex: 0, turnPhase: "DRAFT"
     });
  };

  const handleDraftToken = async (marketIdx) => {
      if(gameState.turnPhase !== "DRAFT") return;
      const pIdx = gameState.players.findIndex(p => p.id === user.uid);
      if(gameState.turnIndex !== pIdx) return;
      const players = [...gameState.players];
      let market = [...gameState.market];
      let bag = [...gameState.bag];
      
      players[pIdx].holding = market[marketIdx].tokens;
      market.splice(marketIdx, 1); 

      // IMMEDIATE REFILL
      if (bag.length >= 3) {
          const newSlot = { id: Math.random().toString(36).substr(2, 9), tokens: [bag.pop(), bag.pop(), bag.pop()].filter(Boolean) };
          market.push(newSlot);
      }

      await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), {
          players, market, bag, turnPhase: "PLACE",
          logs: arrayUnion({ text: `${players[pIdx].name} drafted tokens.`, type: "neutral", id: Date.now() })
      });
      setActivePalette(null);
  };

  const handleDraftAnimal = async (animalIdx) => {
      if(gameState.turnPhase !== "DRAFT") return;
      const pIdx = gameState.players.findIndex(p => p.id === user.uid);
      if(gameState.turnIndex !== pIdx) return;
      const players = [...gameState.players];
      const me = players[pIdx];
      let animalMarket = [...gameState.animalMarket];
      let animalDeck = [...gameState.animalDeck];

      const incompleteAnimals = me.animals.filter(a => a.slotsFilled < a.maxSlots);
      if(incompleteAnimals.length >= 4) return;

      const card = animalMarket[animalIdx];
      const def = ANIMALS[card.type];
      
      me.animals.push({ ...card, slotsFilled: 0, maxSlots: def.slots });
      animalMarket.splice(animalIdx, 1);

      // IMMEDIATE REFILL
      if(animalDeck.length > 0) {
          const newCard = { id: Math.random().toString(36).substr(2, 9), type: animalDeck.pop() };
          animalMarket.push(newCard);
      }

      await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), {
          players, animalMarket, animalDeck,
          logs: arrayUnion({ text: `${me.name} adopted a ${def.name}.`, type: "neutral", id: Date.now() })
      });
      setActivePalette(null);
  };

  const handlePlace = async (q, r) => {
      if(gameState.turnPhase !== "PLACE") return;
      const pIdx = gameState.players.findIndex(p => p.id === user.uid);
      if(gameState.turnIndex !== pIdx) return;
      const players = [...gameState.players];
      const me = players[pIdx];
      
      // Token Placement
      if(selectedHoldingIdx !== null && me.holding[selectedHoldingIdx]) {
          const cellKey = `${q},${r}`;
          const cell = me.board[cellKey];
          const token = me.holding[selectedHoldingIdx];
          
          if (!isValidPlacement(cell, token)) return;

          cell.stack.push(token);
          me.holding.splice(selectedHoldingIdx, 1); 
          setSelectedHoldingIdx(null); 
          me.landscapeScore = calculateLandscapeScore(me.board);
          await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), { players });
          return;
      }

      // Animal Placement
      if(selectedAnimalIdx !== null && me.animals[selectedAnimalIdx]) {
          const card = me.animals[selectedAnimalIdx];
          const def = ANIMALS[card.type];
          const cell = me.board[`${q},${r}`];

          if (!cell.animal && card.slotsFilled < card.maxSlots && def.check(cell, me.board)) {
              cell.animal = card.type;
              card.slotsFilled += 1;
              me.score += def.points;
              setSelectedAnimalIdx(null);
              await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), { 
                  players,
                  logs: arrayUnion({ text: `${me.name} placed a ${def.name}!`, type: "success", id: Date.now() })
              });
          }
      }
  };

  const handleDiscard = async () => {
    if(gameState.turnPhase !== "PLACE") return;
    const pIdx = gameState.players.findIndex(p => p.id === user.uid);
    if(gameState.turnIndex !== pIdx) return;
    const players = [...gameState.players];
    const me = players[pIdx];
    if(selectedHoldingIdx === null || !me.holding[selectedHoldingIdx]) return;

    me.holding.splice(selectedHoldingIdx, 1); 
    setSelectedHoldingIdx(null); 
    await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), { 
        players,
        logs: arrayUnion({ text: `${me.name} discarded a token.`, type: "neutral", id: Date.now() })
    });
  };

  const handleEndTurn = async () => {
      if(gameState.turnPhase !== "PLACE") return;
      const pIdx = gameState.players.findIndex(p => p.id === user.uid);
      if(gameState.turnIndex !== pIdx) return;
      const players = [...gameState.players];
      const me = players[pIdx];

      if(me.holding.length > 0) return; // Must play/discard all tokens

      const updates = { 
          turnPhase: "DRAFT",
          turnIndex: (gameState.turnIndex + 1) % gameState.players.length,
          logs: arrayUnion({ text: `Turn passed to ${gameState.players[(gameState.turnIndex + 1) % gameState.players.length].name}.`, type: "neutral", id: Date.now() })
      };

      if(gameState.bag.length === 0 && gameState.market.length === 0) {
          updates.status = "finished";
          updates.logs = arrayUnion({ text: "Market exhausted! Game Over.", type: "warning", id: Date.now() });
      }

      await updateDoc(doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId), updates);
  };

  const copyToClipboard = () => { navigator.clipboard.writeText(roomId); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); };

  // --- RENDERERS ---

  if (isMaintenance) return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <GameLogo />
        <div className="bg-orange-500/10 p-8 rounded-2xl border border-orange-500/30 mt-8">
          <Hammer size={64} className="text-orange-500 mx-auto mb-4 animate-bounce" />
          <h1 className="text-3xl font-bold mb-2">Under Construction</h1>
          <p className="text-gray-400">Balancing the elements...</p>
        </div>
      </div>
  );

  if (!user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-500 animate-pulse">Initializing...</div>;

  if (view === "menu") return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
        <FloatingBackground />
        {showGuide && <RulesModal onClose={() => setShowGuide(false)} />}
        <div className="z-10 text-center mb-10 animate-in fade-in zoom-in duration-700">
          <Hexagon size={64} className="text-cyan-400 mx-auto mb-4 animate-spin-slow" />
          <h1 className="text-5xl md:text-7xl font-thin text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-blue-600 tracking-tighter drop-shadow-md">EQUILIBRIUM</h1>
          <p className="text-white/40 tracking-[0.5em] uppercase mt-2 text-xs">Build. Balance. Score.</p>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 p-8 rounded-2xl w-full max-w-md shadow-2xl z-10 relative">
          {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 mb-4 rounded text-center text-sm font-bold flex items-center justify-center gap-2"><AlertTriangle size={16} /> {error}</div>}
          <div className="space-y-4">
             <input className="w-full bg-black/50 border border-slate-700 focus:border-cyan-500 p-4 rounded-xl text-white outline-none transition-all text-lg font-bold text-center" placeholder="YOUR NAME" value={playerName} onChange={(e) => setPlayerName(e.target.value)} maxLength={12} />
             <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={createRoom} disabled={loading} className="bg-gradient-to-br from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg shadow-cyan-900/50"><Sparkles size={24} /><span>Create</span></button>
                <div className="flex flex-col gap-2">
                    <input className="bg-black/50 border border-slate-700 focus:border-cyan-500 p-2 rounded-xl text-white text-center uppercase font-mono font-bold tracking-widest outline-none h-12" placeholder="CODE" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} maxLength={6} />
                    <button onClick={joinRoom} disabled={loading} className="bg-slate-800 hover:bg-slate-700 p-2 rounded-xl font-bold text-slate-300 transition-all active:scale-95 h-full">Join</button>
                </div>
             </div>
             <button onClick={() => setShowGuide(true)} className="w-full mt-4 text-slate-400 hover:text-cyan-400 text-sm font-bold flex items-center justify-center gap-2 transition-colors py-2"><BookOpen size={16} /> Architect's Guide</button>
          </div>
        </div>
        <div className="absolute bottom-4 text-slate-600 text-xs text-center z-10">Inspired by Harmonies. A tribute game.<br />Developed by <strong className="text-slate-500">RAWFID K SHUVO</strong>. Visit <a href="https://rawfidkshuvo.github.io/gamehub/" target="_blank" rel="noopener noreferrer" className="text-cyan-500 underline hover:text-cyan-600">GAMEHUB</a></div>
        <GameLogo />
      </div>
  );

  if (view === "lobby" && gameState) {
      const isHost = gameState.hostId === user.uid;
      return (
          <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative">
              <FloatingBackground />
              {showGuide && <RulesModal onClose={() => setShowGuide(false)} />}
              <div className="z-10 w-full max-w-lg bg-slate-900/90 backdrop-blur p-8 rounded-2xl border border-cyan-500/30 shadow-2xl animate-in slide-in-from-bottom-8">
                  <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
                      <div>
                          <h2 className="text-sm text-cyan-500 font-bold uppercase tracking-wider">World Code</h2>
                          <div className="flex items-center gap-3 mt-1">
                              <div className="text-4xl font-mono text-white font-black">{roomId}</div>
                              <button onClick={copyToClipboard} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400">{isCopied ? <CheckCircle size={20} className="text-green-500"/> : <Copy size={20}/>}</button>
                          </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setShowGuide(true)} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400"><BookOpen size={20}/></button>
                        <button onClick={() => setShowLeaveConfirm(true)} className="p-2 hover:bg-red-900/30 rounded text-red-400"><LogOut size={20}/></button>
                      </div>
                  </div>
                  <div className="space-y-3 mb-8">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Architects ({gameState.players.length}/4)</h3>
                      {gameState.players.map(p => (
                          <div key={p.id} className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
                              <span className="font-bold flex items-center gap-3 text-lg">{p.name}{p.id === gameState.hostId && <Crown size={16} className="text-yellow-500" />}</span>
                              {p.ready ? <span className="text-emerald-400 text-xs font-bold uppercase bg-emerald-900/20 px-2 py-1 rounded">Ready</span> : <span className="text-slate-500 text-xs font-bold uppercase">Waiting</span>}
                          </div>
                      ))}
                      {Array.from({ length: 4 - gameState.players.length }).map((_, i) => (
                          <div key={i} className="border-2 border-dashed border-slate-800 rounded-xl p-4 flex items-center justify-center text-slate-700 font-bold uppercase text-sm">Empty Slot</div>
                      ))}
                  </div>
                  {isHost ? (
                      <button onClick={startGame} className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl font-bold text-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"><Play size={24} fill="currentColor" /> Start Game</button>
                  ) : (
                      <button onClick={toggleReady} className={`w-full py-4 rounded-xl font-bold text-xl transition-all active:scale-95 ${gameState.players.find(p => p.id === user.uid)?.ready ? "bg-slate-700 text-emerald-400" : "bg-emerald-600 text-white"}`}>{gameState.players.find(p => p.id === user.uid)?.ready ? "READY" : "MARK READY"}</button>
                  )}
              </div>
              {showLeaveConfirm && (
                <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl max-w-xs w-full text-center">
                    <h3 className="text-xl font-bold text-white mb-2 uppercase">Leave World?</h3>
                    <p className="text-slate-400 mb-6 text-sm">You will disconnect from this session.</p>
                    <div className="flex gap-2">
                      <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 bg-slate-800 py-2 rounded font-bold text-slate-300">Stay</button>
                      <button onClick={handleLeave} className="flex-1 bg-red-600 py-2 rounded font-bold text-white">Leave</button>
                    </div>
                  </div>
                </div>
              )}
              <GameLogo />
          </div>
      );
  }

  if (view === "game" && gameState) {
      const pIdx = gameState.players.findIndex(p => p.id === user.uid);
      const me = gameState.players[pIdx];
      const isMyTurn = gameState.turnIndex === pIdx;
      const viewingPlayer = gameState.players.find(p => p.id === viewingPlayerId) || me;
      
      return (
        <div className="fixed inset-0 bg-slate-950 text-white flex flex-col overflow-hidden font-sans select-none">
            {feedback && <FeedbackOverlay type={feedback.type} message={feedback.message} subtext={feedback.subtext} icon={feedback.icon} />}
            {showGuide && <RulesModal onClose={() => setShowGuide(false)} />}
            {inspectedAnimal && <AnimalDetailModal animal={inspectedAnimal} onClose={() => setInspectedAnimal(null)} />}
            
            <div className="h-14 md:h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-2 z-50 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-cyan-950 rounded-lg flex items-center justify-center border border-cyan-800">
                        <Hexagon className="text-cyan-500" size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-sm tracking-wider">EQUILIBRIUM</div>
                        <div className="text-[10px] text-slate-400 font-mono uppercase">
                             {gameState.status === "finished" ? "GAME OVER" : `Turn: ${gameState.players[gameState.turnIndex].name}`}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                     <button onClick={() => setShowGuide(true)} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400"><BookOpen size={18}/></button>
                     <button onClick={() => setShowLogs(!showLogs)} className={`p-2 rounded transition-colors ${showLogs ? "bg-cyan-900 text-cyan-400" : "hover:bg-slate-800 text-slate-400"}`}><History size={18}/></button>
                     <button onClick={() => setShowLeaveConfirm(true)} className="p-2 hover:bg-red-900/30 rounded text-red-400"><LogOut size={18}/></button>
                </div>
            </div>
            
            {showLogs && (
                <div className="fixed top-16 right-4 w-64 max-h-60 bg-gray-900/95 border border-gray-700 rounded-xl z-[155] overflow-y-auto p-2 shadow-2xl">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 sticky top-0 bg-slate-900/95 py-2">World History</h4>
                    <div className="space-y-2">
                    {gameState.logs.slice().reverse().map((log) => (
                        <div key={log.id} className={`text-xs p-2 rounded border-l-2 ${log.type === "success" ? "border-emerald-500 bg-emerald-900/10" : log.type === "warning" ? "border-amber-500 bg-amber-900/10" : "border-slate-500 bg-slate-800/30"}`}>{log.text}</div>
                    ))}
                    </div>
                </div>
            )}
            
            {showLeaveConfirm && (
                <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl max-w-xs w-full text-center">
                    <h3 className="text-xl font-bold text-white mb-2 uppercase">Leave World?</h3>
                    <p className="text-slate-400 mb-6 text-sm">{gameState.hostId === user.uid ? "As Host, leaving ends the game for everyone." : "You will leave this session."}</p>
                    <div className="flex gap-2">
                        <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 bg-slate-800 py-2 rounded font-bold text-slate-300">Stay</button>
                        <button onClick={handleLeave} className="flex-1 bg-red-600 py-2 rounded font-bold text-white">Leave</button>
                    </div>
                    </div>
                </div>
            )}

            <div className="flex-1 relative bg-slate-950 overflow-hidden flex flex-col items-center justify-center">
                
                {/* OPPONENT TABS (Top Strip - Fixed Grid) */}
                <div className="absolute top-2 md:top-4 left-0 right-0 z-10 grid grid-cols-4 gap-1 px-2 w-full max-w-2xl mx-auto pointer-events-auto">
                    {gameState.players.map(p => (
                        <button 
                            key={p.id}
                            onClick={() => setViewingPlayerId(p.id)}
                            className={`
                                flex flex-col items-center justify-center h-12 md:h-14 rounded-xl border-2 transition-all w-full
                                ${viewingPlayerId === p.id 
                                    ? "bg-slate-800 border-cyan-500 shadow-lg scale-105 z-10" 
                                    : "bg-slate-900/80 border-slate-700 hover:bg-slate-800/80 text-slate-400"}
                            `}
                        >
                            <span className={`text-[9px] md:text-[10px] font-bold uppercase truncate max-w-full px-1 ${p.id === gameState.players[gameState.turnIndex].id ? 'text-green-400' : ''}`}>{p.name}</span>
                            <span className="text-[10px] md:text-xs font-black text-yellow-500">{p.score + p.landscapeScore}</span>
                        </button>
                    ))}
                </div>

                {viewingPlayer.id !== user.uid && <div className="absolute top-20 bg-slate-800/80 px-4 py-1 rounded-full text-xs font-bold text-slate-300 flex items-center gap-2 z-10 backdrop-blur"><Eye size={12}/> Viewing {viewingPlayer.name}'s World</div>}
                
                {/* Board Container - Dynamic Scaling for Mobile */}
                <div className="relative w-[340px] h-[300px] transition-transform -mt-20 md:-mt-12 transform scale-100 md:scale-125">
                     {Object.values(viewingPlayer.board).map(cell => {
                         const isAnimalTarget = selectedAnimalIdx !== null && 
                                                me.animals[selectedAnimalIdx] && 
                                                !cell.animal && 
                                                me.animals[selectedAnimalIdx].slotsFilled < me.animals[selectedAnimalIdx].maxSlots &&
                                                ANIMALS[me.animals[selectedAnimalIdx].type].check(cell, viewingPlayer.board);

                         return (
                             <HexTile 
                                key={`${cell.q},${cell.r}`} 
                                {...cell} 
                                isPlaceable={
                                    isMyTurn && 
                                    viewingPlayer.id === user.uid && 
                                    gameState.turnPhase === "PLACE" && 
                                    (
                                        (selectedHoldingIdx !== null && me.holding[selectedHoldingIdx] && isValidPlacement(cell, me.holding[selectedHoldingIdx])) ||
                                        (selectedAnimalIdx !== null && me.animals[selectedAnimalIdx])
                                    )
                                }
                                ghostToken={selectedHoldingIdx !== null ? me.holding[selectedHoldingIdx] : null}
                                ghostAnimal={selectedAnimalIdx !== null ? me.animals[selectedAnimalIdx].type : null}
                                isValidTarget={isAnimalTarget}
                                onClick={viewingPlayer.id === user.uid ? handlePlace : undefined}
                             />
                         )
                     })}
                </div>
                
                {activePalette && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setActivePalette(null)}>
                        <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">{activePalette === 'TOKENS' ? <Sparkles className="text-cyan-400"/> : <PawPrint className="text-orange-400"/>}Select {activePalette === 'TOKENS' ? "Tokens" : "Animal"}</h3>
                                <button onClick={() => setActivePalette(null)} className="p-2 bg-slate-800 rounded-full text-slate-400"><X size={20}/></button>
                            </div>
                            {activePalette === 'TOKENS' ? (
                                <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                                    {gameState.market.map((slot, idx) => (
                                        <button key={slot.id} onClick={() => handleDraftToken(idx)} disabled={!isMyTurn || gameState.turnPhase !== "DRAFT"} className="bg-slate-800 border-2 border-slate-700 hover:border-cyan-500 p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 transition-all active:scale-95">
                                            {slot.tokens.map((t, i) => { const T = TOKEN_TYPES[t]; return ( <div key={i} className={`w-8 h-8 rounded-full border shadow-sm flex items-center justify-center ${T.color} ${T.border}`}><T.icon size={14} className="text-white/70"/></div> )})}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto">
                                    {gameState.animalMarket.map((card, idx) => {
                                        const def = ANIMALS[card.type];
                                        const canDraft = isMyTurn && gameState.turnPhase === "DRAFT" && me.animals.filter(a => a.slotsFilled < a.maxSlots).length < 4;
                                        return (
                                            <button key={card.id} onClick={() => handleDraftAnimal(idx)} disabled={!canDraft} className={`bg-slate-800 border-2 border-slate-700 p-4 rounded-xl flex items-center gap-4 text-left transition-all ${canDraft ? "hover:border-orange-500 hover:bg-slate-700 active:scale-95" : "opacity-50 cursor-not-allowed"}`}>
                                                <div className="bg-black/30 p-3 rounded-full shrink-0"><def.icon className={def.iconColor} size={24}/></div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center">
                                                        <div className="font-bold text-white text-lg">{def.name}</div>
                                                        <span className="text-yellow-500 text-sm font-bold">+{def.points}</span>
                                                    </div>
                                                    <div className="text-slate-400 text-xs">{def.desc}</div>
                                                    <div className="mt-2 flex justify-center scale-90 origin-left">
                                                        <PatternPreview visual={def.visual} />
                                                    </div>
                                                </div>
                                                <div className="ml-auto bg-slate-700 p-2 rounded-full"><Info size={16} className="text-slate-400" onClick={(e) => { e.stopPropagation(); setInspectedAnimal(def); }}/></div>
                                            </button>
                                        )
                                    })}
                                    {gameState.animalMarket.length === 0 && <div className="text-slate-500 text-center py-8">No animals wandering by...</div>}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {gameState.status === "finished" && (
                    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                        <div className="bg-slate-900 p-8 rounded-2xl border-2 border-yellow-500 text-center shadow-2xl animate-in zoom-in max-w-md w-full m-4">
                            <Trophy size={64} className="text-yellow-400 mx-auto mb-4 animate-bounce"/>
                            <h2 className="text-3xl font-black text-white uppercase mb-4">Game Complete</h2>
                            
                            <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto custom-scrollbar">
                                {gameState.players.sort((a,b)=>(b.score+b.landscapeScore)-(a.score+a.landscapeScore)).map((p, i) => (
                                    <div key={p.id} className="bg-slate-800 p-3 rounded-xl flex justify-between items-center border border-slate-700">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-slate-500">#{i+1}</span>
                                            <span className="font-bold text-white">{p.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xl font-black text-yellow-500">{p.score + p.landscapeScore}</span>
                                            <div className="text-[10px] text-slate-400">Animals: {p.score} | Land: {p.landscapeScore}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {gameState.hostId === user.uid && <button onClick={returnToLobby} className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-xl font-bold w-full">Return to Lobby</button>}
                        </div>
                    </div>
                )}
            </div>

            <div className="h-24 bg-transparent absolute bottom-0 left-0 right-0 z-40 p-4 flex justify-between items-end pointer-events-none">
                <div className="flex gap-4 pointer-events-auto items-end w-full">
                    {/* BOTTOM LEFT: Controls */}
                    <div className="flex flex-col gap-4 mb-1">
                        {/* HAND (Stacked above buttons) */}
                        {isMyTurn && gameState.turnPhase === "PLACE" && me.holding.length > 0 && (
                            <div className="bg-slate-900/90 border border-cyan-500/30 px-3 py-2 rounded-xl shadow-2xl flex flex-col items-center gap-2 backdrop-blur-md">
                                <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest">Placing</span>
                                <div className="flex items-center gap-2">
                                    {me.holding.map((t, i) => {
                                        const T = TOKEN_TYPES[t];
                                        return (
                                        <button key={i} onClick={() => { setSelectedHoldingIdx(i); setSelectedAnimalIdx(null); }} className={`w-8 h-8 rounded-full border-2 shadow-lg flex items-center justify-center transition-all active:scale-90 ${T.color} ${T.border} ${selectedHoldingIdx === i ? "ring-4 ring-white scale-110 z-10" : "opacity-80 hover:opacity-100 hover:scale-105"}`}>
                                            <T.icon size={14} className="text-white/80"/>
                                        </button>
                                    )})}
                                    {selectedHoldingIdx !== null && (
                                        <button onClick={handleDiscard} className="w-8 h-8 rounded-full border-2 border-red-500 bg-red-900/50 flex items-center justify-center hover:bg-red-800 transition-colors" title="Discard Token">
                                            <Trash2 size={12} className="text-red-300"/>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* END TURN BUTTON (Replaces Hand when empty) */}
                        {isMyTurn && gameState.turnPhase === "PLACE" && me.holding.length === 0 && (
                             <button 
                                onClick={handleEndTurn}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl shadow-lg animate-pulse flex items-center justify-center gap-2 text-sm whitespace-nowrap"
                            >
                                End Turn <SkipForward size={14} />
                            </button>
                        )}

                        {/* PALETTE BUTTONS */}
                        <div className="flex gap-4">
                            <button onClick={() => setActivePalette('TOKENS')} disabled={!isMyTurn || gameState.turnPhase !== "DRAFT"} className={`w-14 h-14 rounded-full border-2 shadow-xl flex items-center justify-center transition-all active:scale-90 ${isMyTurn && gameState.turnPhase === "DRAFT" ? "bg-cyan-600 border-cyan-400 text-white animate-bounce-subtle" : "bg-slate-800 border-slate-600 text-slate-500 grayscale"}`}><Grid size={24}/></button>
                            <button onClick={() => setActivePalette('ANIMALS')} disabled={!isMyTurn || gameState.turnPhase !== "DRAFT" || me.animals.filter(a => a.slotsFilled < a.maxSlots).length >= 4} className={`w-14 h-14 rounded-full border-2 shadow-xl flex items-center justify-center transition-all active:scale-90 ${isMyTurn && gameState.turnPhase === "DRAFT" && me.animals.filter(a => a.slotsFilled < a.maxSlots).length < 4 ? "bg-orange-600 border-orange-400 text-white" : "bg-slate-800 border-slate-600 text-slate-500 grayscale"}`}><PawPrint size={24}/></button>
                        </div>
                    </div>
                    
                    {/* ANIMAL HAND AREA */}
                    <div className="flex gap-2 items-end ml-2 overflow-x-auto pb-1 max-w-[calc(100vw-160px)] no-scrollbar mask-gradient-right h-48 md:h-52">
                        {viewingPlayer.animals.map((card, i) => {
                             const def = ANIMALS[card.type];
                             const isSelected = i === selectedAnimalIdx && viewingPlayer.id === user.uid;
                             return (
                                 <button 
                                    key={card.id} 
                                    onClick={() => {
                                        if (viewingPlayer.id !== user.uid) return;
                                        setSelectedHoldingIdx(null); // Clear token
                                        setSelectedAnimalIdx(isSelected ? null : i); // Toggle
                                    }}
                                    className={`relative w-28 h-36 bg-slate-900/90 border-2 rounded-xl flex flex-col shadow-xl shrink-0 backdrop-blur-md transition-all hover:-translate-y-2 text-left ${isSelected ? 'border-yellow-400 ring-2 ring-yellow-500/50 scale-105 z-10' : 'border-slate-600'}`}
                                 >
                                     <div className="flex justify-between items-center p-2 border-b border-white/10 bg-black/20">
                                        <div className="flex items-center gap-1">
                                            <def.icon size={14} className={def.iconColor} />
                                            <span className="text-xs font-bold text-white truncate max-w-[60px]">{def.name}</span>
                                        </div>
                                        <span className="text-xs font-black text-yellow-500">+{def.points}</span>
                                     </div>
                                     <div className="p-2 flex-1 flex flex-col items-center justify-center">
                                        <div className="my-1 scale-75 origin-center"><PatternPreview visual={def.visual} /></div>
                                        <div className="text-[9px] text-slate-400 text-center leading-tight mb-1 px-1 h-6 overflow-hidden">{def.desc}</div>
                                        <div className="mt-auto w-full pt-1">
                                            <div className="text-[9px] text-slate-500 uppercase font-bold mb-1 text-center">Progress</div>
                                            <div className="flex gap-1 justify-center">
                                                {Array.from({length: card.maxSlots}).map((_, i) => (
                                                    <div key={i} className={`h-2 w-full rounded-full border ${i < card.slotsFilled ? 'bg-green-500 border-green-400' : 'bg-slate-800 border-slate-700'}`}></div>
                                                ))}
                                            </div>
                                        </div>
                                     </div>
                                 </button>
                             )
                        })}
                    </div>
                </div>
            </div>
        </div>
      );
  }

  return null;
}
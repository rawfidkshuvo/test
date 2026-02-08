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
  Earth,
  Circle,
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
  SkipForward,
  Dog,
  Leaf,
  BarChart2,
  Anchor,
  Ghost, // Bat
  Shell, // Turtle
  Feather, // Hawk
  Footprints, // Deer
  Nut, // Squirrel
  Snowflake, // Spider (Web)
  Clover, // Frog (Lilypad vibe)
  Moon, // Wolf
  Target, // Eagle (Hunter)
  Flame, // Fox
  Flower, // Bee
  Vegan,
  Stone,
  Cylinder,
  Cuboid,
  Grip,
  Droplet,
  Sprout,
  Squirrel,
  Turtle,
  PiggyBank,
  Worm,
  ChessBishop,
  ChessKnight,
  Cone,
  Panda,
  Origami,
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
const GAME_ID = "9";

// ---------------------------------------------------------------------------
// STYLES & VISUALS
// ---------------------------------------------------------------------------

const GlobalStyles = () => (
  <style>{`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.3); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.6); }
    
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(10deg); }
    }
    .animate-float { animation: float infinite ease-in-out; }
    
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-spin-slow { animation: spin-slow 12s linear infinite; }

    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    
    .mask-gradient-right { mask-image: linear-gradient(to right, black 85%, transparent 100%); }
  `}</style>
);

const FloatingBackground = ({ isShaking }) => (
  <div
    className={`absolute inset-0 overflow-hidden pointer-events-none z-0 ${
      isShaking ? "animate-shake bg-red-900/20" : ""
    }`}
  >
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-yellow-900/20 via-gray-950 to-black" />
    <div className="absolute top-0 left-0 w-full h-full opacity-10">
      {[...Array(20)].map((_, i) => {
        const fruitKeys = Object.keys(TOKEN_TYPES);
        const Icon = TOKEN_TYPES[fruitKeys[i % fruitKeys.length]].icon;
        return (
          <div
            key={i}
            className="absolute animate-float text-white/60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${10 + Math.random() * 20}s`,
              transform: `scale(${0.5 + Math.random()})`,
            }}
          >
            <Icon size={32} />
          </div>
        );
      })}
    </div>
    <style>{`
      @keyframes float {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(10deg); }
      }
      .animate-float { animation: float infinite ease-in-out; }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
      .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
    `}</style>
  </div>
);

// ---------------------------------------------------------------------------
// GAME LOGIC & CONSTANTS
// ---------------------------------------------------------------------------

const TOKEN_TYPES = {
  WOOD: {
    id: "WOOD",
    color: "bg-amber-800",
    border: "border-amber-950",
    icon: Cylinder,
    name: "Log",
    validOn: ["EMPTY", "WOOD"],
    scoreType: "TREE",
  },
  LEAF: {
    id: "LEAF",
    color: "bg-emerald-500",
    border: "border-emerald-700",
    icon: Leaf,
    name: "Foliage",
    validOn: ["EMPTY", "WOOD"],
    scoreType: "TREE",
  },
  STONE: {
    id: "STONE",
    color: "bg-slate-400",
    border: "border-slate-600",
    icon: Stone,
    name: "Stone",
    validOn: ["EMPTY", "STONE"],
    scoreType: "MOUNTAIN",
  },
  WATER: {
    id: "WATER",
    color: "bg-cyan-500",
    border: "border-cyan-700",
    icon: Droplet,
    name: "Water",
    validOn: ["EMPTY"],
    scoreType: "RIVER",
  },
  SAND: {
    id: "SAND",
    color: "bg-yellow-400",
    border: "border-yellow-600",
    icon: Sprout,
    name: "Sand",
    validOn: ["EMPTY"],
    scoreType: "FIELD",
  },
  BRICK: {
    id: "BRICK",
    color: "bg-red-700",
    border: "border-red-900",
    icon: Cuboid,
    name: "Brick",
    // CHANGED: Now valid on Empty (for base), Brick, Stone, or Wood
    validOn: ["EMPTY", "BRICK", "STONE", "WOOD"],
    scoreType: "BUILDING",
  },
};

// HELPER FOR PATTERNS
const getNeighbors = (q, r) => [
  { q: q + 1, r: r },
  { q: q + 1, r: r - 1 },
  { q: q, r: r - 1 },
  { q: q - 1, r: r },
  { q: q - 1, r: r + 1 },
  { q: q, r: r + 1 },
];

// RETURNS TRUE ONLY IF: Height is 2, Top is Brick, Bottom is Valid
const isBuilding = (cell) => {
  if (!cell || cell.stack.length !== 2) return false;
  const top = cell.stack[1];
  const bottom = cell.stack[0];
  return top === "BRICK" && ["BRICK", "STONE", "WOOD"].includes(bottom);
};

const checkStack = (cell, pattern) => {
  if (!cell || cell.stack.length !== pattern.length) return false;
  return cell.stack.every((t, i) => t === pattern[i]);
};

// Returns true if any neighbor matches the predicate
const checkAnyNeighbor = (board, q, r, predicate) => {
  const neighbors = getNeighbors(q, r);
  return neighbors.some((n) => {
    const cell = board[`${n.q},${n.r}`];
    return cell && predicate(cell);
  });
};

// --- LINEAR PATTERN HELPER ---
const DIRECTIONS = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

// Checks if a specific sequence of checks passes in ANY straight line from (q,r)
const checkLine = (board, q, r, predicates) => {
  return DIRECTIONS.some((dir) => {
    // Check every step in this direction
    return predicates.every((pred, i) => {
      const targetQ = q + dir.q * (i + 1);
      const targetR = r + dir.r * (i + 1);
      const cell = board[`${targetQ},${targetR}`];
      // If cell is missing or predicate fails, this direction is invalid
      return cell && pred(cell);
    });
  });
};

// HELPER: Gets the visible token type (Top of stack)
// Returns null if empty.
const getTop = (cell) => {
  if (!cell || cell.stack.length === 0) return null;
  return cell.stack[cell.stack.length - 1];
};

const ANIMALS = {
  // --- TIER 1: SIMPLE STACKS & ADJACENCY (Easy) ---

  SQUIRREL: {
    id: "SQUIRREL",
    name: "Squirrel",
    desc: "Small Tree (1 Log + Leaf)",
    points: [2, 2, 2],
    slots: 3,
    icon: Squirrel,
    iconColor: "text-orange-500",
    visual: { type: "stack", tokens: ["WOOD", "LEAF"] },
    // Full Proof: Exact stack match required.
    check: (cell) => checkStack(cell, ["WOOD", "LEAF"]),
  },
  LIZARD: {
    id: "LIZARD",
    name: "Lizard",
    desc: "Small Rock (Stone) next to Bush (Leaf)",
    points: [2, 2, 2],
    slots: 3,
    icon: Rat,
    iconColor: "text-emerald-400",
    visual: { type: "adj", main: ["STONE"], others: [["LEAF"]] },
    // Full Proof: Exact stack matches required.
    check: (cell, board) =>
      checkStack(cell, ["STONE"]) &&
      checkAnyNeighbor(board, cell.q, cell.r, (n) => checkStack(n, ["LEAF"])),
  },
  SNAIL: {
    id: "SNAIL",
    name: "Snail",
    desc: "Small Rock (Stone) next to Water",
    points: [2, 2, 2],
    slots: 3,
    icon: Snail,
    iconColor: "text-lime-300",
    visual: { type: "adj", main: ["STONE"], others: [["WATER"]] },
    // Full Proof: Exact Stone stack, neighbor must have Water on TOP.
    check: (cell, board) =>
      checkStack(cell, ["STONE"]) &&
      checkAnyNeighbor(board, cell.q, cell.r, (n) => getTop(n) === "WATER"),
  },
  HERON: {
    id: "HERON",
    name: "Heron",
    desc: "Water next to Bush (Leaf)",
    points: [2, 2, 2],
    slots: 3,
    icon: Bird,
    iconColor: "text-cyan-300",
    visual: { type: "adj", main: ["WATER"], others: [["LEAF"]] },
    check: (cell, board) =>
      getTop(cell) === "WATER" &&
      checkAnyNeighbor(board, cell.q, cell.r, (n) => checkStack(n, ["LEAF"])),
  },
  DUCK: {
    id: "DUCK",
    name: "Duck",
    desc: "Water next to Wood (Log)",
    points: [2, 2, 2],
    slots: 3,
    icon: Origami,
    iconColor: "text-green-600",
    visual: { type: "adj", main: ["WATER"], others: [["WOOD"]] },
    check: (cell, board) =>
      getTop(cell) === "WATER" &&
      checkAnyNeighbor(board, cell.q, cell.r, (n) => checkStack(n, ["WOOD"])),
  },
  HAWK: {
    id: "HAWK",
    name: "Hawk",
    desc: "Dead Tree (3 Logs)",
    points: [3, 4],
    slots: 2,
    icon: Bird,
    iconColor: "text-red-700",
    visual: { type: "stack", tokens: ["WOOD", "WOOD", "WOOD"] },
    check: (cell) => checkStack(cell, ["WOOD", "WOOD", "WOOD"]),
  },
  EAGLE: {
    id: "EAGLE",
    name: "Eagle",
    desc: "Highest Peak (3 Stone)",
    points: [3, 4],
    slots: 2,
    icon: Target,
    iconColor: "text-sky-600",
    visual: { type: "stack", tokens: ["STONE", "STONE", "STONE"] },
    check: (cell) => checkStack(cell, ["STONE", "STONE", "STONE"]),
  },

  // --- TIER 2: COMPLEX ADJACENCY (Medium) ---

  FROG: {
    id: "FROG",
    name: "Frog",
    desc: "Bush (Leaf) next to Water",
    points: [2, 2, 2, 3],
    slots: 4,
    icon: Clover,
    iconColor: "text-lime-500",
    visual: { type: "adj", main: ["LEAF"], others: [["WATER"]] },
    check: (cell, board) =>
      checkStack(cell, ["LEAF"]) &&
      checkAnyNeighbor(board, cell.q, cell.r, (n) => getTop(n) === "WATER"),
  },
  BEAVER: {
    id: "BEAVER",
    name: "Beaver",
    desc: "Log next to Water AND Tree",
    points: [4, 5],
    slots: 2,
    icon: Rat,
    iconColor: "text-amber-800",
    visual: {
      type: "adj",
      main: ["WOOD"],
      others: [["WATER"], ["WOOD", "LEAF"]],
    },
    check: (cell, board) => {
      if (!checkStack(cell, ["WOOD"])) return false;
      const neighbors = getNeighbors(cell.q, cell.r).map(
        (n) => board[`${n.q},${n.r}`],
      );
      const hasWater = neighbors.some((n) => getTop(n) === "WATER");
      const hasTree = neighbors.some(
        (n) => n && checkStack(n, ["WOOD", "LEAF"]),
      );
      return hasWater && hasTree;
    },
  },
  TURTLE: {
    id: "TURTLE",
    name: "Turtle",
    desc: "Water next to Field AND Stone",
    points: [3, 3],
    slots: 2,
    icon: Turtle,
    iconColor: "text-teal-600",
    visual: { type: "adj", main: ["WATER"], others: [["SAND"], ["STONE"]] },
    // FIXED: Now checks getTop to prevent buildings counting as stone/sand
    check: (cell, board) => {
      if (getTop(cell) !== "WATER") return false;
      const neighbors = getNeighbors(cell.q, cell.r).map(
        (n) => board[`${n.q},${n.r}`],
      );
      return (
        neighbors.some((n) => getTop(n) === "SAND") &&
        neighbors.some((n) => getTop(n) === "STONE")
      );
    },
  },
  HEDGEHOG: {
    id: "HEDGEHOG",
    name: "Hedgehog",
    desc: "Field next to Wood(1 Log) AND Bush(1 Leaf)",
    points: [3, 4],
    slots: 2,
    icon: Rabbit,
    iconColor: "text-blue-600",
    visual: { type: "adj", main: ["SAND"], others: [["LEAF"], ["WOOD"]] },
    check: (cell, board) => {
      if (getTop(cell) !== "SAND") return false;
      const neighbors = getNeighbors(cell.q, cell.r).map(
        (n) => board[`${n.q},${n.r}`],
      );
      return (
        neighbors.some((n) => n && checkStack(n, ["LEAF"])) &&
        neighbors.some((n) => n && checkStack(n, ["WOOD"]))
      );
    },
  },
  SHELL: {
    id: "SHELL",
    name: "Shell",
    desc: "Sand next to Water AND Stone",
    points: [3, 3],
    slots: 2,
    icon: Shell,
    iconColor: "text-red-600",
    visual: { type: "adj", main: ["SAND"], others: [["WATER"], ["STONE"]] },
    check: (cell, board) => {
      if (getTop(cell) !== "SAND") return false;
      const neighbors = getNeighbors(cell.q, cell.r).map(
        (n) => board[`${n.q},${n.r}`],
      );
      return (
        neighbors.some((n) => getTop(n) === "WATER") &&
        neighbors.some((n) => getTop(n) === "STONE")
      );
    },
  },
  BOAR: {
    id: "BOAR",
    name: "Boar",
    desc: "Field next to Water AND Tree",
    points: [4, 4, 5],
    slots: 3,
    icon: PiggyBank,
    iconColor: "text-amber-900",
    visual: {
      type: "adj",
      main: ["SAND"],
      others: [["WATER"], ["WOOD", "LEAF"]],
    },
    check: (cell, board) => {
      if (getTop(cell) !== "SAND") return false;
      const neighbors = getNeighbors(cell.q, cell.r).map(
        (n) => board[`${n.q},${n.r}`],
      );
      return (
        neighbors.some((n) => getTop(n) === "WATER") &&
        neighbors.some((n) => n && checkStack(n, ["WOOD", "LEAF"]))
      );
    },
  },
  ANTS: {
    id: "ANTS",
    name: "Ants",
    desc: "Field next to Bush(1 Leaf) AND Tree",
    points: [4, 4, 5],
    slots: 3,
    icon: Bug,
    iconColor: "text-amber-600",
    visual: {
      type: "adj",
      main: ["SAND"],
      others: [["LEAF"], ["WOOD", "LEAF"]],
    },
    check: (cell, board) => {
      if (getTop(cell) !== "SAND") return false;
      const neighbors = getNeighbors(cell.q, cell.r).map(
        (n) => board[`${n.q},${n.r}`],
      );
      return (
        neighbors.some((n) => n && checkStack(n, ["LEAF"])) &&
        neighbors.some((n) => n && checkStack(n, ["WOOD", "LEAF"]))
      );
    },
  },
  FOX: {
    id: "FOX",
    name: "Fox",
    desc: "Medium Rock (2 Stone) next to Medium Wood (2 Log)",
    points: [4, 5],
    slots: 2,
    icon: Cat,
    iconColor: "text-orange-600",
    visual: {
      type: "adj",
      main: ["STONE", "STONE"],
      others: [["WOOD", "WOOD"]],
    },
    check: (cell, board) =>
      checkStack(cell, ["STONE", "STONE"]) &&
      checkAnyNeighbor(board, cell.q, cell.r, (n) =>
        checkStack(n, ["WOOD", "WOOD"]),
      ),
  },
  DEER: {
    id: "DEER",
    name: "Deer",
    desc: "Tall Tree (2 Log+Leaf) next to Field",
    points: [4, 5, 5],
    slots: 3,
    icon: Dog,
    iconColor: "text-amber-600",
    visual: {
      type: "adj",
      main: ["WOOD", "WOOD", "LEAF"],
      others: [["SAND"]],
    },
    check: (cell, board) =>
      checkStack(cell, ["WOOD", "WOOD", "LEAF"]) &&
      checkAnyNeighbor(board, cell.q, cell.r, (n) => getTop(n) === "SAND"),
  },
  BEAR: {
    id: "BEAR",
    name: "Bear",
    desc: "Tall Tree (2 Log+Leaf) next to Mountain (2+ Stone)",
    points: [5, 6],
    slots: 2,
    icon: Panda,
    iconColor: "text-amber-800",
    visual: {
      type: "adj",
      main: ["WOOD", "WOOD", "LEAF"],
      others: [["STONE", "STONE"]],
    },
    // FIXED: Checks length AND ensures top is Stone (not brick)
    check: (cell, board) =>
      checkStack(cell, ["WOOD", "WOOD", "LEAF"]) &&
      checkAnyNeighbor(
        board,
        cell.q,
        cell.r,
        (n) => n && n.stack.length >= 2 && getTop(n) === "STONE",
      ),
  },
  PANDA: {
    id: "PANDA",
    name: "Panda",
    desc: "Tall Tree (2 Log+Leaf) next to Water",
    points: [5, 5],
    slots: 2,
    icon: Panda,
    iconColor: "text-red-300",
    visual: {
      type: "adj",
      main: ["WOOD", "WOOD", "LEAF"],
      others: [["WATER"]],
    },
    check: (cell, board) =>
      checkStack(cell, ["WOOD", "WOOD", "LEAF"]) &&
      checkAnyNeighbor(board, cell.q, cell.r, (n) => getTop(n) === "WATER"),
  },
  SCORPION: {
    id: "SCORPION",
    name: "Scorpion",
    desc: "Medium Rock (2 Stone) next to Field",
    points: [3, 3, 3],
    slots: 3,
    icon: Snail,
    iconColor: "text-rose-600",
    visual: { type: "adj", main: ["STONE", "STONE"], others: [["SAND"]] },
    check: (cell, board) =>
      checkStack(cell, ["STONE", "STONE"]) &&
      checkAnyNeighbor(board, cell.q, cell.r, (n) => getTop(n) === "SAND"),
  },

  // --- TIER 3: CLUSTERS & SURROUNDED (Hard) ---

  BEE: {
    id: "BEE",
    name: "Bee",
    desc: "Bush (Leaf) next to 2 other Bushes",
    points: [2, 3, 3],
    slots: 3,
    icon: Flower,
    iconColor: "text-yellow-400",
    visual: { type: "adj", main: ["LEAF"], others: [["LEAF"], ["LEAF"]] },
    check: (cell, board) => {
      if (!checkStack(cell, ["LEAF"])) return false;
      let count = 0;
      getNeighbors(cell.q, cell.r).forEach((n) => {
        const neighbor = board[`${n.q},${n.r}`];
        if (neighbor && checkStack(neighbor, ["LEAF"])) count++;
      });
      return count >= 2;
    },
  },
  WOLF: {
    id: "WOLF",
    name: "Wolf",
    desc: "Tree (1 Log+Leaf) next to 2 other Trees",
    points: [6, 7],
    slots: 2,
    icon: Moon,
    iconColor: "text-orange-500",
    visual: {
      type: "adj",
      main: ["WOOD", "LEAF"],
      others: [
        ["WOOD", "LEAF"],
        ["WOOD", "LEAF"],
      ],
    },
    check: (cell, board) => {
      if (!checkStack(cell, ["WOOD", "LEAF"])) return false;
      let trees = 0;
      getNeighbors(cell.q, cell.r).forEach((n) => {
        const neighbor = board[`${n.q},${n.r}`];
        if (neighbor && checkStack(neighbor, ["WOOD", "LEAF"])) trees++;
      });
      return trees >= 2;
    },
  },
  SALMON: {
    id: "SALMON",
    name: "Salmon",
    desc: "Water next to 2 other Water tiles",
    points: [3, 3, 3],
    slots: 3,
    icon: Fish,
    iconColor: "text-rose-400",
    visual: { type: "adj", main: ["WATER"], others: [["WATER"], ["WATER"]] },
    check: (cell, board) => {
      if (getTop(cell) !== "WATER") return false;
      let waters = 0;
      getNeighbors(cell.q, cell.r).forEach((n) => {
        if (getTop(board[`${n.q},${n.r}`]) === "WATER") waters++;
      });
      return waters >= 2;
    },
  },
  RABBIT: {
    id: "RABBIT",
    name: "Rabbit",
    desc: "Field next to 2 Bushes",
    points: [3, 4, 4, 4],
    slots: 4,
    icon: Rabbit,
    iconColor: "text-fuchsia-300",
    visual: { type: "adj", main: ["SAND"], others: [["LEAF"], ["LEAF"]] },
    check: (cell, board) => {
      if (getTop(cell) !== "SAND") return false;
      let bushes = 0;
      getNeighbors(cell.q, cell.r).forEach((n) => {
        const neighbor = board[`${n.q},${n.r}`];
        if (neighbor && checkStack(neighbor, ["LEAF"])) bushes++;
      });
      return bushes >= 2;
    },
  },
  PENGUIN: {
    id: "PENGUIN",
    name: "Penguin",
    desc: "Stone next to 2 Water tiles",
    points: [3, 3, 4, 4],
    slots: 4,
    icon: Bird,
    iconColor: "text-cyan-300",
    visual: { type: "adj", main: ["STONE"], others: [["WATER"], ["WATER"]] },
    check: (cell, board) => {
      // FIXED: Ensure Main is Top Stone
      if (getTop(cell) !== "STONE") return false;
      let waters = 0;
      getNeighbors(cell.q, cell.r).forEach((n) => {
        const neighbor = board[`${n.q},${n.r}`];
        if (getTop(neighbor) === "WATER") waters++;
      });
      return waters >= 2;
    },
  },
  MOLE: {
    id: "MOLE",
    name: "Mole",
    desc: "Stone next to 2 Fields",
    points: [3, 3, 4, 4],
    slots: 4,
    icon: Rat,
    iconColor: "text-amber-700",
    visual: { type: "adj", main: ["STONE"], others: [["SAND"], ["SAND"]] },
    check: (cell, board) => {
      if (getTop(cell) !== "STONE") return false;
      let fields = 0;
      getNeighbors(cell.q, cell.r).forEach((n) => {
        const neighbor = board[`${n.q},${n.r}`];
        if (getTop(neighbor) === "SAND") fields++;
      });
      return fields >= 2;
    },
  },

  // --- TIER 4: BUILDINGS (Very Hard) ---

  BAT: {
    id: "BAT",
    name: "Bat",
    desc: "Building next to Water",
    points: [4, 4, 5],
    slots: 3,
    icon: Ghost,
    iconColor: "text-violet-400",
    visual: { type: "adj", main: ["BRICK", "BRICK"], others: [["WATER"]] },
    check: (cell, board) =>
      isBuilding(cell) &&
      checkAnyNeighbor(board, cell.q, cell.r, (n) => getTop(n) === "WATER"),
  },
  CAT: {
    id: "CAT",
    name: "Cat",
    desc: "Building next to 2 Fields",
    points: [5, 6],
    slots: 2,
    icon: Cat,
    iconColor: "text-yellow-600",
    visual: {
      type: "adj",
      main: ["BRICK", "BRICK"],
      others: [["SAND"], ["SAND"]],
    },
    check: (cell, board) => {
      if (!isBuilding(cell)) return false;
      let count = 0;
      getNeighbors(cell.q, cell.r).forEach((n) => {
        const neighbor = board[`${n.q},${n.r}`];
        if (getTop(neighbor) === "SAND") count++;
      });
      return count >= 2;
    },
  },
  OWL: {
    id: "OWL",
    name: "Owl",
    desc: "Tall Tree (2 Log+Leaf) next to Building",
    points: [6, 7],
    slots: 2,
    icon: Eye,
    iconColor: "text-indigo-400",
    visual: {
      type: "adj",
      main: ["WOOD", "WOOD", "LEAF"],
      others: [["BRICK", "BRICK"]],
    },
    check: (cell, board) =>
      checkStack(cell, ["WOOD", "WOOD", "LEAF"]) &&
      checkAnyNeighbor(board, cell.q, cell.r, (n) => isBuilding(n)),
  },
  SPIDER: {
    id: "SPIDER",
    name: "Spider",
    desc: "Dead Tree (3 Log) next to Building",
    points: [6, 6],
    slots: 2,
    icon: Snowflake,
    iconColor: "text-red-900",
    visual: {
      type: "adj",
      main: ["WOOD", "WOOD", "WOOD"],
      others: [["BRICK", "BRICK"]],
    },
    check: (cell, board) =>
      checkStack(cell, ["WOOD", "WOOD", "WOOD"]) &&
      checkAnyNeighbor(board, cell.q, cell.r, (n) => isBuilding(n)),
  },

  // --- TIER 5: LINEAR (Spatial Puzzle) ---

  CATERPILLAR: {
    id: "CATERPILLAR",
    name: "Caterpillar",
    desc: "Line: Leaf -> Leaf -> Leaf",
    points: [3, 3, 3],
    slots: 3,
    icon: Worm,
    iconColor: "text-lime-600",
    visual: { type: "line", sequence: [["LEAF"], ["LEAF"], ["LEAF"]] },
    check: (cell, board) => {
      if (!checkStack(cell, ["LEAF"])) return false;
      return checkLine(board, cell.q, cell.r, [
        (n) => checkStack(n, ["LEAF"]),
        (n) => checkStack(n, ["LEAF"]),
      ]);
    },
  },
  SNAKE: {
    id: "SNAKE",
    name: "Snake",
    desc: "Line: Bush -> Bush -> Stone",
    points: [3, 4],
    slots: 2,
    icon: Worm,
    iconColor: "text-emerald-500",
    visual: { type: "line", sequence: [["LEAF"], ["LEAF"], ["STONE"]] },
    check: (cell, board) => {
      if (!checkStack(cell, ["LEAF"])) return false;
      return checkLine(board, cell.q, cell.r, [
        (n) => checkStack(n, ["LEAF"]),
        (n) => getTop(n) === "STONE",
      ]);
    },
  },
  CAMEL: {
    id: "CAMEL",
    name: "Camel",
    desc: "Line: Sand -> Sand -> Stone",
    points: [3, 4],
    slots: 2,
    icon: Flame,
    iconColor: "text-amber-400",
    visual: { type: "line", sequence: [["SAND"], ["SAND"], ["STONE"]] },
    check: (cell, board) => {
      if (getTop(cell) !== "SAND") return false;
      return checkLine(board, cell.q, cell.r, [
        (n) => getTop(n) === "SAND",
        (n) => getTop(n) === "STONE",
      ]);
    },
  },
  RHINO: {
    id: "RHINO",
    name: "Rhino",
    desc: "Line: Stone -> Stone -> Field",
    points: [3, 4],
    slots: 2,
    icon: Cone,
    iconColor: "text-stone-400",
    visual: { type: "line", sequence: [["STONE"], ["STONE"], ["SAND"]] },
    check: (cell, board) => {
      if (getTop(cell) !== "STONE") return false;
      return checkLine(board, cell.q, cell.r, [
        (n) => getTop(n) === "STONE",
        (n) => getTop(n) === "SAND",
      ]);
    },
  },
  SWAN: {
    id: "SWAN",
    name: "Swan",
    desc: "Line: Water -> Water -> Leaf",
    points: [3, 4],
    slots: 2,
    icon: Origami,
    iconColor: "text-pink-400",
    visual: { type: "line", sequence: [["WATER"], ["WATER"], ["LEAF"]] },
    check: (cell, board) => {
      if (getTop(cell) !== "WATER") return false;
      return checkLine(board, cell.q, cell.r, [
        (n) => getTop(n) === "WATER",
        (n) => checkStack(n, ["LEAF"]),
      ]);
    },
  },
  CRANE: {
    id: "CRANE",
    name: "Crane",
    desc: "Line: Water -> Log -> Water",
    points: [3, 3],
    slots: 2,
    icon: Bird,
    iconColor: "text-red-400",
    visual: { type: "line", sequence: [["WATER"], ["WOOD"], ["WATER"]] },
    check: (cell, board) => {
      if (getTop(cell) !== "WATER") return false;
      return checkLine(board, cell.q, cell.r, [
        (n) => checkStack(n, ["WOOD"]),
        (n) => getTop(n) === "WATER",
      ]);
    },
  },
  OCTOPUS: {
    id: "OCTOPUS",
    name: "Octopus",
    desc: "Line: Water -> Stone -> Water",
    points: [3, 3],
    slots: 2,
    icon: Snowflake,
    iconColor: "text-indigo-600",
    visual: { type: "line", sequence: [["WATER"], ["STONE"], ["WATER"]] },
    check: (cell, board) => {
      if (getTop(cell) !== "WATER") return false;
      return checkLine(board, cell.q, cell.r, [
        (n) => getTop(n) === "STONE",
        (n) => getTop(n) === "WATER",
      ]);
    },
  },

  // --- TIER 6: EXPERT LINEAR (Expert) ---

  MONKEY: {
    id: "MONKEY",
    name: "Monkey",
    desc: "Line: Small Tree -> Tall Tree",
    points: [5, 6],
    slots: 2,
    icon: Squirrel,
    iconColor: "text-amber-500",
    visual: {
      type: "line",
      sequence: [
        ["WOOD", "LEAF"],
        ["WOOD", "WOOD", "LEAF"],
      ],
    },
    check: (cell, board) => {
      if (!checkStack(cell, ["WOOD", "LEAF"])) return false;
      return checkLine(board, cell.q, cell.r, [
        (n) => checkStack(n, ["WOOD", "WOOD", "LEAF"]),
      ]);
    },
  },
  COUGAR: {
    id: "COUGAR",
    name: "Cougar",
    desc: "Line: Medium Rock -> High Peak",
    points: [5, 6],
    slots: 2,
    icon: Cat,
    iconColor: "text-red-600",
    visual: {
      type: "line",
      sequence: [
        ["STONE", "STONE"],
        ["STONE", "STONE", "STONE"],
      ],
    },
    check: (cell, board) => {
      if (!checkStack(cell, ["STONE", "STONE"])) return false;
      return checkLine(board, cell.q, cell.r, [
        (n) => checkStack(n, ["STONE", "STONE", "STONE"]),
      ]);
    },
  },
  KINGFISHER: {
    id: "KINGFISHER",
    name: "Kingfisher",
    desc: "Line: Tree -> Water -> Tree",
    points: [5, 5],
    slots: 2,
    icon: Bird,
    iconColor: "text-cyan-500",
    visual: {
      type: "line",
      sequence: [["WOOD", "LEAF"], ["WATER"], ["WOOD", "LEAF"]],
    },
    check: (cell, board) => {
      if (!checkStack(cell, ["WOOD", "LEAF"])) return false;
      return checkLine(board, cell.q, cell.r, [
        (n) => getTop(n) === "WATER",
        (n) => checkStack(n, ["WOOD", "LEAF"]),
      ]);
    },
  },
  ELEPHANT: {
    id: "ELEPHANT",
    name: "Elephant",
    desc: "Line: Field -> Tree -> Water",
    points: [4, 5],
    slots: 2,
    icon: ChessBishop,
    iconColor: "text-pink-400",
    visual: { type: "line", sequence: [["SAND"], ["WOOD", "LEAF"], ["WATER"]] },
    check: (cell, board) => {
      if (getTop(cell) !== "SAND") return false;
      return checkLine(board, cell.q, cell.r, [
        (n) => checkStack(n, ["WOOD", "LEAF"]),
        (n) => getTop(n) === "WATER",
      ]);
    },
  },
  GIRAFFE: {
    id: "GIRAFFE",
    name: "Giraffe",
    desc: "Line: Tree -> Bush -> Building",
    points: [5, 6],
    slots: 2,
    icon: Footprints,
    iconColor: "text-yellow-600",
    visual: {
      type: "line",
      sequence: [["WOOD", "LEAF"], ["LEAF"], ["BRICK", "BRICK"]],
    },
    check: (cell, board) => {
      if (!checkStack(cell, ["WOOD", "LEAF"])) return false;
      return checkLine(board, cell.q, cell.r, [
        (n) => checkStack(n, ["LEAF"]),
        (n) => isBuilding(n),
      ]);
    },
  },
  TIGER: {
    id: "TIGER",
    name: "Tiger",
    desc: "Line: Bush -> Tall Tree -> Bush",
    points: [5, 5],
    slots: 2,
    icon: Cat,
    iconColor: "text-orange-500",
    visual: {
      type: "line",
      sequence: [["LEAF"], ["WOOD", "WOOD", "LEAF"], ["LEAF"]],
    },
    check: (cell, board) => {
      if (!checkStack(cell, ["LEAF"])) return false;
      return checkLine(board, cell.q, cell.r, [
        (n) => checkStack(n, ["WOOD", "WOOD", "LEAF"]),
        (n) => checkStack(n, ["LEAF"]),
      ]);
    },
  },
  PEACOCK: {
    id: "PEACOCK",
    name: "Peacock",
    desc: "Line: Tree -> Building -> Tree",
    points: [6, 7],
    slots: 2,
    icon: Feather,
    iconColor: "text-purple-500",
    visual: {
      type: "line",
      sequence: [
        ["WOOD", "LEAF"],
        ["BRICK", "BRICK"],
        ["WOOD", "LEAF"],
      ],
    },
    check: (cell, board) => {
      if (!checkStack(cell, ["WOOD", "LEAF"])) return false;
      return checkLine(board, cell.q, cell.r, [
        (n) => isBuilding(n),
        (n) => checkStack(n, ["WOOD", "LEAF"]),
      ]);
    },
  },
  GOAT: {
    id: "GOAT",
    name: "Goat",
    desc: "High Peak (3 Stone) next to another Stone",
    points: [4, 5],
    slots: 2,
    icon: Crown,
    iconColor: "text-orange-400",
    visual: {
      type: "adj",
      main: ["STONE", "STONE", "STONE"],
      others: [["STONE"]],
    },
    check: (cell, board) =>
      checkStack(cell, ["STONE", "STONE", "STONE"]) &&
      checkAnyNeighbor(board, cell.q, cell.r, (n) => getTop(n) === "STONE"),
  },
  HORSE: {
    id: "HORSE",
    name: "Horse",
    desc: "Field next to Field AND Tall Tree (2 Log+Leaf)",
    points: [4, 5, 5],
    slots: 3,
    icon: ChessKnight,
    iconColor: "text-red-400",
    visual: {
      type: "adj",
      main: ["SAND"],
      others: [["SAND"], ["WOOD", "WOOD", "LEAF"]],
    },
    check: (cell, board) => {
      if (getTop(cell) !== "SAND") return false;
      const neighbors = getNeighbors(cell.q, cell.r).map(
        (n) => board[`${n.q},${n.r}`],
      );
      return (
        neighbors.some((n) => getTop(n) === "SAND") &&
        neighbors.some((n) => n && checkStack(n, ["WOOD", "WOOD", "LEAF"]))
      );
    },
  },
};

// --- CORE ENGINE ---

// REPLACE YOUR EXISTING isValidPlacement FUNCTION WITH THIS

const isValidPlacement = (cell, token) => {
  if (!cell) return false;
  if (cell.animal) return false;

  // 1. General Max Height Rule (3)
  if (cell.stack.length >= 3) return false;

  // 2. --- BUILDING FIX ---
  // If we are holding a BRICK, we can ONLY place it on:
  // - Empty hex (Height 0 -> 1)
  // - Stack of 1 (Height 1 -> 2)
  // We CANNOT place it on a stack of 2 (Height 2 -> 3 is illegal for buildings)
  if (token === "BRICK" && cell.stack.length >= 2) {
    return false;
  }

  // 3. Prevent building on top of an existing completed building
  // (If the top is already a Brick, we assume it's a building top or base)
  if (cell.stack.length >= 2 && cell.stack[cell.stack.length - 1] === "BRICK") {
    return false;
  }

  const topType =
    cell.stack.length > 0 ? cell.stack[cell.stack.length - 1] : "EMPTY";
  return TOKEN_TYPES[token].validOn.includes(topType);
};

const calculateLandscapeScore = (board) => {
  let breakdown = {
    trees: 0,
    mountains: 0,
    fields: 0,
    rivers: 0,
    buildings: 0,
  };
  const visited = new Set();
  const cells = Object.values(board);

  // 3. TREES & BUSHES
  // Logic: Must end in a LEAF to score landscape points.
  // [WOOD, WOOD, WOOD] -> 0 pts
  // [WOOD, BRICK]      -> 0 pts (handled by buildings)
  // [WOOD, LEAF]       -> 3 pts
  cells.forEach((cell) => {
    const height = cell.stack.length;
    if (height === 0) return;

    const topType = cell.stack[height - 1];
    const baseType = cell.stack[0];

    // Filter 1: If top is BRICK, it is a Building. Skip.
    if (topType === "BRICK") return;

    // Filter 2: If top is WOOD, it is just a trunk. Skip.
    // (This fixes your concern: 3 Logs will now score 0)
    if (topType === "WOOD") return;

    // Filter 3: SCORING - Only score if the top is a LEAF
    if (topType === "LEAF") {
      // Case A: Just a Leaf on the ground (Bush)
      if (height === 1) {
        breakdown.trees += 1;
      }
      // Case B: Leaf on top of Wood (Tree)
      else if (baseType === "WOOD") {
        if (height === 2)
          breakdown.trees += 3; // Small Tree (Wood + Leaf)
        else if (height === 3) breakdown.trees += 7; // Tall Tree (Wood + Wood + Leaf)
      }
    }
  });

  // 2. MOUNTAINS (Stone)
  // FIX: Added check `cell.stack[height - 1] === "STONE"`
  // This ensures we don't count a [STONE, BRICK] stack as a mountain.
  cells.forEach((cell) => {
    const height = cell.stack.length;

    // Condition: Base is Stone AND Top is Stone
    if (cell.stack[0] === "STONE" && cell.stack[height - 1] === "STONE") {
      const neighbors = getNeighbors(cell.q, cell.r);

      // Check if it touches another valid Mountain (Top must be stone)
      const touchesMountain = neighbors.some((n) => {
        const neighbor = board[`${n.q},${n.r}`];
        return (
          neighbor &&
          neighbor.stack.length > 0 &&
          neighbor.stack[neighbor.stack.length - 1] === "STONE" // Check Top
        );
      });

      if (touchesMountain) {
        if (height === 1) breakdown.mountains += 1;
        else if (height === 2) breakdown.mountains += 3;
        else if (height >= 3) breakdown.mountains += 7;
      }
    }
  });

  // 3. FIELDS (Sand) - Groups
  visited.clear();
  cells.forEach((cell) => {
    if (cell.stack[0] === "SAND" && !visited.has(`${cell.q},${cell.r}`)) {
      let groupSize = 0;
      let queue = [cell];
      visited.add(`${cell.q},${cell.r}`);

      while (queue.length > 0) {
        const current = queue.pop();
        groupSize++;
        getNeighbors(current.q, current.r).forEach((n) => {
          const neighbor = board[`${n.q},${n.r}`];
          const nKey = `${n.q},${n.r}`;
          if (neighbor && neighbor.stack[0] === "SAND" && !visited.has(nKey)) {
            visited.add(nKey);
            queue.push(neighbor);
          }
        });
      }
      if (groupSize >= 2) breakdown.fields += 5;
    }
  });

  // 4. RIVERS (Water) - Score ALL distinct chains
  visited.clear(); // Reset visited set for river pass
  cells.forEach((cell) => {
    // Start a new river chain if we find unvisited Water
    if (cell.stack[0] === "WATER" && !visited.has(`${cell.q},${cell.r}`)) {
      let groupSize = 0;
      let queue = [cell];
      visited.add(`${cell.q},${cell.r}`);

      // BFS to find all connected water
      while (queue.length > 0) {
        const current = queue.pop();
        groupSize++;
        getNeighbors(current.q, current.r).forEach((n) => {
          const neighbor = board[`${n.q},${n.r}`];
          const nKey = `${n.q},${n.r}`;
          if (neighbor && neighbor.stack[0] === "WATER" && !visited.has(nKey)) {
            visited.add(nKey);
            queue.push(neighbor);
          }
        });
      }

      // SCORE THIS SPECIFIC CHAIN
      if (groupSize === 2) breakdown.rivers += 2;
      else if (groupSize === 3) breakdown.rivers += 5;
      else if (groupSize === 4) breakdown.rivers += 8;
      else if (groupSize === 5) breakdown.rivers += 11;
      else if (groupSize === 6) breakdown.rivers += 15;
      else if (groupSize > 6) {
        // 15 base points for the first 6, plus 4 for every extra
        breakdown.rivers += 15 + (groupSize - 6) * 4;
      }
    }
  });

  // 5. BUILDINGS (Brick)
  // Rule: Must be Height 2. Top=Brick. Base=Brick/Stone/Wood.
  cells.forEach((cell) => {
    if (isBuilding(cell)) {
      // <--- USE HELPER HERE
      const neighbors = getNeighbors(cell.q, cell.r);
      const distinctColors = new Set();
      neighbors.forEach((n) => {
        const neighbor = board[`${n.q},${n.r}`];
        if (neighbor && neighbor.stack.length > 0) {
          const type = neighbor.stack[neighbor.stack.length - 1];
          // We count colors other than BRICK for the diversity bonus
          if (type !== "BRICK") distinctColors.add(type);
        }
      });
      if (distinctColors.size >= 3) breakdown.buildings += 5;
    }
  });

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { total, breakdown };
};

// REPLACE THE EXISTING GENERATE_HEX_GRID FUNCTION WITH THIS:

const GENERATE_HEX_GRID = () => {
  const grid = {};

  // Define specific rows (r) and their column ranges (q)
  // This creates a 5-4-5-4-5 pattern centered on the screen
  const rows = [
    { r: -2, qStart: -1, qEnd: 3 }, // Top Row (5 hexes)
    { r: -1, qStart: -1, qEnd: 2 }, // 2nd Row (4 hexes)
    { r: 0, qStart: -2, qEnd: 2 }, // Middle Row (5 hexes)
    { r: 1, qStart: -2, qEnd: 1 }, // 4th Row (4 hexes)
    { r: 2, qStart: -3, qEnd: 1 }, // Bottom Row (5 hexes)
  ];

  rows.forEach(({ r, qStart, qEnd }) => {
    // Loop from start to end (inclusive)
    for (let q = qStart; q <= qEnd; q++) {
      grid[`${q},${r}`] = { q, r, stack: [], animal: null };
    }
  });

  return grid;
};

const CREATE_BAG = () => {
  const distribution = {
    WOOD: 21,
    LEAF: 19,
    STONE: 23,
    WATER: 23,
    SAND: 19,
    BRICK: 15,
  };
  let bag = [];
  Object.entries(distribution).forEach(([type, count]) => {
    for (let i = 0; i < count; i++) bag.push(type);
  });
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
};

const CREATE_ANIMAL_DECK = () => {
  // Get all unique keys
  let deck = Object.keys(ANIMALS);

  // Fisher-Yates Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};

const REFILL_MARKET = (currentMarket, currentBag) => {
  let market = [...currentMarket];
  let bag = [...currentBag];
  while (market.length < 5 && bag.length >= 3) {
    market.push({
      id: Math.random().toString(36).substr(2, 9),
      tokens: [bag.pop(), bag.pop(), bag.pop()].filter(Boolean),
    });
  }
  return { market, bag };
};

const REFILL_ANIMAL_MARKET = (currentMarket, currentDeck) => {
  let market = [...currentMarket];
  let deck = [...currentDeck];
  while (market.length < 5 && deck.length > 0) {
    const type = deck.pop();
    market.push({
      id: Math.random().toString(36).substr(2, 9),
      type: type,
    });
  }
  return { market, deck };
};

// ---------------------------------------------------------------------------
// COMPONENTS
// ---------------------------------------------------------------------------

const TokenStackVisual = ({ tokens, scale = 1, spacing = 8 }) => (
  <div
    className="relative w-8 h-12 mx-auto"
    style={{
      transform: `scale(${scale})`,
      height: `${tokens.length * spacing + 24}px`,
    }}
  >
    {tokens.map((t, i) => (
      <div
        key={i}
        className={`absolute left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border shadow-sm ${TOKEN_TYPES[t].color} ${TOKEN_TYPES[t].border} flex items-center justify-center`}
        style={{ bottom: `${i * spacing}px`, zIndex: i }}
      >
        {i === tokens.length - 1 &&
          (() => {
            const Icon = TOKEN_TYPES[t].icon;
            return <Icon size={12} className="text-white/70" />;
          })()}
      </div>
    ))}
  </div>
);

// REPLACE YOUR PatternPreview COMPONENT WITH THIS

const PatternPreview = ({ visual }) => {
  if (!visual) return null;

  // 1. Vertical Stack Preview
  if (visual.type === "stack") {
    return <TokenStackVisual tokens={visual.tokens} spacing={5} />;
  }

  // 2. Adjacency Preview (Cluster)
  if (visual.type === "adj") {
    return (
      // CHANGED: Removed 'py-2' to save vertical space
      <div className="flex items-end justify-center gap-2">
        {/* Main Center Token */}
        <div className="relative z-10 border-2 border-white/50 rounded-xl p-1 bg-black/20">
          <TokenStackVisual
            tokens={Array.isArray(visual.main) ? visual.main : [visual.main]}
            scale={0.9}
            spacing={5} // CHANGED: Tighter spacing
          />
          {/* Center Indicator Dot */}
          <div className="absolute -top-2 -right-2 w-3 h-3 bg-white rounded-full flex items-center justify-center border border-slate-500 shadow">
            <div className="w-1 h-1 bg-slate-900 rounded-full"></div>
          </div>
        </div>

        {/* Neighbors */}
        <div className="flex flex-col gap-1">
          {visual.others.map((tArr, i) => (
            <div key={i} className="opacity-80 scale-75 origin-bottom">
              <TokenStackVisual
                tokens={Array.isArray(tArr) ? tArr : [tArr]}
                scale={0.8}
                spacing={5} // CHANGED: Tighter spacing
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. Linear Preview
  if (visual.type === "line") {
    return (
      // CHANGED: 'py-2' to 'py-4'
      <div className="flex items-center justify-center gap-1 py-4">
        {visual.sequence.map((tokens, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <div className="text-slate-500 opacity-50">
                <SkipForward size={10} />
              </div>
            )}

            <div
              className={`relative ${i === 0 ? "z-10 scale-100" : "opacity-80 scale-90"}`}
            >
              {i === 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center border border-slate-500 shadow z-20">
                  <div className="w-1 h-1 bg-slate-900 rounded-full"></div>
                </div>
              )}

              <TokenStackVisual
                tokens={Array.isArray(tokens) ? tokens : [tokens]}
                scale={0.7}
                spacing={5} // CHANGED: Tighter spacing
              />
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  }

  return null;
};

const GameLogo = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Hexagon size={12} className="text-emerald-400" />
    <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">
      EQUILIBRIUM
    </span>
  </div>
);

const GameLogoBig = () => (
  <div className="flex items-center justify-center gap-1 opacity-40 mt-auto pb-2 pt-2 relative z-10">
    <Hexagon size={20} className="text-emerald-400" />
    <span className="text-[20px] font-black tracking-widest text-emerald-400 uppercase">
      EQUILIBRIUM
    </span>
  </div>
);

const HexTile = ({
  q,
  r,
  stack,
  animal,
  onClick,
  ghostToken,
  isPlaceable,
  ghostAnimal,
  isValidTarget,
}) => {
  const size = 44;
  const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = size * ((3 / 2) * r);

  return (
    <div
      onClick={() => onClick && onClick(q, r)}
      className="absolute flex items-center justify-center transition-all duration-300"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        width: `${size * 1.8}px`,
        height: `${size * 2}px`,
        transform: "translate(-50%, -50%)",
        zIndex: 10 + r,
        cursor: isPlaceable || ghostAnimal ? "pointer" : "default",
      }}
    >
      <div
        // --- UPDATED CLASSNAME LOGIC HERE ---
        className={`w-full h-full absolute transition-all duration-300 ${
          isValidTarget
            ? "bg-emerald-500/60 hover:bg-emerald-400/70 hover:scale-110 shadow-[0_0_30px_rgba(16,185,129,0.6)] z-10" // Prominent Green
            : isPlaceable || ghostAnimal
              ? "bg-slate-700/80 hover:bg-slate-600 hover:scale-105 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
              : "bg-slate-800/90"
        }`}
        // ------------------------------------
        style={{
          clipPath:
            "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          zIndex: 0,
        }}
      />

      {/* SVG Dotted Border Overlay */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 pointer-events-none z-10 overflow-visible"
        style={{ width: "100%", height: "100%" }}
      >
        <polygon
          points="50 0, 100 25, 100 75, 50 100, 0 75, 0 25"
          fill="none"
          // Make the border thicker and brighter when valid
          stroke={isValidTarget ? "#10b981" : "rgba(255,255,255,0.4)"}
          strokeWidth={isValidTarget ? "4" : "1.5"}
          strokeDasharray="4 2"
          className={isValidTarget ? "animate-pulse" : ""}
        />
      </svg>

      {/* ... (rest of the content: tokens, animals, icons) ... */}
      <div className="relative z-20 flex items-center justify-center w-full h-full pb-2 pointer-events-none">
        {stack.map((t, i) => {
          // ... existing map code ...
          const def = TOKEN_TYPES[t];
          return (
            <div
              key={i}
              className={`absolute w-10 h-10 rounded-full border-2 shadow-xl flex items-center justify-center ${def.color} ${def.border}`}
              style={{
                transform: `translateY(-${i * 8}px) scale(${1 - i * 0.02})`,
                zIndex: i,
              }}
            >
              {i === stack.length - 1 && (
                <def.icon size={16} className="text-white/80" />
              )}
            </div>
          );
        })}

        {/* ... Rest of Ghost/Icon logic ... */}
        {isPlaceable && ghostToken && (
          // ... existing code ...
          <div
            className={`absolute w-10 h-10 rounded-full border-2 border-dashed opacity-60 flex items-center justify-center animate-pulse ${TOKEN_TYPES[ghostToken].color} border-white`}
            style={{
              transform: `translateY(-${stack.length * 8}px)`,
              zIndex: 10,
            }}
          >
            <ArrowUp size={16} className="text-white" />
          </div>
        )}

        {/* Updated Check Icon to be more visible */}
        {isValidTarget && !animal && (
          <div className="absolute -top-8 w-10 h-10 rounded-full border-4 border-emerald-400 bg-emerald-900 shadow-xl flex items-center justify-center z-50 animate-bounce">
            <CheckCircle size={24} className="text-emerald-400" />
          </div>
        )}

        {/* ... Rest of GhostAnimal/Animal logic ... */}
        {ghostAnimal && !animal && (
          // ... existing code ...
          <div className="absolute -top-8 w-8 h-8 rounded-full border-2 border-dashed border-white shadow-xl flex items-center justify-center z-50 animate-pulse opacity-70">
            {(() => {
              const Def = ANIMALS[ghostAnimal];
              if (!Def) return null;
              const Icon = Def.icon;
              return (
                <Icon
                  size={16}
                  className={Def.iconColor}
                  fill="currentColor"
                  fillOpacity={0.2}
                />
              );
            })()}
          </div>
        )}
        {animal && (
          // ... existing code ...
          <div
            className="absolute w-8 h-8 rounded-full bg-white border-2 border-emerald-500 shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center z-50 animate-in zoom-in duration-300"
            style={{ transform: `translateY(-${stack.length * 8 + 6}px)` }}
          >
            {(() => {
              const Def = ANIMALS[animal];
              if (!Def) return <div className="text-black text-[8px]">?</div>;
              const Icon = Def.icon;
              return (
                <Icon
                  size={18}
                  className={Def.iconColor}
                  fill="currentColor"
                  fillOpacity={0.2}
                />
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

const FeedbackOverlay = ({ type, message, subtext, icon: Icon }) => (
  <div className="fixed inset-0 z-[160] flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-300">
    <div
      className={`flex flex-col items-center justify-center p-8 md:p-12 rounded-3xl border-4 shadow-2xl backdrop-blur-xl max-w-sm md:max-w-xl mx-4 text-center ${type === "success" ? "bg-emerald-900/90 border-emerald-500 text-emerald-100" : type === "failure" ? "bg-red-900/90 border-red-500 text-red-100" : type === "warning" ? "bg-amber-900/90 border-amber-500 text-amber-100" : "bg-blue-900/90 border-blue-500 text-blue-100"}`}
    >
      {Icon && (
        <div className="mb-4 p-4 bg-black/20 rounded-full">
          <Icon size={64} className="animate-bounce" />
        </div>
      )}
      <h2 className="text-3xl md:text-5xl font-black uppercase tracking-widest drop-shadow-md mb-2">
        {message}
      </h2>
      {subtext && (
        <p className="text-lg md:text-xl font-bold opacity-90 tracking-wide">
          {subtext}
        </p>
      )}
    </div>
  </div>
);

const RulesModal = ({ onClose }) => (
  <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
    <div className="bg-slate-900 border border-emerald-900/50 w-full max-w-3xl rounded-3xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"
      >
        <X size={24} />
      </button>
      <h2 className="text-3xl font-black text-center mb-6 text-emerald-400">
        Architect's Handbook
      </h2>
      <div className="space-y-6">
        {/* LANDSCAPE SECTION (Unchanged) */}
        <section>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Hexagon className="text-emerald-500" /> Landscape Scoring
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
            <div className="bg-slate-800 p-4 rounded-xl border border-emerald-900/30">
              <strong className="text-emerald-400 block mb-1">
                Trees (Wood + Foliage)
              </strong>
              <ul className="list-disc pl-4 text-xs space-y-1">
                <li>1 Leaf alone (Bush): 1 Pt</li>
                <li>2 High (1 Log + 1 Leaf): 3 Pts</li>
                <li>3 High (2 Log + 2 Leaf): 7 Pts</li>
              </ul>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-emerald-900/30">
              <strong className="text-slate-400 block mb-1">
                Mountains (Stone)
              </strong>
              <ul className="list-disc pl-4 text-xs space-y-1">
                <li>Score = Height of stack (1=1pt, 2=3pts, 3=7pts).</li>
                <li>
                  Only scores if adjacent to at least one other Mountain stack.
                </li>
              </ul>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-emerald-900/30">
              <strong className="text-yellow-400 block mb-1">
                Fields (Sand)
              </strong>
              <ul className="list-disc pl-4 text-xs space-y-1">
                <li>5 Pts for every distinct group of 2+ connected Sand.</li>
                <li>Cannot stack tokens on Sand.</li>
              </ul>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-emerald-900/30">
              <strong className="text-cyan-400 block mb-1">
                Rivers (Water)
              </strong>
              <ul className="list-disc pl-4 text-xs space-y-1">
                <li>Chain scoring:</li>
                <li>2=2pts, 3=5pts, 4=8pts, 5=11pts, 6+ = +4pts for each.</li>
              </ul>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl md:col-span-2 border border-emerald-900/30">
              <strong className="text-red-400 block mb-1">
                Buildings (Brick)
              </strong>
              <ul className="list-disc pl-4 text-xs space-y-1">
                <li>
                  5 Pts if surrounded by 3+ distinct terrain types (colors).
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ANIMAL SECTION (Updated) */}
        <section>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <PawPrint className="text-orange-500" /> Animal Scoring
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            Draft animals to your hand. When you create their pattern on the
            board, select the animal to place it!
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.values(ANIMALS).map((a) => {
              // Extract the icon component
              const Icon = a.icon;
              return (
                <div
                  key={a.id}
                  className="bg-slate-800 p-3 rounded-xl border border-emerald-900/30 flex flex-col items-center gap-2 text-xs relative overflow-hidden"
                >
                  {/* --- NEW: Icon Display --- */}
                  <div className="bg-black/30 p-2 rounded-full mb-1">
                    <Icon size={20} className={a.iconColor} />
                  </div>

                  <div className="scale-75 mb-2">
                    <PatternPreview visual={a.visual} />
                  </div>
                  <div className="text-center z-10">
                    <div className="font-bold text-white text-sm">{a.name}</div>
                    <div className="text-[10px] text-slate-400 leading-tight mb-2 h-8 overflow-hidden line-clamp-2">
                      {a.desc}
                    </div>
                    <div className="text-[10px] text-yellow-500 font-bold bg-black/20 px-2 py-1 rounded-full inline-block">
                      {a.points.join(" / ")} Pts
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  </div>
);

const ScoreboardModal = ({ gameState, onClose }) => (
  <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
    <div className="bg-slate-900 border border-emerald-900/50 w-full max-w-lg rounded-3xl shadow-2xl p-6 relative">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"
      >
        <X size={24} />
      </button>
      <h2 className="text-2xl font-black text-center mb-6 text-emerald-400 flex items-center justify-center gap-2">
        <BarChart2 /> Live Scores
      </h2>
      <div className="space-y-4">
        {gameState.players.map((p) => {
          // --- CALCULATE SCORES ---
          const animalScore = p.score || 0;
          const landscapeScore = p.landscapeScore || 0;
          const penaltyPoints = (p.penalties || 0) * 2;
          const totalScore = animalScore + landscapeScore - penaltyPoints;
          // ------------------------

          return (
            <div
              key={p.id}
              className="bg-slate-800 p-4 rounded-xl border border-slate-700"
            >
              <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-2">
                <span className="font-bold text-lg text-white">{p.name}</span>
                <span className="text-2xl font-black text-yellow-500">
                  {totalScore}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400">
                <div className="flex justify-between text-fuchsia-300">
                  <span>Animals:</span>{" "}
                  <span className="text-fuchsia-500 font-bold">
                    {animalScore}
                  </span>
                </div>
                <div className="flex justify-between text-green-300">
                  <span>Trees:</span>{" "}
                  <span className="text-green-500 font-bold">
                    {p.landscapeScoreBreakdown?.trees || 0}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Mountains:</span>{" "}
                  <span className="text-slate-500 font-bold">
                    {p.landscapeScoreBreakdown?.mountains || 0}
                  </span>
                </div>
                <div className="flex justify-between text-yellow-300">
                  <span>Fields:</span>{" "}
                  <span className="text-yellow-500 font-bold">
                    {p.landscapeScoreBreakdown?.fields || 0}
                  </span>
                </div>
                <div className="flex justify-between text-blue-300">
                  <span>Rivers:</span>{" "}
                  <span className="text-blue-500 font-bold">
                    {p.landscapeScoreBreakdown?.rivers || 0}
                  </span>
                </div>
                <div className="flex justify-between text-red-300">
                  <span>Buildings:</span>{" "}
                  <span className="text-red-500 font-bold">
                    {p.landscapeScoreBreakdown?.buildings || 0}
                  </span>
                </div>
                {/* --- PENALTY ROW (Only show if > 0) --- */}
                {penaltyPoints > 0 && (
                  <div className="flex justify-between text-red-400 font-bold col-span-2 border-t border-slate-700 pt-1 mt-1">
                    <span>Penalties:</span> <span>-{penaltyPoints}</span>
                  </div>
                )}

                {/* -------------------------------------- */}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

const AnimalDetailModal = ({ animal, onClose }) => (
  <div
    className="fixed inset-0 z-[210] bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200"
    onClick={onClose}
  >
    <div
      className="bg-slate-900 border-2 border-slate-700 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl relative"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 p-4 rounded-full border-4 border-slate-900">
        <animal.icon size={48} className={animal.iconColor} />
      </div>
      <h3 className="text-2xl font-black text-white mt-8 mb-2 uppercase">
        {animal.name}
      </h3>
      <div className="text-yellow-500 font-bold text-lg mb-4">
        +{animal.points[0]} Pts per placement
      </div>

      <div className="flex justify-center mb-6 bg-black/20 p-4 rounded-xl">
        <PatternPreview visual={animal.visual} />
      </div>

      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 mb-4">
        <p className="text-slate-300 text-sm">{animal.desc}</p>
      </div>
      <div className="flex justify-center gap-1 mb-4">
        {Array.from({ length: animal.slots }).map((_, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full bg-slate-700 border border-slate-600"
          ></div>
        ))}
      </div>
      <button
        onClick={onClose}
        className="bg-slate-700 hover:bg-slate-600 w-full py-3 rounded-xl font-bold"
      >
        Close
      </button>
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
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [viewingPlayerId, setViewingPlayerId] = useState(null);
  const [activePalette, setActivePalette] = useState(null);
  const [inspectedAnimal, setInspectedAnimal] = useState(null);

  // Gameplay State
  const [selectedHoldingIdx, setSelectedHoldingIdx] = useState(null);
  const [selectedAnimalIdx, setSelectedAnimalIdx] = useState(null);
  const lastLogIdRef = useRef(null);

  // --- ZOOM FEATURE STATE ---
  const [zoomCard, setZoomCard] = useState(null); // Stores the card data to show
  const longPressTimerRef = useRef(null); // Stores the timer ID

  const handleLongPressStart = (card) => {
    // Clear any existing timer just in case
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    // Start a timer: if held for 300ms, show the zoom
    longPressTimerRef.current = setTimeout(() => {
      setZoomCard(card);
      // Optional: Vibrate on mobile for tactile feedback
      //if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleLongPressEnd = () => {
    // Cancel the timer if the user releases early (it was just a click)
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;

    // Hide the card
    setZoomCard(null);
  };

  // 5. New: Cancel zoom if the user tries to scroll the list
  const handleScrollCancel = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
    // We don't hide the card here immediately to avoid flickering,
    // strictly ensuring the timer never completes.
  };

  // --- ZOOM OVERLAY COMPONENT ---
  const ZoomCardOverlay = () => {
    if (!zoomCard) return null;

    const def = ANIMALS[zoomCard.type];
    if (!def) return null;

    // Calculate progress if it's a card in hand, otherwise 0 for market
    const slotsFilled = zoomCard.slotsFilled || 0;
    const maxSlots = zoomCard.maxSlots || def.slots;
    const isComplete = slotsFilled >= maxSlots;

    return (
      <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-64 h-80 bg-slate-900 border-4 rounded-3xl flex flex-col shadow-2xl overflow-hidden scale-110 md:scale-125 transition-transform border-emerald-500/50">
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-white/10 bg-black/40">
            <div className="flex items-center gap-2">
              <def.icon size={24} className={def.iconColor} />
              <span className="text-lg font-bold text-white tracking-wide">
                {def.name}
              </span>
            </div>
            <span className="text-xl font-black text-yellow-500 drop-shadow-md">
              +{def.points.join("/")}
            </span>
          </div>

          {/* Visual Body */}
          <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-950 p-4">
            {/* Reusing your PatternPreview but scaled up */}
            <div className="scale-150 origin-center mb-6">
              <PatternPreview visual={def.visual} />
            </div>
            <p className="text-center text-slate-300 text-sm font-medium px-4 leading-snug">
              {def.desc}
            </p>
          </div>

          {/* Footer / Progress */}
          <div className="p-4 bg-black/20 border-t border-white/5">
            <div className="flex gap-2 justify-center">
              {Array.from({ length: maxSlots }).map((_, i) => (
                <div
                  key={i}
                  className={`h-3 w-full rounded-full border-2 ${
                    i < slotsFilled
                      ? "bg-emerald-500 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]"
                      : "bg-slate-800 border-slate-600"
                  }`}
                />
              ))}
            </div>
            <div className="text-center mt-2 text-xs text-slate-500 uppercase font-bold tracking-widest">
              {isComplete ? "Completed" : "In Progress"}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- RESTORE SESSION ---
  useEffect(() => {
    const savedRoomId = localStorage.getItem("equilibrium_roomId");
    if (savedRoomId) {
      setRoomId(savedRoomId);
    }
  }, []);

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
        const savedName = localStorage.getItem("gameHub_playerName");
        if (savedName) setPlayerName(savedName);
        setViewingPlayerId(u.uid);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "game_hub_settings", "config"),
      (doc) => {
        if (doc.exists() && doc.data()[GAME_ID]?.maintenance)
          setIsMaintenance(true);
        else setIsMaintenance(false);
      },
      (err) => console.log("Config Read Error (Safe to ignore):", err),
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!roomId || !user) return;
    const roomRef = doc(
      db,
      "artifacts",
      APP_ID,
      "public",
      "data",
      "rooms",
      roomId,
    );
    const unsub = onSnapshot(
      roomRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (!data.players.some((p) => p.id === user.uid)) {
            // Player kicked or invalid session
            setRoomId("");
            localStorage.removeItem("equilibrium_roomId");
            setView("menu");
            setError("You were removed from the world.");
            return;
          }
          setGameState(data);
          if (data.status === "playing" || data.status === "finished")
            setView("game");
          else if (data.status === "lobby") setView("lobby");
        } else {
          setView("menu");
          setRoomId("");
          localStorage.removeItem("equilibrium_roomId");
          setError("Voyage ended.");
        }
      },
      (err) => {
        console.error(err);
        setError("Connection lost.");
      },
    );
    return () => unsub();
  }, [roomId, user]);

  useEffect(() => {
    if (!gameState?.logs || gameState.logs.length === 0) return;
    const latestLog = gameState.logs[gameState.logs.length - 1];
    if (lastLogIdRef.current === null) {
      lastLogIdRef.current = latestLog.id;
      return;
    }
    if (latestLog.id <= lastLogIdRef.current) return;
    lastLogIdRef.current = latestLog.id;
    if (latestLog.type === "success") {
      setFeedback({
        type: "success",
        message: "HARMONY!",
        subtext: latestLog.text,
        icon: Sparkles,
      });
      setTimeout(() => setFeedback(null), 2500);
    } else if (latestLog.type === "warning") {
      setFeedback({
        type: "warning",
        message: "ATTENTION",
        subtext: latestLog.text,
        icon: AlertTriangle,
      });
      setTimeout(() => setFeedback(null), 2500);
    } else if (latestLog.type === "failure") {
      setFeedback({
        type: "failure",
        message: "PENALTY",
        subtext: latestLog.text,
        icon: AlertTriangle,
      });
      setTimeout(() => setFeedback(null), 2500);
    }
  }, [gameState?.logs]);

  const createRoom = async () => {
    if (!playerName) return setError("Enter Name");
    localStorage.setItem("gameHub_playerName", playerName);
    setLoading(true);
    const chars = "123456789ABCDEFGHIJKLMNPQRSTUVWXYZ";
    let newId = "";
    for (let i = 0; i < 6; i++) {
      newId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const initialBag = CREATE_BAG();
    const initialAnimalDeck = CREATE_ANIMAL_DECK();
    const { market, bag } = REFILL_MARKET([], initialBag);
    const animalFill = REFILL_ANIMAL_MARKET([], initialAnimalDeck);
    const initialData = {
      roomId: newId,
      hostId: user.uid,
      status: "lobby",
      players: [
        {
          id: user.uid,
          name: playerName,
          score: 0,
          penalties: 0, // <--- ADD THIS
          landscapeScore: 0,
          landscapeScoreBreakdown: {
            trees: 0,
            mountains: 0,
            fields: 0,
            rivers: 0,
            buildings: 0,
          },
          board: GENERATE_HEX_GRID(),
          holding: [],
          animals: [],
          ready: true,
          hasDraftedTokens: false,
          hasDraftedAnimal: false,
        },
      ],
      market,
      bag,
      animalMarket: animalFill.market,
      animalDeck: animalFill.deck,
      turnIndex: 0,
      startPlayerIndex: 0, // Will be randomized on start
      isLastRound: false, // Trigger for end game
      turnPhase: "PLAY",
      logs: [],
      winnerId: null,
    };
    try {
      await setDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", newId),
        initialData,
      );
      setRoomId(newId);
      localStorage.setItem("equilibrium_roomId", newId); // Save Session
      setViewingPlayerId(user.uid);
    } catch (e) {
      console.error(e);
      setError("Failed to create world.");
    }
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!roomCode || !playerName) return setError("Enter details");
    localStorage.setItem("gameHub_playerName", playerName);
    setLoading(true);
    try {
      const code = roomCode.toUpperCase().trim();
      const ref = doc(db, "artifacts", APP_ID, "public", "data", "rooms", code);
      const snap = await getDoc(ref);
      if (snap.exists() && snap.data().status === "lobby") {
        const data = snap.data();
        if (!data.players.some((p) => p.id === user.uid)) {
          if (data.players.length >= 4) {
            setError("World is full.");
            setLoading(false);
            return;
          }
          const newPlayers = [
            ...data.players,
            {
              id: user.uid,
              name: playerName,
              score: 0,
              penalties: 0, // <--- ADD THIS
              landscapeScore: 0,
              landscapeScoreBreakdown: {
                trees: 0,
                mountains: 0,
                fields: 0,
                rivers: 0,
                buildings: 0,
              },
              board: GENERATE_HEX_GRID(),
              holding: [],
              animals: [],
              hasDraftedTokens: false,
              hasDraftedAnimal: false,
            },
          ];
          await updateDoc(ref, { players: newPlayers });
        }
        setRoomId(code);
        localStorage.setItem("equilibrium_roomId", code); // Save Session
        setViewingPlayerId(user.uid);
      } else {
        setError("Room not found or in progress");
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const startGame = async () => {
    // --- ADD THIS LOGIC ---
    const playerCount = gameState.players.length;
    const randomStartIndex = Math.floor(Math.random() * playerCount);
    const starterName = gameState.players[randomStartIndex].name;
    // ----------------------
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "playing",
        // --- ADD THESE UPDATES ---
        turnIndex: randomStartIndex,
        startPlayerIndex: randomStartIndex,
        isLastRound: false,
        // -------------------------
        logs: arrayUnion({
          text: "The ecosystem awakens.",
          type: "neutral",
          id: Date.now(),
        }),
      },
    );
  };

  //   const toggleReady = async () => {
  //     if (!gameState) return;
  //     const players = [...gameState.players];
  //     const me = players.find((p) => p.id === user.uid);
  //     if (me) {
  //       me.ready = !me.ready;
  //       await updateDoc(
  //         doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
  //         { players },
  //       );
  //     }
  //   };

  const handleLeave = async () => {
    if (!roomId) return;
    try {
      const ref = doc(
        db,
        "artifacts",
        APP_ID,
        "public",
        "data",
        "rooms",
        roomId,
      );
      if (gameState.hostId === user.uid) await deleteDoc(ref);
      else {
        const newPlayers = gameState.players.filter((p) => p.id !== user.uid);
        await updateDoc(ref, { players: newPlayers });
      }
    } catch (e) {
      console.log("Room gone");
    }

    localStorage.removeItem("equilibrium_roomId"); // Clear Session
    setRoomId("");
    setView("menu");
    setShowLeaveConfirm(false);
    setGameState(null);
  };

  // ... inside Equilibrium component ...

  const kickPlayer = async (targetId) => {
    if (!gameState || gameState.hostId !== user.uid) return;

    try {
      const newPlayers = gameState.players.filter((p) => p.id !== targetId);

      // Update the room without the kicked player
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players: newPlayers,
          // Optional: Add a log entry
          logs: arrayUnion({
            text: "A player was removed from the world.",
            type: "warning",
            id: Date.now(),
          }),
        },
      );
    } catch (e) {
      console.error("Error kicking player:", e);
    }
  };

  // ... rest of component ...

  const returnToLobby = async () => {
    if (gameState.hostId !== user.uid) return;
    const initialBag = CREATE_BAG();
    const initialAnimalDeck = CREATE_ANIMAL_DECK();
    const { market, bag } = REFILL_MARKET([], initialBag);
    const animalFill = REFILL_ANIMAL_MARKET([], initialAnimalDeck);
    const players = gameState.players.map((p) => ({
      ...p,
      score: 0,
      penalties: 0, // <--- ADD THIS
      landscapeScore: 0,
      landscapeScoreBreakdown: {
        trees: 0,
        mountains: 0,
        fields: 0,
        rivers: 0,
        buildings: 0,
      },
      board: GENERATE_HEX_GRID(),
      holding: [],
      animals: [],
      ready: false,
      hasDraftedTokens: false,
      hasDraftedAnimal: false,
    }));
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "lobby",
        players,
        market,
        bag,
        animalMarket: animalFill.market,
        animalDeck: animalFill.deck,
        logs: [],
        winnerId: null,
        turnIndex: 0,
        turnPhase: "PLAY",
      },
    );
    setShowLeaveConfirm(false);
  };

  // --- NEW: SHARED PALETTE STATE ---
  const togglePalette = async (type) => {
    // 1. Optimistic Local Update
    const nextState = activePalette === type ? null : type;
    setActivePalette(nextState);

    // 2. Database Update (Fire & Forget)
    if (!gameState || !user) return;

    const pIdx = gameState.players.findIndex((p) => p.id === user.uid);
    if (pIdx === -1) return;

    const players = [...gameState.players];
    // Ensure we initialize the field if it doesn't exist
    players[pIdx].activePalette = nextState;

    try {
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        { players },
      );
    } catch (e) {
      console.error("Error syncing palette state:", e);
    }
  };

  const handleDraftToken = async (marketIdx) => {
    const pIdx = gameState.players.findIndex((p) => p.id === user.uid);
    if (gameState.turnIndex !== pIdx) return;
    const players = [...gameState.players];
    const me = players[pIdx];

    if (me.hasDraftedTokens) return;

    let market = [...gameState.market];
    let bag = [...gameState.bag];
    let isLastRound = gameState.isLastRound;
    let newLogs = []; // Temporary array for new logs

    me.holding = market[marketIdx].tokens;
    me.hasDraftedTokens = true;
    me.activePalette = null; // <--- Clear status in DB
    market.splice(marketIdx, 1);

    // REFILL LOGIC
    if (bag.length >= 3) {
      const newSlot = {
        id: Math.random().toString(36).substr(2, 9),
        tokens: [bag.pop(), bag.pop(), bag.pop()].filter(Boolean),
      };
      market.push(newSlot);
    }
    // --- NEW LOGIC: BAG EMPTY TRIGGER ---
    else if (!isLastRound) {
      // If we can't refill (bag < 3) and it wasn't already the last round:
      isLastRound = true;
      newLogs.push({
        text: "The Bag is empty! Finishing the round...",
        type: "warning",
        id: Date.now(),
      });
    }
    // ------------------------------------

    // Add the draft log
    newLogs.push({
      text: `${me.name} drafted tokens.`,
      type: "neutral",
      id: Date.now() + 1, // +1 to ensure unique ID if same ms
    });

    // Merge new logs with existing
    const updatedLogs = gameState.logs
      ? [...gameState.logs, ...newLogs]
      : newLogs;

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players,
        market,
        bag,
        isLastRound, // Save the flag
        logs: updatedLogs,
      },
    );
    setActivePalette(null);
  };

  const handleDraftAnimal = async (animalIdx) => {
    const pIdx = gameState.players.findIndex((p) => p.id === user.uid);
    if (gameState.turnIndex !== pIdx) return;
    const players = [...gameState.players];
    const me = players[pIdx];

    if (me.hasDraftedAnimal) return; // Already took animal

    const incompleteAnimals = me.animals.filter(
      (a) => a.slotsFilled < a.maxSlots,
    );
    if (incompleteAnimals.length >= 4) return;

    let animalMarket = [...gameState.animalMarket];
    let animalDeck = [...gameState.animalDeck];

    const card = animalMarket[animalIdx];
    const def = ANIMALS[card.type];

    me.animals.push({ ...card, slotsFilled: 0, maxSlots: def.slots });
    me.hasDraftedAnimal = true;
    me.activePalette = null; // <--- Clear status in DB
    animalMarket.splice(animalIdx, 1);

    // IMMEDIATE REFILL
    if (animalDeck.length > 0) {
      const newCard = {
        id: Math.random().toString(36).substr(2, 9),
        type: animalDeck.pop(),
      };
      animalMarket.push(newCard);
    }

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players,
        animalMarket,
        animalDeck,
        logs: arrayUnion({
          text: `${me.name} adopted a ${def.name}.`,
          type: "neutral",
          id: Date.now(),
        }),
      },
    );
    setActivePalette(null);
  };

  const handlePlace = async (q, r) => {
    try {
      const pIdx = gameState.players.findIndex((p) => p.id === user.uid);
      if (gameState.turnIndex !== pIdx) return;
      const players = [...gameState.players];
      const me = players[pIdx];
      const updates = { players };

      // Token Placement
      if (selectedHoldingIdx !== null && me.holding[selectedHoldingIdx]) {
        const cellKey = `${q},${r}`;
        const cell = me.board[cellKey];
        const token = me.holding[selectedHoldingIdx];

        if (!isValidPlacement(cell, token)) return;

        cell.stack.push(token);
        me.holding.splice(selectedHoldingIdx, 1);
        setSelectedHoldingIdx(null);

        // Recalculate score
        const ls = calculateLandscapeScore(me.board);
        me.landscapeScore = ls.total;
        me.landscapeScoreBreakdown = ls.breakdown;

        // Check for Board Fullness (Game ends if a player has no empty hexes left, regardless of height)
        const hasEmptySpace = Object.values(me.board).some(
          (c) => c.stack.length === 0,
        );
        // --- REPLACE THE GAME OVER BLOCK WITH THIS ---
        if (!hasEmptySpace && !gameState.isLastRound) {
          updates.isLastRound = true; // Mark that we are in the endgame

          if (!updates.logs) updates.logs = [];
          updates.logs.push({
            text: `${me.name}'s world is full! Finishing the round...`,
            type: "warning",
            id: Date.now(),
          });
        }
        // ---------------------------------------------

        await updateDoc(
          doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
          updates,
        );
        return;
      }

      // Animal Placement
      if (selectedAnimalIdx !== null && me.animals[selectedAnimalIdx]) {
        const card = me.animals[selectedAnimalIdx];
        const def = ANIMALS[card.type];
        if (!def) {
          console.error("Animal definition missing for type:", card.type);
          return;
        }

        const cell = me.board[`${q},${r}`];

        if (
          !cell.animal &&
          card.slotsFilled < card.maxSlots &&
          def.check(cell, me.board)
        ) {
          cell.animal = card.type;

          // Variable Scoring based on slot index
          const pointsForThisSlot = def.points[card.slotsFilled];
          card.slotsFilled += 1;
          me.score += pointsForThisSlot;

          setSelectedAnimalIdx(null);

          if (!updates.logs) updates.logs = [];
          updates.logs.push({
            text: `${me.name} placed a ${def.name} (+${pointsForThisSlot})!`,
            type: "success",
            id: Date.now(),
          });

          await updateDoc(
            doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
            updates,
          );
        }
      }
    } catch (err) {
      console.error("Placement error:", err);
      setError("Something went wrong with placement. Try refreshing.");
    }
  };

  const handleDiscard = async () => {
    const pIdx = gameState.players.findIndex((p) => p.id === user.uid);
    if (gameState.turnIndex !== pIdx) return;
    const players = [...gameState.players];
    const me = players[pIdx];
    if (selectedHoldingIdx === null || !me.holding[selectedHoldingIdx]) return;

    me.holding.splice(selectedHoldingIdx, 1);
    // Instead of subtracting from score, we increment penalties
    me.penalties = (me.penalties || 0) + 1;
    // --- CHANGED LOGIC END ---
    setSelectedHoldingIdx(null);

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players,
        logs: arrayUnion({
          text: `${me.name} discarded a token (-2 pts).`,
          type: "failure",
          id: Date.now(),
        }),
      },
    );
  };

  const handleEndTurn = async () => {
    const pIdx = gameState.players.findIndex((p) => p.id === user.uid);
    if (gameState.turnIndex !== pIdx) return;
    const players = [...gameState.players];
    const me = players[pIdx];

    // 1. Validation
    if (me.holding.length > 0) {
      setFeedback({
        type: "warning",
        message: "Place Tokens",
        subtext: "You must place or discard all tokens.",
      });
      setTimeout(() => setFeedback(null), 2000);
      return;
    }

    // Allow ending turn if market is empty, even if we didn't draft
    if (!me.hasDraftedTokens && gameState.market.length > 0) {
      setFeedback({
        type: "warning",
        message: "Draft Tokens",
        subtext: "You must take tokens from the market.",
      });
      setTimeout(() => setFeedback(null), 2000);
      return;
    }

    me.hasDraftedTokens = false;
    me.hasDraftedAnimal = false;

    const updates = { players };
    const nextIndex = (gameState.turnIndex + 1) % gameState.players.length;

    // 2. CHECK FOR GAME OVER
    // Condition A: Sudden Death (Market is physically empty - cannot play)
    if (gameState.market.length === 0 && gameState.bag.length === 0) {
      updates.status = "finished";
      updates.logs = arrayUnion({
        text: "Market exhausted. Game Over!",
        type: "warning",
        id: Date.now(),
      });
    }
    // Condition B: Last Round Flag is TRUE and we reached the Start Player
    else if (
      gameState.isLastRound &&
      nextIndex === gameState.startPlayerIndex
    ) {
      updates.status = "finished";
      updates.logs = arrayUnion({
        text: "Round complete. Game Over!",
        type: "neutral",
        id: Date.now(),
      });
    }
    // 3. PASS TURN
    else {
      updates.turnIndex = nextIndex;
      updates.logs = arrayUnion({
        text: `Turn passed to ${gameState.players[nextIndex].name}.`,
        type: "neutral",
        id: Date.now(),
      });
    }

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      updates,
    );
  };

  const copyToClipboard = () => {
    const textToCopy = gameState.roomId;

    // Logic to show the popup and hide it after 2 seconds
    const handleSuccess = () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);

      // Keep your existing global feedback if needed
      if (triggerFeedback)
        triggerFeedback("neutral", "COPIED!", "", CheckCircle);
    };

    try {
      navigator.clipboard.writeText(textToCopy);
      handleSuccess();
    } catch (e) {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = textToCopy;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      handleSuccess();
    }
  };

  const checkViewAndWarn = () => {
    const pIdx = gameState.players.findIndex((p) => p.id === user.uid);
    const isTurn = gameState.turnIndex === pIdx;
    if (isTurn && viewingPlayerId !== user.uid) {
      setFeedback({
        type: "warning",
        message: "WRONG WORLD",
        subtext: "Return to your world to make moves.",
        icon: Eye,
      });
      setTimeout(() => setFeedback(null), 2000);
      return false;
    }
    return true;
  };

  // --- RENDERERS ---

  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <GameLogoBig />
        <div className="bg-orange-500/10 p-8 rounded-2xl border border-orange-500/30">
          <Hammer
            size={64}
            className="text-orange-500 mx-auto mb-4 animate-bounce"
          />
          <h1 className="text-3xl font-bold mb-2">Under Maintenance</h1>
          <p className="text-gray-400">
            Meteor impact detected! We're busy repairing the ecosystem.
          </p>
        </div>
        <div className="h-8"></div>
        <a href="https://rawfidkshuvo.github.io/gamehub/">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-center pb-12 animate-pulse">
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900/50 rounded-full border border-indigo-500/20 text-indigo-300 font-bold tracking-widest text-sm uppercase backdrop-blur-sm">
                <Sparkles size={16} /> Visit Gamehub...Try our other releases...{" "}
                <Sparkles size={16} />
              </div>
            </div>
          </div>
        </a>
        <GameLogo />
      </div>
    );
  }

  if (!user)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500 animate-pulse">
        Returning to the wild...
      </div>
    );

  // RECONNECTING STATE
  if (roomId && !gameState && !error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <GlobalStyles />
        <FloatingBackground />
        <div className="bg-slate-900/80 backdrop-blur p-8 rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
          <Loader size={48} className="text-emerald-500 animate-spin" />
          <div className="text-center">
            <h2 className="text-xl font-bold">Reconnecting...</h2>
            <p className="text-slate-400 text-sm">Resuming your session</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === "menu")
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
        <GlobalStyles />
        <FloatingBackground />
        {showGuide && <RulesModal onClose={() => setShowGuide(false)} />}
        <div className="z-10 text-center mb-10 animate-in fade-in zoom-in duration-700">
          <Hexagon
            size={64}
            className="text-emerald-400 mx-auto mb-4 animate-spin-slow"
          />
          <h1 className="text-5xl md:text-7xl font-thin text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 to-teal-600 tracking-tighter drop-shadow-md">
            EQUILIBRIUM
          </h1>
          <p className="text-emerald-200/40 tracking-[0.5em] uppercase mt-2 text-xs">
            Build. Balance. Score.
          </p>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-md border border-emerald-500/30 p-8 rounded-2xl w-full max-w-md shadow-2xl z-10 relative">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 mb-4 rounded text-center text-sm font-bold flex items-center justify-center gap-2">
              <AlertTriangle size={16} /> {error}
            </div>
          )}
          <div className="space-y-4">
            <input
              className="w-full bg-black/50 border border-emerald-700 focus:border-emerald-500 p-4 rounded-xl text-white outline-none transition-all text-lg font-bold text-center"
              placeholder="YOUR NAME"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={12}
            />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={createRoom}
                disabled={loading}
                className="bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-lg shadow-emerald-900/50"
              >
                <Earth size={24} />
                <span>Create</span>
              </button>
              <div className="flex flex-col gap-2">
                <input
                  className="bg-black/50 border border-emerald-700 focus:border-emerald-500 p-2 rounded-xl text-white text-center uppercase font-mono font-bold tracking-widest outline-none h-12"
                  placeholder="CODE"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  maxLength={6}
                />
                <button
                  onClick={joinRoom}
                  disabled={loading}
                  className="bg-slate-800 hover:bg-slate-700 p-2 rounded-xl font-bold text-slate-300 transition-all active:scale-95 h-full"
                >
                  Penetrate
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowGuide(true)}
              className="w-full mt-4 text-emerald-400 hover:text-emerald-300 text-sm font-bold flex items-center justify-center gap-2 transition-colors py-2"
            >
              <BookOpen size={16} /> Architect's Guide
            </button>
          </div>
        </div>
        <div className="absolute bottom-4 text-slate-600 text-xs text-center">
          Inspired by Harmonies. A tribute game.
          <br />
          Developed by <strong>RAWFID K SHUVO</strong>. Visit{" "}
          <a
            href="https://rawfidkshuvo.github.io/gamehub/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-500 underline hover:text-emerald-600"
          >
            GAMEHUB
          </a>{" "}
          for more games.
        </div>
      </div>
    );

  if (view === "lobby" && gameState) {
    const isHost = gameState.hostId === user.uid;
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative">
        <GlobalStyles />
        <FloatingBackground />
        <GameLogoBig />
        {showGuide && <RulesModal onClose={() => setShowGuide(false)} />}
        <div className="z-10 w-full max-w-lg bg-slate-900/90 backdrop-blur p-8 rounded-2xl border border-emerald-500/30 shadow-2xl animate-in slide-in-from-bottom-8">
          <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
            <div>
              <h2 className="text-lg md:text-xl text-emerald-500 font-bold uppercase">
                New World:
              </h2>

              {/* Flex container to align ID and Button side-by-side */}
              <div className="flex items-center gap-3 mt-1">
                <div className="text-2xl md:text-3xl font-mono text-white font-black">
                  {roomId}
                </div>

                {/* 2. Container set to relative for positioning the popup */}
                <div className="relative">
                  <button
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                  >
                    {/* Optional: Change icon to checkmark when copied */}
                    {isCopied ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>

                  {/* 3. The Copied Popup */}
                  {isCopied && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-emerald-500 text-black text-xs font-bold px-2 py-1 rounded shadow-lg animate-fade-in-up whitespace-nowrap">
                      Copied!
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowGuide(true)}
                className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              >
                <BookOpen size={20} />
              </button>
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="p-2 hover:bg-red-900/30 rounded text-red-400"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
          <div className="space-y-3 mb-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Architects ({gameState.players.length}/4)
            </h3>
            {gameState.players.map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700"
              >
                <span className="font-bold flex items-center gap-3 text-lg">
                  {p.name}
                  {p.id === gameState.hostId && (
                    <Crown size={16} className="text-yellow-500" />
                  )}
                </span>

                {/* --- KICK BUTTON START --- */}
                {gameState.hostId === user.uid && p.id !== user.uid && (
                  <button
                    onClick={() => kickPlayer(p.id)}
                    className="p-2 bg-red-900/20 hover:bg-red-900/50 text-red-500 rounded-lg transition-colors border border-red-900/30"
                    title="Kick Player"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                {/* --- KICK BUTTON END --- */}
              </div>
            ))}
            {Array.from({ length: 4 - gameState.players.length }).map(
              (_, i) => (
                <div
                  key={i}
                  className="border-2 border-dashed border-slate-700 rounded-xl p-4 flex items-center justify-center text-slate-600 font-bold uppercase text-sm"
                >
                  Empty Slot
                </div>
              ),
            )}
          </div>
          {/* --- HOST CONTROLS --- */}
          {/* --- HOST CONTROLS (Solo Play Fixed) --- */}
          {isHost && (
            <div className="mt-8 flex flex-col items-center gap-2">
              <button
                onClick={startGame}
                // CHECK 1: Ensure this is < 1 (Controls clickability)
                disabled={gameState.players.length < 1}
                className={`
                  px-8 py-3 rounded-xl font-bold text-lg shadow-lg transition-all
                  ${
                    // CHECK 2: Ensure this is < 1 (Controls visual style)
                    gameState.players.length < 1
                      ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                      : "bg-emerald-500 text-slate-900 hover:bg-emerald-400 hover:scale-105 hover:shadow-emerald-500/20"
                  }
                `}
              >
                {/* CHECK 3: Ensure this is < 1 (Controls the text you see) */}
                {gameState.players.length < 1
                  ? "Waiting for Architects..."
                  : "CREATE WORLD"}
              </button>

              {/* Helper Message */}
              {gameState.players.length < 1 && (
                <p className="text-slate-600 text-xs uppercase tracking-widest font-bold">
                  Need 1+ player
                </p>
              )}
            </div>
          )}

          {/* --- NON-HOST MESSAGE --- */}
          {!isHost && (
            // CHANGED: Added 'text-sm' and 'font-bold' for a cleaner look
            <div className="mt-8 text-center text-slate-500 text-sm font-bold uppercase tracking-widest animate-pulse">
              Waiting for host to start...
            </div>
          )}
        </div>
        {showLeaveConfirm && (
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl max-w-xs w-full text-center">
              <h3 className="text-xl font-bold text-white mb-2 uppercase">
                Leave World?
              </h3>
              <p className="text-slate-400 mb-6 text-sm">
                {gameState.hostId === user.uid
                  ? "As Host, leaving ends the game for everyone."
                  : "You will leave this session."}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 bg-slate-800 py-2 rounded font-bold text-slate-300"
                >
                  Stay
                </button>
                <button
                  onClick={handleLeave}
                  className="flex-1 bg-red-600 py-2 rounded font-bold text-white"
                >
                  Leave
                </button>
              </div>
            </div>
          </div>
        )}
        <GameLogo />
      </div>
    );
  }

  if (view === "game" && gameState) {
    const pIdx = gameState.players.findIndex((p) => p.id === user.uid);
    const me = gameState.players[pIdx];
    const isMyTurn = gameState.turnIndex === pIdx;
    const viewingPlayer =
      gameState.players.find((p) => p.id === viewingPlayerId) || me;

    const canEndTurn =
      isMyTurn && me.hasDraftedTokens && me.holding.length === 0;

    return (
      <div className="fixed inset-0 bg-slate-950 text-white flex flex-col overflow-hidden font-sans select-none">
        <GlobalStyles />
        <FloatingBackground />
        <ZoomCardOverlay />
        {feedback && (
          <FeedbackOverlay
            type={feedback.type}
            message={feedback.message}
            subtext={feedback.subtext}
            icon={feedback.icon}
          />
        )}
        {showGuide && <RulesModal onClose={() => setShowGuide(false)} />}
        {showScoreboard && (
          <ScoreboardModal
            gameState={gameState}
            onClose={() => setShowScoreboard(false)}
          />
        )}
        {inspectedAnimal && (
          <AnimalDetailModal
            animal={inspectedAnimal}
            onClose={() => setInspectedAnimal(null)}
          />
        )}

        <div className="h-14 md:h-16 bg-slate-900 border-b border-emerald-900/30 flex items-center justify-between px-2 z-50 shrink-0 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-900/50 rounded-lg flex items-center justify-center border border-emerald-700">
              <Hexagon className="text-emerald-400" size={20} />
            </div>
            <div>
              <div className="font-bold text-sm tracking-wider text-emerald-100">
                EQUILIBRIUM
              </div>
              <div className="text-[10px] text-emerald-400 font-mono uppercase">
                {gameState.status === "finished"
                  ? "GAME OVER"
                  : `Turn: ${gameState.players[gameState.turnIndex].name}`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowScoreboard(true)}
              className="p-2 hover:bg-slate-800 rounded text-yellow-500 hover:text-white"
            >
              <BarChart2 size={18} />
            </button>
            <button
              onClick={() => setShowGuide(true)}
              className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            >
              <BookOpen size={18} />
            </button>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className={`p-2 rounded-full ${
                showLogs
                  ? "bg-emerald-900 text-emerald-400"
                  : "text-gray-400 hover:bg-gray-800"
              }`}
            >
              <History size={18} />
            </button>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 hover:bg-red-900/30 rounded text-red-400"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {showLogs && (
          <div className="fixed top-16 right-4 w-64 max-h-60 bg-slate-900/95 border border-slate-700 rounded-xl z-[155] overflow-y-auto p-2 shadow-2xl custom-scrollbar">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 sticky top-0 bg-slate-900/95 py-2">
              World History
            </h4>
            <div className="space-y-2">
              {gameState.logs
                .slice()
                .reverse()
                .map((log) => (
                  <div
                    key={log.id}
                    className={`text-xs p-2 rounded border-l-2 ${log.type === "success" ? "border-emerald-500 bg-emerald-900/10" : log.type === "warning" ? "border-amber-500 bg-amber-900/10" : log.type === "failure" ? "border-red-500 bg-red-900/10" : "border-slate-500 bg-slate-800/30"}`}
                  >
                    {log.text}
                  </div>
                ))}
            </div>
          </div>
        )}

        {showLeaveConfirm && (
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl max-w-xs w-full text-center">
              <h3 className="text-xl font-bold text-white mb-2 uppercase">
                Leave World?
              </h3>
              <p className="text-slate-400 mb-6 text-sm">
                {gameState.hostId === user.uid
                  ? "As Host, leaving ends the game for everyone."
                  : "You will leave this session."}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 bg-slate-800 py-2 rounded font-bold text-slate-300"
                >
                  Stay
                </button>
                <button
                  onClick={handleLeave}
                  className="flex-1 bg-red-600 py-2 rounded font-bold text-white"
                >
                  Leave
                </button>
              </div>
              {gameState.hostId === user.uid && (
                <button
                  onClick={returnToLobby}
                  className="w-full bg-slate-700 hover:bg-slate-600 py-2 rounded font-bold text-emerald-400 mt-2 text-sm"
                >
                  Return All to Lobby
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 relative bg-transparent overflow-hidden flex flex-col items-center justify-center">
          {/* OPPONENT TABS */}
          <div className="absolute top-2 md:top-4 left-0 right-0 z-10 grid grid-cols-4 gap-1 px-2 w-full max-w-2xl mx-auto pointer-events-auto">
            {gameState.players.map((p, i) => {
              const isTurn = gameState.turnIndex === i;
              const totalScore =
                (p.score || 0) +
                (p.landscapeScore || 0) -
                (p.penalties || 0) * 2;

              return (
                <button
                  key={p.id}
                  onClick={() => setViewingPlayerId(p.id)}
                  className={`
          relative overflow-visible
          flex flex-col items-center justify-center h-12 md:h-14 rounded-xl border-2 transition-all w-full
          ${
            viewingPlayerId === p.id
              ? "bg-slate-800 border-emerald-500 shadow-lg scale-105 z-10"
              : "bg-slate-900/80 border-slate-700 hover:bg-slate-800/80 text-slate-400"
          }
        `}
                >
                  {/* --- NEW: LIVE ACTIVITY INDICATORS --- */}
                  {/* If viewing Tokens: Cyan Circle */}
                  {p.activePalette === "TOKENS" && (
                    <div className="absolute -top-1 -right-1 bg-slate-900 rounded-full p-1 border border-cyan-500 shadow-lg z-20 animate-pulse">
                      <Circle
                        size={10}
                        className="text-cyan-400 fill-cyan-400/20"
                      />
                    </div>
                  )}
                  {/* If viewing Animals: Orange Paw */}
                  {p.activePalette === "ANIMALS" && (
                    <div className="absolute -top-1 -right-1 bg-slate-900 rounded-full p-1 border border-orange-500 shadow-lg z-20 animate-pulse">
                      <PawPrint
                        size={10}
                        className="text-orange-400 fill-orange-400/20"
                      />
                    </div>
                  )}
                  {/* ----------------------------------- */}

                  {isTurn && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                      <div className="flex flex-col items-center animate-bounce-slight">
                        <div className="bg-emerald-500 text-slate-900 text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] flex items-center gap-1 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse" />
                          PLAYING
                        </div>
                        <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-emerald-500 -mt-[1px]"></div>
                      </div>
                    </div>
                  )}

                  <span
                    className={`text-[9px] md:text-[10px] font-bold uppercase truncate max-w-full px-1 ${
                      isTurn ? "text-emerald-400" : ""
                    }`}
                  >
                    {p.name}
                  </span>
                  <span className="text-[10px] md:text-xs font-black text-yellow-500">
                    {totalScore}
                  </span>
                </button>
              );
            })}
          </div>

          {viewingPlayer.id !== user.uid ? (
            <div className="absolute top-20 bg-red-800/80 px-4 py-1 rounded-full text-xs font-bold text-slate-300 flex items-center gap-2 z-10 backdrop-blur animate-pulse">
              <Eye size={12} /> {viewingPlayer.name}'s World
            </div>
          ) : (
            <div className="absolute top-20 bg-green-800/80 px-4 py-1 rounded-full text-xs font-bold text-slate-300 flex items-center gap-2 z-10 backdrop-blur animate-pulse">
              <Eye size={12} /> Your World
            </div>
          )}

          {/* BOARD */}
          <div className="relative w-[340px] h-[300px] transition-transform -mt-20 md:-mt-24 transform scale-100 md:scale-125">
            {Object.values(viewingPlayer.board).map((cell) => {
              let isAnimalTarget = false;
              if (selectedAnimalIdx !== null && me.animals[selectedAnimalIdx]) {
                const def = ANIMALS[me.animals[selectedAnimalIdx].type];
                if (
                  def &&
                  !cell.animal &&
                  me.animals[selectedAnimalIdx].slotsFilled <
                    me.animals[selectedAnimalIdx].maxSlots
                ) {
                  isAnimalTarget = def.check(cell, viewingPlayer.board);
                }
              }

              return (
                <HexTile
                  key={`${cell.q},${cell.r}`}
                  {...cell}
                  isPlaceable={
                    isMyTurn &&
                    viewingPlayer.id === user.uid &&
                    ((selectedHoldingIdx !== null &&
                      me.holding[selectedHoldingIdx] &&
                      isValidPlacement(cell, me.holding[selectedHoldingIdx])) ||
                      isAnimalTarget)
                  }
                  ghostToken={
                    selectedHoldingIdx !== null
                      ? me.holding[selectedHoldingIdx]
                      : null
                  }
                  ghostAnimal={
                    selectedAnimalIdx !== null
                      ? me.animals[selectedAnimalIdx].type
                      : null
                  }
                  isValidTarget={isAnimalTarget}
                  onClick={
                    viewingPlayer.id === user.uid ? handlePlace : undefined
                  }
                />
              );
            })}
          </div>

          {/* --- DRAFTING PALETTE OVERLAY (Colored Inactive State) --- */}
          {activePalette && (
            <div
              className="absolute bottom-0 left-0 right-0 z-[60] h-44 bg-slate-900/95 border-t-2 border-emerald-500/50 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom-full duration-300 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER */}
              <div className="flex justify-between items-center px-4 h-8 border-b border-white/10 bg-black/20 shrink-0">
                <div className="flex items-center gap-2">
                  {activePalette === "TOKENS" ? (
                    <Circle className="text-cyan-400" size={14} />
                  ) : (
                    <PawPrint className="text-orange-400" size={14} />
                  )}
                  <h3 className="text-xs font-black text-white uppercase tracking-widest leading-none">
                    Draft {activePalette === "TOKENS" ? "Tokens" : "Animal"}
                  </h3>
                </div>

                <button
                  onClick={() => togglePalette(activePalette)} // <--- UPDATED (Toggles it off)
                  className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white transition-colors border border-slate-600 font-bold text-[10px]"
                >
                  <span>Close</span>
                  <X size={12} />
                </button>
              </div>

              {/* CONTENT SCROLLER */}
              <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 no-scrollbar flex items-center bg-gradient-to-b from-transparent to-black/30">
                <div className="flex gap-4 items-center min-w-max h-full justify-center">
                  {/* --- OPTION A: TOKEN MARKET (Vertical Capsules) --- */}
                  {activePalette === "TOKENS" &&
                    gameState.market.map((slot, idx) => (
                      <button
                        key={slot.id}
                        onClick={() => handleDraftToken(idx)}
                        disabled={!isMyTurn || me.hasDraftedTokens}
                        // CHANGED: Removed 'disabled:grayscale'. Changed 'disabled:opacity-50' to 'disabled:opacity-40'
                        className="relative group h-32 w-14 shrink-0 rounded-full transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {/* The Capsule Body */}
                        <div className="absolute inset-0 bg-slate-800 rounded-full border-4 border-slate-700 shadow-xl group-hover:border-cyan-500 group-hover:bg-slate-750 transition-colors flex flex-col items-center justify-evenly py-1">
                          {/* Inner Dark Track */}
                          <div className="absolute inset-x-2 top-2 bottom-2 bg-black/30 rounded-full border border-white/5"></div>

                          {/* The 3 Tokens Stacked Vertically */}
                          <div className="relative z-10 flex flex-col gap-1.5 h-full justify-center">
                            {slot.tokens.map((t, i) => {
                              const T = TOKEN_TYPES[t];
                              return (
                                <div
                                  key={i}
                                  className={`w-8 h-8 rounded-full border-2 shadow-lg flex items-center justify-center ${T.color} ${T.border}`}
                                >
                                  <T.icon size={14} className="text-white/90" />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Hover "GET" Action */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <div className="bg-cyan-600 text-white text-[10px] font-bold px-2 py-3 rounded-xl shadow-lg border border-cyan-400 tracking-widest uppercase flex flex-col items-center leading-none gap-1">
                            <span>G</span>
                            <span>E</span>
                            <span>T</span>
                          </div>
                        </div>
                      </button>
                    ))}

                  {/* --- OPTION B: ANIMAL MARKET (Compact Cards) --- */}
                  {activePalette === "ANIMALS" &&
                    gameState.animalMarket.map((card, idx) => {
                      const def = ANIMALS[card.type];
                      const canDraft =
                        isMyTurn &&
                        !me.hasDraftedAnimal &&
                        me.animals.filter((a) => a.slotsFilled < a.maxSlots)
                          .length < 4;

                      // --- NEW: MARKET MATCH DETECTION ---
                      // Check if the player already has a valid pattern on their board for this market card
                      const hasPossibleMatch = Object.values(me.board).some(
                        (cell) => {
                          return !cell.animal && def.check(cell, me.board);
                        },
                      );
                      // -----------------------------------

                      return (
                        <button
                          key={card.id}
                          onClick={() => handleDraftAnimal(idx)}
                          // --- ADD THESE 4 LINES ---
                          onMouseDown={() => handleLongPressStart(card)}
                          onMouseUp={handleLongPressEnd}
                          onMouseLeave={handleLongPressEnd}
                          onTouchStart={() => handleLongPressStart(card)}
                          onTouchEnd={handleLongPressEnd}
                          onTouchMove={handleScrollCancel} // <--- Adds scroll safety
                          // -------------------------

                          disabled={!canDraft}
                          className={`
          relative w-24 h-32 shrink-0 bg-slate-800 border-2 rounded-xl flex flex-col shadow-xl text-left overflow-hidden transition-all duration-300 group
          ${
            canDraft
              ? "hover:-translate-y-1 cursor-pointer"
              : "cursor-not-allowed"
          }
          ${
            // --- UPDATED VISUAL LOGIC ---
            // If match: Green Pulse (Even if disabled)
            hasPossibleMatch
              ? "border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse z-10"
              : canDraft
                ? "border-slate-600 hover:border-orange-500 hover:shadow-[0_5px_15px_rgba(249,115,22,0.2)]"
                : "border-slate-800 opacity-60" // Only dim if no match AND disabled
          }
        `}
                        >
                          {/* Card Header */}
                          <div className="flex justify-between items-center px-2 py-1 border-b border-white/5 bg-black/20 shrink-0 h-7">
                            <span className="text-[10px] font-bold text-white truncate max-w-[50px]">
                              {def.name}
                            </span>
                            <span className="text-[10px] font-black text-yellow-500">
                              +{def.points.join("/")}
                            </span>
                          </div>

                          {/* Card Visual */}
                          <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900">
                            <div className="scale-75 origin-center">
                              <PatternPreview visual={def.visual} />
                            </div>
                          </div>

                          {/* Hover Action */}
                          {canDraft && (
                            <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-orange-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                ADOPT
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}

                  {/* Empty State */}
                  {activePalette === "ANIMALS" &&
                    gameState.animalMarket.length === 0 && (
                      <div className="w-full text-center text-slate-500 font-bold text-xs italic pr-4">
                        Empty...
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}

          {gameState.status === "finished" && (
            <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm">
              <div className="bg-slate-900 p-8 rounded-2xl border-2 border-yellow-500 text-center shadow-2xl animate-in zoom-in max-w-lg w-full m-4">
                <Trophy
                  size={64}
                  className="text-yellow-400 mx-auto mb-4 animate-bounce"
                />

                {/* --- WINNER CALCULATION & HEADER --- */}
                {(() => {
                  // 1. Helper to count total animals placed (Tie-breaker)
                  const getAnimalsPlaced = (p) =>
                    p.animals.reduce((sum, card) => sum + card.slotsFilled, 0);

                  // 2. Helper to get Net Score
                  const getNetScore = (p) =>
                    (p.score || 0) +
                    (p.landscapeScore || 0) -
                    (p.penalties || 0) * 2;

                  // 3. Sort Players
                  const sortedPlayers = [...gameState.players].sort((a, b) => {
                    const scoreA = getNetScore(a);
                    const scoreB = getNetScore(b);

                    // Primary Sort: Score
                    if (scoreB !== scoreA) return scoreB - scoreA;

                    // Secondary Sort: Most Animals Placed
                    const animalsA = getAnimalsPlaced(a);
                    const animalsB = getAnimalsPlaced(b);
                    return animalsB - animalsA;
                  });

                  // 4. Identify Winners (Handle Ties)
                  const topPlayer = sortedPlayers[0];
                  const topScore = getNetScore(topPlayer);
                  const topAnimals = getAnimalsPlaced(topPlayer);

                  const winners = sortedPlayers.filter(
                    (p) =>
                      getNetScore(p) === topScore &&
                      getAnimalsPlaced(p) === topAnimals,
                  );

                  return (
                    <>
                      <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 uppercase mb-2">
                        {winners.map((w) => w.name).join(" & ")}
                      </h2>
                      <p className="text-emerald-400 font-bold tracking-widest text-sm uppercase mb-6">
                        Rescued the World!
                      </p>

                      <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto custom-scrollbar text-sm">
                        {sortedPlayers.map((p, i) => {
                          const penaltyPoints = (p.penalties || 0) * 2;
                          const totalScore = getNetScore(p);
                          const isWinner = winners.some((w) => w.id === p.id);
                          const animalsPlacedCount = getAnimalsPlaced(p);

                          return (
                            <div
                              key={p.id}
                              className={`p-3 rounded-xl border flex flex-col gap-2 relative overflow-hidden transition-all
                                ${
                                  isWinner
                                    ? "bg-slate-800 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                                    : "bg-slate-800 border-slate-700 opacity-80"
                                }`}
                            >
                              {/* Winner Glow Effect */}
                              {isWinner && (
                                <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none" />
                              )}

                              <div className="flex justify-between items-center border-b border-slate-700 pb-2 relative z-10">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`font-mono font-bold ${isWinner ? "text-yellow-500" : "text-slate-500"}`}
                                  >
                                    #{i + 1}
                                  </span>
                                  <span className="font-bold text-white text-lg flex items-center gap-2">
                                    {p.name}
                                    {/* --- CROWN ICON --- */}
                                    {isWinner && (
                                      <Crown
                                        size={18}
                                        className="text-yellow-400 fill-yellow-400/20"
                                      />
                                    )}
                                  </span>
                                </div>
                                <span
                                  className={`text-2xl font-black ${isWinner ? "text-yellow-400 scale-110" : "text-slate-400"}`}
                                >
                                  {totalScore}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400 relative z-10">
                                <div className="flex justify-between">
                                  <span>Animals Placed:</span>{" "}
                                  <span className="text-white font-bold">
                                    {animalsPlacedCount}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Animal Pts:</span>{" "}
                                  <span className="text-white font-bold">
                                    {p.score}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Landscape Pts:</span>{" "}
                                  <span className="text-white font-bold">
                                    {p.landscapeScore}
                                  </span>
                                </div>

                                {/* Penalty Row */}
                                {penaltyPoints > 0 ? (
                                  <div className="flex justify-between text-red-400 font-bold">
                                    <span>Penalties:</span>{" "}
                                    <span>-{penaltyPoints}</span>
                                  </div>
                                ) : (
                                  <div className="flex justify-between text-emerald-600/50">
                                    <span>Penalties:</span> <span>0</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}

                {gameState.hostId === user.uid && (
                  <button
                    onClick={returnToLobby}
                    className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-xl font-bold w-full text-white transition-colors"
                  >
                    Return to Lobby
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* --- BOTTOM UI CONTAINER --- */}
        <div className="h-64 bg-transparent absolute bottom-0 left-0 right-0 z-40 px-2 pb-2 flex justify-between items-end pointer-events-none">
          <div className="flex gap-2 items-end w-full pointer-events-none">
            {/* --- BOTTOM LEFT: CONTROLS --- */}
            <div className="relative h-46 flex flex-col justify-end gap-2 mb-1 shrink-0 z-50 pointer-events-none items-start">
              {/* 1. TURN STATUS INDICATOR (Absolute Top of h-44 container) */}
              <div
                className={`
        absolute top-0 left-0
        pointer-events-auto
        px-3 py-1.5 rounded-full w-30 font-black text-[10px] uppercase tracking-widest shadow-lg backdrop-blur-md border animate-in slide-in-from-left-8
    ${
      isMyTurn
        ? "bg-emerald-950/90 text-emerald-300 border-emerald-400"
        : "bg-slate-800/90 text-slate-400 border-slate-600"
    }
  `}
              >
                <div className="flex items-center gap-2">
                  {isMyTurn ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse" />
                      YOUR TURN
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                      AWAIT TURN
                    </>
                  )}
                </div>
              </div>
              {/* 1. TOKEN HAND (Dynamic: Shows ME or OPPONENT based on tab) */}
              {viewingPlayer.holding.length > 0 && (
                <div
                  className={`
      w-full px-2 py-2 rounded-xl shadow-2xl flex flex-col items-center gap-2 backdrop-blur-md animate-in slide-in-from-left-4 pointer-events-auto
      ${
        viewingPlayer.id === user.uid
          ? "bg-slate-900/90 border border-emerald-500 opacity-90" // Active (My Hand)
          : "bg-slate-900/90 border border-slate-600 opacity-90" // Passive (Opponent Hand)
      }
    `}
                >
                  <span
                    className={`text-[8px] font-bold uppercase tracking-widest ${
                      viewingPlayer.id === user.uid
                        ? "text-emerald-400"
                        : "text-slate-400"
                    }`}
                  >
                    {viewingPlayer.id === user.uid ? "Placing" : "Holding"}
                  </span>

                  <div className="flex items-center gap-1">
                    {viewingPlayer.holding.map((t, i) => {
                      const T = TOKEN_TYPES[t];
                      const isMe = viewingPlayer.id === user.uid;

                      return (
                        <button
                          key={i}
                          // Click Logic: Only allow selecting if it is MY hand
                          onClick={() => {
                            if (isMe) {
                              if (!checkViewAndWarn()) return;
                              setSelectedHoldingIdx(i);
                              setSelectedAnimalIdx(null);
                            }
                          }}
                          // Visual Logic: My hand allows interaction, Opponent hand is static
                          className={`
                w-10 h-10 rounded-full border-2 shadow-lg flex items-center justify-center transition-all 
                ${T.color} ${T.border}
                ${
                  isMe
                    ? "active:scale-90 cursor-pointer hover:opacity-100 hover:scale-105"
                    : "cursor-default opacity-100"
                }
                ${
                  isMe && selectedHoldingIdx === i
                    ? "ring-4 ring-white scale-110 z-10"
                    : "opacity-90"
                }
              `}
                        >
                          <T.icon size={18} className="text-white/80" />
                        </button>
                      );
                    })}

                    {/* Trash Can: Only visible if looking at MY hand */}
                    {viewingPlayer.id === user.uid &&
                      selectedHoldingIdx !== null && (
                        <button
                          onClick={handleDiscard}
                          className="w-8 h-8 rounded-full border-2 border-red-500 bg-red-900/50 flex items-center justify-center hover:bg-red-800 transition-colors"
                          title="Discard Token (-2 pts)"
                        >
                          <Trash2 size={12} className="text-red-300" />
                        </button>
                      )}
                  </div>
                </div>
              )}

              {/* 2. END TURN BUTTON (Always visible if condition met, regardless of view) */}
              {canEndTurn && (
                <button
                  onClick={handleEndTurn}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 w-full rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm whitespace-nowrap pointer-events-auto animate-bounce"
                >
                  End Turn
                </button>
              )}

              {/* 3. PALETTE BUTTONS (Always visible) */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!checkViewAndWarn()) return;
                    togglePalette("TOKENS");
                  }}
                  className={`w-14 h-14 rounded-full border-2 shadow-xl flex items-center justify-center transition-all active:scale-90 pointer-events-auto ${
                    isMyTurn && !me.hasDraftedTokens
                      ? "bg-cyan-600 border-cyan-400 text-white animate-bounce-subtle"
                      : "bg-slate-800 border-slate-600 text-slate-500"
                  }`}
                >
                  <Circle size={24} />
                </button>
                <button
                  onClick={() => {
                    if (!checkViewAndWarn()) return;
                    togglePalette("ANIMALS");
                  }}
                  className={`w-14 h-14 rounded-full border-2 shadow-xl flex items-center justify-center transition-all active:scale-90 pointer-events-auto ${
                    isMyTurn &&
                    !me.hasDraftedAnimal &&
                    me.animals.filter((a) => a.slotsFilled < a.maxSlots)
                      .length < 4
                      ? "bg-orange-600 border-orange-400 text-white"
                      : "bg-slate-800 border-slate-600 text-slate-500"
                  }`}
                >
                  <PawPrint size={24} />
                </button>
              </div>
            </div>

            {/* --- BOTTOM RIGHT: ANIMAL HAND AREA --- */}
            {/* CHANGED: pointer-events-auto -> pointer-events-none (The scroll container acts as ghost) */}
            <div className="flex-1 flex gap-2 items-end overflow-x-auto pb-4 no-scrollbar h-60 pl-2 pointer-events-none">
              {viewingPlayer.animals.map((card, i) => {
                const def = ANIMALS[card.type];
                const isSelected =
                  i === selectedAnimalIdx && viewingPlayer.id === user.uid;
                const isComplete = card.slotsFilled >= card.maxSlots;

                // --- NEW: HAND MATCH DETECTION ---
                // Decoupled from "isMyTurn".
                // Shows hint if:
                // 1. I am looking at my own hand (viewingPlayer.id === user.uid)
                // 2. The card is not finished
                // 3. A valid pattern exists on my board
                const hasPossibleMatch =
                  viewingPlayer.id === user.uid &&
                  !isComplete &&
                  Object.values(me.board).some((cell) => {
                    return !cell.animal && def.check(cell, me.board);
                  });
                // ---------------------------------

                return (
                  <button
                    key={card.id}
                    onClick={() => {
                      if (viewingPlayer.id !== user.uid) {
                        checkViewAndWarn();
                        return;
                      }
                      setSelectedHoldingIdx(null);
                      setSelectedAnimalIdx(isSelected ? null : i);
                    }}
                    // --- ADD THESE 4 LINES ---
                    onMouseDown={() => handleLongPressStart(card)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onTouchStart={() => handleLongPressStart(card)}
                    onTouchEnd={handleLongPressEnd}
                    onTouchMove={handleScrollCancel} // <--- Adds scroll safety
                    // -------------------------
                    // CHANGED: Added pointer-events-auto so the specific card is clickable
                    className={`
          relative w-32 h-44 bg-slate-900/90 border-2 rounded-xl flex flex-col shadow-xl shrink-0 backdrop-blur-md transition-all duration-300 text-left overflow-hidden pointer-events-auto
          ${
            isSelected
              ? "border-yellow-400 ring-2 ring-yellow-500/50 scale-105 z-10 -translate-y-6"
              : "hover:-translate-y-4"
          }
          ${
            // --- NEW: HIGHLIGHT LOGIC ---
            // If match exists but not selected: Green Border + Glow + Pulse
            // Works even if not your turn
            hasPossibleMatch && !isSelected
              ? "border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse"
              : !isSelected
                ? "border-slate-600 hover:border-slate-400"
                : ""
          }
          ${isComplete ? "grayscale opacity-75 border-slate-700" : ""}
        `}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center p-2 border-b border-white/10 bg-black/20 h-10 shrink-0">
                      <div className="flex items-center gap-1">
                        <def.icon size={14} className={def.iconColor} />
                        <span className="text-xs font-bold text-white truncate max-w-[70px]">
                          {def.name}
                        </span>
                      </div>

                      {!isComplete && (
                        <span className="text-xs font-black text-yellow-500">
                          +
                          {
                            def.points[
                              Math.min(card.slotsFilled, def.points.length - 1)
                            ]
                          }
                        </span>
                      )}
                      {isComplete && (
                        <span className="text-[10px] font-bold text-emerald-500 uppercase">
                          Done
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="p-2 flex-1 flex flex-col items-center w-full min-h-0 justify-between bg-gradient-to-b from-slate-800/50 to-transparent">
                      {/* Preview Image */}
                      <div className="scale-75 origin-center shrink-0">
                        <PatternPreview visual={def.visual} />
                      </div>

                      {/* Description */}
                      <div className="text-[9px] text-slate-300 text-center leading-tight line-clamp-2 px-1 w-full break-words min-h-[24px] flex items-center justify-center font-medium">
                        {def.desc}
                      </div>

                      {/* Footer: Bars */}
                      <div className="w-full shrink-0 pt-2">
                        <div className="flex gap-1 justify-center">
                          {Array.from({ length: card.maxSlots }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-1.5 w-full rounded-full border ${
                                i < card.slotsFilled
                                  ? "bg-emerald-500 border-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.5)]"
                                  : "bg-slate-700 border-slate-600"
                              }`}
                            ></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {viewingPlayer.animals.length === 0 && (
                <div className="h-44 w-32 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center text-slate-600 text-xs text-center p-4">
                  No Animals Drafted
                </div>
              )}
            </div>
          </div>
        </div>
        <GameLogo />
      </div>
    );
  }

  return null;
}

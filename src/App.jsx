import { useState, useRef, useEffect } from "react";

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = "mft_data_v1";
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
const T = {
  pl: {
    appName: "My Fitness Tracker", appSub: "Śledź swoje postępy",
    units: "Jednostki miary", metric: "Metryczne", imperial: "Imperialne",
    language: "Język",
    welcome: "Witaj! Utwórz swój pierwszy folder",
    welcomeSub: 'np. "Masa 2026" aby rozpocząć śledzenie',
    addFolder: "Utwórz folder", folderName: "Nazwa folderu...",
    create: "Utwórz", cancel: "Anuluj",
    exercises: "Ćwiczenia", measurements: "Pomiary ciała",
    addExercise: "Dodaj ćwiczenie", exerciseName: "Nazwa ćwiczenia...",
    add: "Dodaj", delete: "Usuń", back: "Wstecz",
    addEntry: "+ Dodaj wpis", noData: "Dodaj dane, aby zobaczyć wykres",
    overallProgress: "Progres ogólny", days: "dni", lastEntry: "Ostatnio",
    deleteExercise: "Usuń ćwiczenie",
    strengthProgress: "Postęp siły", measurementProgress: "Postęp pomiarów",
    weeklyData: "Dane pomiarowe", period: "Okres",
    weekly: "Tygodniowy", custom: "Własny",
    week: "Tydzień", weekShort: "Tyg", entry: "Wpis", pickDate: "Wybierz datę",
    addMeasurement: "Dodaj pomiar", measurementName: "Nazwa pomiaru...",
    kg: "kg", lb: "lb", cm: "cm", inch: "in",
    folders: "Foldery", deleteFolder: "Usuń folder",
    defaultFolderName: "Moje wyniki",
    settings: "Ustawienia", clearData: "Wyczyść wszystkie dane",
    nickname: "Nick użytkownika", nicknamePlaceholder: "Twój nick...", nicknameHint: "Przyda się do porównywania wyników ze znajomymi", nicknameSaved: "Zapisano!",
    friendsComingSoon: "Dodawanie znajomych i porównywanie wyników — wkrótce 🚀",
    clearConfirm: "Czy na pewno chcesz usunąć wszystkie dane? Tej operacji nie można cofnąć.",
    clearYes: "Usuń wszystko", clearNo: "Anuluj",
    dataCleared: "Dane wyczyszczone",
  },
  en: {
    appName: "My Fitness Tracker", appSub: "Track your progress",
    units: "Units", metric: "Metric", imperial: "Imperial",
    language: "Language",
    welcome: "Welcome! Create your first folder",
    welcomeSub: 'e.g. "Bulk 2026" to start tracking',
    addFolder: "Create folder", folderName: "Folder name...",
    create: "Create", cancel: "Cancel",
    exercises: "Exercises", measurements: "Body Measurements",
    addExercise: "Add exercise", exerciseName: "Exercise name...",
    add: "Add", delete: "Delete", back: "Back",
    addEntry: "+ Add entry", noData: "Add data to see the chart",
    overallProgress: "Overall progress", days: "days", lastEntry: "Last",
    deleteExercise: "Delete exercise",
    strengthProgress: "Strength Progress", measurementProgress: "Measurement Progress",
    weeklyData: "Measurement data", period: "Period",
    weekly: "Weekly", custom: "Custom",
    week: "Week", weekShort: "Wk", entry: "Entry", pickDate: "Pick date",
    addMeasurement: "Add measurement", measurementName: "Measurement name...",
    kg: "kg", lb: "lb", cm: "cm", inch: "in",
    folders: "Folders", deleteFolder: "Delete folder",
    defaultFolderName: "My scores",
    settings: "Settings", clearData: "Clear all data",
    nickname: "Username", nicknamePlaceholder: "Your username...", nicknameHint: "You'll need this to compare results with friends", nicknameSaved: "Saved!",
    friendsComingSoon: "Adding friends & comparing results — coming soon 🚀",
    clearConfirm: "Are you sure you want to delete all data? This cannot be undone.",
    clearYes: "Delete everything", clearNo: "Cancel",
    dataCleared: "Data cleared",
  },
};

const COLORS = ["#FF6B35","#00D4AA","#7C6AF7","#FF3B7A","#00BFFF","#FFD700","#A8FF3E","#FF9500"];
const defaultMeasurements_pl = ["Kark","Obwód klatki","Biceps","Talia","Brzuch","Pośladki","Udo","Łydka"];
const defaultMeasurements_en = ["Neck","Chest","Bicep","Waist","Abdomen","Glutes","Thigh","Calf"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function parseDateLabel(label) {
  // expects DD.MM.YYYY
  if (!label || !label.includes(".")) return null;
  const [d, m, y] = label.split(".");
  return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
}
function calcDays(entries, period) {
  const filled = entries.filter(e => e.value !== "" && e.value !== null && e.value !== undefined);
  if (filled.length < 1) return null;
  if (period === "custom") {
    if (filled.length < 2) return 7;
    const first = parseDateLabel(filled[0].label);
    const last = parseDateLabel(filled[filled.length - 1].label);
    if (!first || !last) return null;
    return Math.max(1, Math.round((last - first) / (1000 * 60 * 60 * 24)));
  }
  // weekly: 1 entry = 7 days, 2 entries = 14 days, N entries = N*7
  return filled.length * 7;
}

const makeInitialFolders = () => [{
  id: 1, isDefault: true, name: T.pl.defaultFolderName,
  exercises: [
    { id: 10, name: "Wyciskanie sztangi", color: "#FF6B35", entries: [], period: "weekly" },
    { id: 11, name: "Martwy ciąg", color: "#00D4AA", entries: [], period: "weekly" },
  ],
  measurements: defaultMeasurements_pl.map((name, i) => ({ id: 50 + i, name, entries: [], period: "weekly" })),
}];

// ─── ICONS ────────────────────────────────────────────────────────────────────
function DumbbellIcon({ size = 26, color = "#FF6B35" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="1" y="12" width="5" height="8" rx="2.5" fill={color} opacity="0.9"/>
      <rect x="6" y="10" width="3" height="12" rx="1.5" fill={color}/>
      <rect x="9" y="14" width="14" height="4" rx="2" fill={color} opacity="0.7"/>
      <rect x="23" y="10" width="3" height="12" rx="1.5" fill={color}/>
      <rect x="26" y="12" width="5" height="8" rx="2.5" fill={color} opacity="0.9"/>
    </svg>
  );
}
function RulerIcon({ size = 26, color = "#00D4AA" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="2" y="10" width="28" height="12" rx="3" fill={color} opacity="0.15" stroke={color} strokeWidth="1.5"/>
      {[6,10,14,18,22,26].map((x,i) => (
        <line key={i} x1={x} y1="10" x2={x} y2={i%2===0?16:14} stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      ))}
    </svg>
  );
}
function CalIcon({ size = 14, color = "#7C6AF7" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <rect x="2" y="4" width="16" height="14" rx="3" stroke={color} strokeWidth="1.5"/>
      <line x1="6" y1="2" x2="6" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="14" y1="2" x2="14" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="2" y1="9" x2="18" y2="9" stroke={color} strokeWidth="1" opacity="0.5"/>
    </svg>
  );
}
function GearIcon({ size = 22, color = "#666" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
function FlagPL({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="15" fill="#fff" stroke="#ddd" strokeWidth="1"/>
      <clipPath id="cp"><circle cx="16" cy="16" r="15"/></clipPath>
      <rect x="1" y="16" width="30" height="15" fill="#DC143C" clipPath="url(#cp)"/>
    </svg>
  );
}
function FlagEN({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="15" fill="#012169" stroke="#ddd" strokeWidth="1"/>
      <clipPath id="ce"><circle cx="16" cy="16" r="15"/></clipPath>
      <g clipPath="url(#ce)">
        <line x1="1" y1="1" x2="31" y2="31" stroke="#fff" strokeWidth="5"/>
        <line x1="31" y1="1" x2="1" y2="31" stroke="#fff" strokeWidth="5"/>
        <line x1="16" y1="1" x2="16" y2="31" stroke="#fff" strokeWidth="6"/>
        <line x1="1" y1="16" x2="31" y2="16" stroke="#fff" strokeWidth="6"/>
        <line x1="1" y1="1" x2="31" y2="31" stroke="#C8102E" strokeWidth="3"/>
        <line x1="31" y1="1" x2="1" y2="31" stroke="#C8102E" strokeWidth="3"/>
        <line x1="16" y1="1" x2="16" y2="31" stroke="#C8102E" strokeWidth="4"/>
        <line x1="1" y1="16" x2="31" y2="16" stroke="#C8102E" strokeWidth="4"/>
      </g>
    </svg>
  );
}

// ─── LINE CHART ───────────────────────────────────────────────────────────────
// Min pixels per data point so chart stays readable regardless of entry count
const MIN_PT_SPACING = 56;

function LineChart({ entries, unit, t }) {
  const valid = entries.filter(e => e.value !== "" && e.value !== null && e.value !== undefined);
  if (valid.length < 1) return (
    <div style={{ height: 180, display:"flex", alignItems:"center", justifyContent:"center", color:"#444", fontSize:13 }}>
      {t.noData}
    </div>
  );

  const PAD = { top:58, right:28, bottom:32, left:46 };
  const H = 178;
  // Dynamic width: at least MIN_PT_SPACING per point, minimum 290
  const innerW = Math.max(290 - PAD.left - PAD.right, (valid.length - 1) * MIN_PT_SPACING);
  const W = innerW + PAD.left + PAD.right;
  const iH = H - PAD.top - PAD.bottom;

  const vals = valid.map(e => parseFloat(e.value));
  const minV = Math.min(...vals), maxV = Math.max(...vals), range = maxV - minV || 1;
  const px = i => PAD.left + (valid.length === 1 ? innerW / 2 : (i / (valid.length - 1)) * innerW);
  const py = v => PAD.top + iH - ((v - minV) / range) * iH;
  const pts = valid.map((e, i) => ({ x: px(i), y: py(parseFloat(e.value)), val: e.value, label: e.label }));

  const pathD = pts.length === 1 ? `M${pts[0].x},${pts[0].y}` :
    pts.reduce((a, p, i) => {
      if (i === 0) return `M${p.x},${p.y}`;
      const pv = pts[i - 1], cx = (pv.x + p.x) / 2;
      return a + ` C${cx},${pv.y} ${cx},${p.y} ${p.x},${p.y}`;
    }, "");
  const areaD = pts.length > 1
    ? pathD + ` L${pts[pts.length - 1].x},${PAD.top + iH} L${pts[0].x},${PAD.top + iH} Z`
    : "";

  const yL = [minV, minV + range / 2, maxV].map(v => ({ val: Math.round(v * 10) / 10, y: py(v) }));

  // Scroll hint only when chart is wider than container
  const needsScroll = valid.length > 5;

  return (
    <div style={{ position: "relative" }}>
      {needsScroll && (
        <div style={{ fontSize: 9, color: "#3a3a50", textAlign: "right", paddingRight: 8, marginBottom: 2, letterSpacing: 1 }}>
          ← scroll →
        </div>
      )}
      <div style={{
        overflowX: "auto",
        overflowY: "visible",
        WebkitOverflowScrolling: "touch",
        // Hide scrollbar visually but keep functional
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        paddingBottom: 4,
      }}>
        <div style={{ width: W, minWidth: W }}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible", display: "block" }}>
            <defs>
              <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.22"/>
                <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.01"/>
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* Y axis lines + labels (fixed at left edge) */}
            {yL.map((l, i) => (
              <g key={i}>
                <line x1={PAD.left} y1={l.y} x2={W - PAD.right} y2={l.y} stroke="#1e1e30" strokeWidth="1" strokeDasharray="4,4"/>
                <text x={PAD.left - 6} y={l.y + 4} textAnchor="end" fill="#555" fontSize="10" fontFamily="monospace">{l.val}</text>
              </g>
            ))}

            {/* X axis labels — short form on chart */}
            {pts.map((p, i) => {
              const lbl = p.label || "";
              const short = lbl
                .replace(/^Tydzie[ńn]\s*/i, "Tyg ")
                .replace(/^Week\s*/i, "Wk ")
                .replace(/^Wpis\s*/i, "W ")
                .replace(/^Entry\s*/i, "E ");
              return (
                <text key={i} x={p.x} y={H - 4} textAnchor="middle" fill="#555" fontSize="9" fontFamily="monospace">
                  {short}
                </text>
              );
            })}

            {/* Area fill */}
            {areaD && <path d={areaD} fill="url(#ag)"/>}

            {/* Line */}
            {pts.length > 1 && (
              <path d={pathD} fill="none" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round" filter="url(#glow)"/>
            )}

            {/* Dots + value labels (drawn before % badges so badges sit on top) */}
            {pts.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={5} fill="#0a0a14" stroke="#FF6B35" strokeWidth="2.5"/>
                <circle cx={p.x} cy={p.y} r={2} fill="#FF6B35"/>
                <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#ccc" fontSize="9" fontFamily="monospace" fontWeight="600">{p.val}{unit}</text>
              </g>
            ))}

            {/* % badges between points — floated well above, with a thin connector line */}
            {pts.map((p, i) => {
              if (i === 0) return null;
              const pv = pts[i - 1];
              const pct = ((parseFloat(p.val) - parseFloat(pv.val)) / parseFloat(pv.val) * 100);
              const sign = pct >= 0 ? "+" : "";
              const mx = (pv.x + p.x) / 2;
              // anchor: midpoint of the line segment, then badge floats 36px above that
              const lineY = (pv.y + p.y) / 2;
              const badgeY = lineY - 36;
              return (
                <g key={i}>
                  {/* thin connector from midpoint of segment up to badge bottom */}
                  <line
                    x1={mx} y1={lineY - 4}
                    x2={mx} y2={badgeY + 12}
                    stroke={pct >= 0 ? "#00D4AA" : "#FF3B7A"}
                    strokeWidth="0.8"
                    strokeDasharray="2,2"
                    opacity="0.4"
                  />
                  <rect x={mx - 22} y={badgeY - 8} width={44} height={16} rx={8} fill={pct >= 0 ? "#0d2a1e" : "#2a0d0d"}/>
                  <text x={mx} y={badgeY + 4} textAnchor="middle" fill={pct >= 0 ? "#00D4AA" : "#FF3B7A"} fontSize="9" fontWeight="700" fontFamily="monospace">
                    {sign}{Math.abs(pct).toFixed(1)}%
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── DATE PICKER ──────────────────────────────────────────────────────────────
const btnS = { background:"#1a1a28", border:"none", color:"#ccc", width:32, height:32, borderRadius:8, cursor:"pointer", fontSize:16, fontFamily:"inherit" };
function DatePickerModal({ onSelect, onClose }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [day, setDay] = useState(today.getDate());
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const days = [];
  for (let i=0; i<firstDay; i++) days.push(null);
  for (let i=1; i<=daysInMonth; i++) days.push(i);
  const confirm = () => {
    const d = new Date(year, month, day);
    const label = `${d.getDate().toString().padStart(2,"0")}.${(d.getMonth()+1).toString().padStart(2,"0")}.${d.getFullYear()}`;
    onSelect(label);
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}}>
      <div style={{background:"#111120",borderRadius:24,padding:"24px 20px",width:320,border:"1px solid #2a2a3a"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <button onClick={()=>setMonth(m=>{const nm=m===0?(setYear(y=>y-1),11):m-1; return nm;})} style={btnS}>‹</button>
          <span style={{color:"#e8e8f0",fontWeight:700,fontSize:15}}>{months[month]} {year}</span>
          <button onClick={()=>setMonth(m=>{const nm=m===11?(setYear(y=>y+1),0):m+1; return nm;})} style={btnS}>›</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:12}}>
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=>(
            <div key={d} style={{textAlign:"center",fontSize:10,color:"#555",padding:"4px 0"}}>{d}</div>
          ))}
          {days.map((d,i)=>(
            <button key={i} onClick={()=>d&&setDay(d)} style={{padding:"7px 0",borderRadius:8,border:"none",cursor:d?"pointer":"default",fontFamily:"inherit",fontSize:13,background:d===day&&d?"#FF6B35":d?"#1a1a28":"transparent",color:d===day&&d?"#fff":d?"#ccc":"transparent",fontWeight:d===day?"700":"400"}}>{d||""}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={confirm} style={{flex:1,padding:"11px",borderRadius:12,background:"#FF6B35",border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>OK</button>
          <button onClick={onClose} style={{flex:1,padding:"11px",borderRadius:12,background:"#1a1a28",border:"none",color:"#888",fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
        </div>
      </div>
    </div>
  );
}

// ─── PROGRESS STAT BAR ────────────────────────────────────────────────────────
function ProgressStat({ entries, period, totalProgress, t, accentColor }) {
  const days = calcDays(entries, period);
  if (totalProgress === null) return null;
  const isPos = parseFloat(totalProgress) >= 0;
  return (
    <div style={{background:`linear-gradient(135deg,#1a0f08,#0f1a15)`,border:"1px solid #2a2a3a",borderRadius:16,padding:"14px 20px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div>
        <div style={{fontSize:10,color:"#555",letterSpacing:1,textTransform:"uppercase"}}>{t.overallProgress}</div>
        <div style={{fontSize:26,fontWeight:800,color:isPos?accentColor:"#FF3B7A",letterSpacing:-1}}>
          {isPos?"+":""}{totalProgress}%
        </div>
      </div>
      {days !== null && (
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:10,color:"#555",textTransform:"uppercase",letterSpacing:1}}>{t.days}</div>
          <div style={{fontSize:20,fontWeight:700,color:"#777"}}>{days}</div>
        </div>
      )}
    </div>
  );
}

// ─── ENTRIES LIST (shared, reusable) ──────────────────────────────────────────
function EntriesList({ entries, period, unit, accentColor, t, onUpdateEntry, onDeleteEntry, onAddEntry, onSetDate }) {
  return (
    <div style={{background:"#111120",border:"1px solid #1e1e30",borderRadius:20,overflow:"hidden",marginBottom:14}}>
      <div style={{padding:"12px 18px 10px",fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",borderBottom:"1px solid #1a1a28"}}>{t.weeklyData}</div>
      {entries.map((e, i) => {
        const prev = entries.slice(0,i).reverse().find(x => x.value!==""&&x.value!==null&&x.value!==undefined);
        const pct = (prev && e.value!=="") ? ((parseFloat(e.value)-parseFloat(prev.value))/parseFloat(prev.value)*100) : null;
        return (
          <div key={i} style={{display:"flex",alignItems:"center",padding:"9px 12px 9px 16px",borderBottom:i<entries.length-1?"1px solid #13131f":"none",gap:8}}>
            {/* Label / date */}
            <div style={{width:68,fontSize:10,color:"#444",fontWeight:700,fontFamily:"monospace",flexShrink:0}}>
              {period==="custom"
                ? <button onClick={()=>onSetDate(i)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:3,padding:0,color:"#7C6AF7",fontFamily:"monospace",fontSize:9}}>
                    <CalIcon/> {e.label?.includes(".")? e.label : t.pickDate}
                  </button>
                : <span>{e.label}</span>
              }
            </div>
            {/* Value input */}
            <input type="number" value={e.value} placeholder={`— ${unit}`}
              onChange={ev => onUpdateEntry(i, ev.target.value)}
              style={{flex:1,background:"#0d0d1a",border:"1px solid #2a2a3a",borderRadius:9,color:"#e8e8f0",padding:"7px 10px",fontSize:14,fontFamily:"monospace",fontWeight:600,outline:"none"}}/>
            {/* % diff */}
            <div style={{width:44,textAlign:"right",fontSize:9.5,fontWeight:700,fontFamily:"monospace",color:pct>=0?accentColor:"#FF3B7A",flexShrink:0}}>
              {pct!==null?`${pct>=0?"+":""}${pct.toFixed(1)}%`:""}
            </div>
            {/* Delete entry button */}
            <button onClick={()=>onDeleteEntry(i)} title="Usuń" style={{background:"#2a0d0d",border:"1px solid #4a1a1a",color:"#FF3B7A",fontSize:11,cursor:"pointer",borderRadius:7,padding:"3px 7px",flexShrink:0,fontWeight:700,lineHeight:1}}>✕</button>
          </div>
        );
      })}
      <button onClick={onAddEntry} style={{width:"100%",padding:"11px",background:"none",border:"none",borderTop:"1px solid #1a1a28",color:accentColor,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
        {t.addEntry}
      </button>
    </div>
  );
}

// ─── PERIOD SELECTOR ─────────────────────────────────────────────────────────
function PeriodSelector({ period, onChange, accentColor, textColor, t }) {
  return (
    <div style={{background:"#111120",border:"1px solid #1e1e30",borderRadius:16,padding:"12px 16px",marginBottom:14}}>
      <div style={{fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",marginBottom:10}}>{t.period}</div>
      <div style={{display:"flex",gap:8}}>
        {["weekly","custom"].map(p => (
          <button key={p} onClick={()=>onChange(p)} style={{flex:1,padding:"8px 4px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600,background:period===p?accentColor:"#0d0d1a",color:period===p?textColor:"#555"}}>
            {t[p]}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── EXERCISE DETAIL ──────────────────────────────────────────────────────────
function ExerciseDetail({ ex, onChange, onDelete, onBack, units, t }) {
  const [period, setPeriod] = useState(ex.period || "weekly");
  const [showDatePicker, setShowDatePicker] = useState(null);
  const weightUnit = units==="metric" ? t.kg : t.lb;

  const updatePeriod = p => { setPeriod(p); onChange({...ex, period:p}); };
  const updateEntry = (i, val) => {
    const entries = [...(ex.entries||[])];
    entries[i] = {...entries[i], value:val};
    onChange({...ex, entries});
  };
  const deleteEntry = i => {
    const entries = (ex.entries||[]).filter((_,idx)=>idx!==i);
    onChange({...ex, entries});
  };
  const setEntryDate = (i, label) => {
    const entries = [...(ex.entries||[])];
    entries[i] = {...entries[i], label};
    onChange({...ex, entries});
    setShowDatePicker(null);
  };
  const addEntry = () => {
    const entries = [...(ex.entries||[])];
    const n = entries.length + 1;
    const label = period==="weekly" ? `${t.week} ${n}` : `${t.entry} ${n}`;
    entries.push({value:"", label});
    onChange({...ex, entries, period});
  };

  const entries = ex.entries || [];
  const filled = entries.filter(e => e.value!==""&&e.value!==null&&e.value!==undefined);
  const totalProgress = filled.length<2 ? null : ((parseFloat(filled[filled.length-1].value)-parseFloat(filled[0].value))/parseFloat(filled[0].value)*100).toFixed(1);

  return (
    <div style={{padding:"0 16px"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:"#FF6B35",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:4,padding:"14px 8px 8px 0",fontFamily:"inherit"}}>← {t.back}</button>
      <ProgressStat entries={entries} period={period} totalProgress={totalProgress} t={t} accentColor="#00D4AA"/>
      <div style={{background:"#111120",border:"1px solid #1e1e30",borderRadius:20,padding:"18px 10px 10px",marginBottom:14}}>
        <div style={{fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",marginBottom:10,paddingLeft:6}}>{t.strengthProgress} ({weightUnit})</div>
        <LineChart entries={entries} unit={weightUnit} t={t}/>
      </div>
      <PeriodSelector period={period} onChange={updatePeriod} accentColor="#FF6B35" textColor="#fff" t={t}/>
      <EntriesList entries={entries} period={period} unit={weightUnit} accentColor="#00D4AA" t={t}
        onUpdateEntry={updateEntry} onDeleteEntry={deleteEntry} onAddEntry={addEntry} onSetDate={i=>setShowDatePicker(i)}/>
      <button onClick={()=>onDelete(ex.id)} style={{width:"100%",padding:"12px",background:"#1a0a0a",border:"1px solid #3a1a1a",borderRadius:14,color:"#FF3B7A",fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
        {t.deleteExercise}
      </button>
      {showDatePicker!==null && <DatePickerModal onSelect={l=>setEntryDate(showDatePicker,l)} onClose={()=>setShowDatePicker(null)}/>}
    </div>
  );
}

// ─── MEASUREMENT DETAIL ───────────────────────────────────────────────────────
function MeasurementDetail({ meas, onChange, onDelete, onBack, units, t }) {
  const [period, setPeriod] = useState(meas.period || "weekly");
  const [showDatePicker, setShowDatePicker] = useState(null);
  const sizeUnit = units==="metric" ? t.cm : t.inch;

  const updatePeriod = p => { setPeriod(p); onChange({...meas, period:p}); };
  const updateEntry = (i, val) => {
    const entries = [...(meas.entries||[])];
    entries[i] = {...entries[i], value:val};
    onChange({...meas, entries});
  };
  const deleteEntry = i => {
    const entries = (meas.entries||[]).filter((_,idx)=>idx!==i);
    onChange({...meas, entries});
  };
  const setEntryDate = (i, label) => {
    const entries = [...(meas.entries||[])];
    entries[i] = {...entries[i], label};
    onChange({...meas, entries});
    setShowDatePicker(null);
  };
  const addEntry = () => {
    const entries = [...(meas.entries||[])];
    const n = entries.length + 1;
    const label = period==="weekly" ? `${t.week} ${n}` : `${t.entry} ${n}`;
    entries.push({value:"", label});
    onChange({...meas, entries, period});
  };

  const entries = meas.entries || [];
  const filled = entries.filter(e => e.value!==""&&e.value!==null&&e.value!==undefined);
  const totalProgress = filled.length<2 ? null : ((parseFloat(filled[filled.length-1].value)-parseFloat(filled[0].value))/parseFloat(filled[0].value)*100).toFixed(1);

  return (
    <div style={{padding:"0 16px"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:"#00D4AA",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:4,padding:"14px 8px 8px 0",fontFamily:"inherit"}}>← {t.back}</button>
      <ProgressStat entries={entries} period={period} totalProgress={totalProgress} t={t} accentColor="#00D4AA"/>
      <div style={{background:"#111120",border:"1px solid #1e1e30",borderRadius:20,padding:"18px 10px 10px",marginBottom:14}}>
        <div style={{fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",marginBottom:10,paddingLeft:6}}>{t.measurementProgress} ({sizeUnit})</div>
        <LineChart entries={entries} unit={sizeUnit} t={t}/>
      </div>
      <PeriodSelector period={period} onChange={updatePeriod} accentColor="#00D4AA" textColor="#000" t={t}/>
      <EntriesList entries={entries} period={period} unit={sizeUnit} accentColor="#00D4AA" t={t}
        onUpdateEntry={updateEntry} onDeleteEntry={deleteEntry} onAddEntry={addEntry} onSetDate={i=>setShowDatePicker(i)}/>
      <button onClick={()=>onDelete(meas.id)} style={{width:"100%",padding:"12px",background:"#1a0a0a",border:"1px solid #3a1a1a",borderRadius:14,color:"#FF3B7A",fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
        {t.delete}
      </button>
      {showDatePicker!==null && <DatePickerModal onSelect={l=>setEntryDate(showDatePicker,l)} onClose={()=>setShowDatePicker(null)}/>}
    </div>
  );
}

// ─── EXERCISES VIEW ───────────────────────────────────────────────────────────
function ExercisesView({ folder, onUpdate, onBack, units, t }) {
  const [selectedEx, setSelectedEx] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const nextId = useRef(Date.now());
  const exercises = folder.exercises || [];
  const ex = exercises.find(e => e.id===selectedEx);

  const addEx = () => {
    if (!newName.trim()) return;
    const color = COLORS[exercises.length % COLORS.length];
    onUpdate({...folder, exercises:[...exercises,{id:nextId.current++,name:newName.trim(),color,entries:[],period:"weekly"}]});
    setNewName(""); setShowAdd(false);
  };
  const updateEx = updated => onUpdate({...folder, exercises:exercises.map(e=>e.id===updated.id?updated:e)});
  const deleteEx = id => { onUpdate({...folder, exercises:exercises.filter(e=>e.id!==id)}); setSelectedEx(null); };

  if (selectedEx && ex) return (
    <div>
      <div style={{padding:"0 24px 0"}}>
        <div style={{fontSize:10,letterSpacing:3,color:"#FF6B35",textTransform:"uppercase",paddingTop:20,marginBottom:2}}>{t.exercises}</div>
        <h1 style={{margin:"0 0 0",fontSize:24,fontWeight:700,letterSpacing:-0.5,background:"linear-gradient(135deg,#fff 40%,#888)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{ex.name}</h1>
      </div>
      <ExerciseDetail ex={ex} onChange={updateEx} onDelete={deleteEx} onBack={()=>setSelectedEx(null)} units={units} t={t}/>
    </div>
  );

  return (
    <div>
      <div style={{padding:"0 24px"}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#FF6B35",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:4,padding:"14px 0 8px 0",fontFamily:"inherit"}}>← {t.back}</button>
        <div style={{fontSize:10,letterSpacing:3,color:"#FF6B35",textTransform:"uppercase",marginBottom:2}}>{folder.name}</div>
        <h1 style={{margin:"0 0 20px",fontSize:26,fontWeight:700,letterSpacing:-0.5,background:"linear-gradient(135deg,#fff 40%,#888)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{t.exercises}</h1>
      </div>
      <div style={{padding:"0 16px"}}>
        {exercises.map(ex => {
          const filled = (ex.entries||[]).filter(e=>e.value!==""&&e.value!==null);
          const last = filled.length>0 ? parseFloat(filled[filled.length-1].value) : null;
          const first = filled.length>0 ? parseFloat(filled[0].value) : null;
          const prog = (first&&last&&filled.length>1) ? ((last-first)/first*100).toFixed(1) : null;
          const wu = units==="metric" ? t.kg : t.lb;
          return (
            <button key={ex.id} onClick={()=>setSelectedEx(ex.id)} style={{width:"100%",textAlign:"left",background:"#111120",border:"1px solid #1e1e30",borderRadius:18,padding:"14px 18px",marginBottom:10,cursor:"pointer",display:"flex",alignItems:"center",gap:14,WebkitTapHighlightColor:"transparent"}}>
              <div style={{width:42,height:42,borderRadius:13,background:`${ex.color}18`,border:`1.5px solid ${ex.color}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <DumbbellIcon size={22} color={ex.color}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:2,letterSpacing:-0.2}}>{ex.name}</div>
                <div style={{fontSize:11,color:"#555"}}>{filled.length>0?`${filled.length} ${t.days} • ${t.lastEntry}: ${last} ${wu}`:"—"}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                {prog!==null&&<div style={{fontSize:14,fontWeight:800,color:parseFloat(prog)>=0?"#00D4AA":"#FF3B7A",fontFamily:"monospace"}}>{parseFloat(prog)>=0?"+":""}{prog}%</div>}
                <div style={{fontSize:16,color:"#2a2a3a"}}>›</div>
              </div>
            </button>
          );
        })}
        {showAdd ? (
          <div style={{background:"#111120",border:"1px solid #2a2a3a",borderRadius:18,padding:"16px",marginBottom:10}}>
            <div style={{fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>{t.addExercise}</div>
            <input autoFocus placeholder={t.exerciseName} value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addEx()}
              style={{width:"100%",background:"#0d0d1a",border:"1px solid #2a2a3a",borderRadius:10,color:"#e8e8f0",padding:"10px 14px",fontSize:15,fontFamily:"inherit",marginBottom:12,boxSizing:"border-box",outline:"none"}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={addEx} style={{flex:1,padding:"11px",borderRadius:12,background:"#FF6B35",border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.add}</button>
              <button onClick={()=>{setShowAdd(false);setNewName("");}} style={{flex:1,padding:"11px",borderRadius:12,background:"#1a1a28",border:"none",color:"#888",fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>{t.cancel}</button>
            </div>
          </div>
        ) : (
          <button onClick={()=>setShowAdd(true)} style={{width:"100%",padding:"13px",borderRadius:18,background:"none",border:"2px dashed #2a2a3a",color:"#FF6B35",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <span style={{fontSize:18,lineHeight:1}}>+</span> {t.addExercise}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── MEASUREMENTS VIEW ────────────────────────────────────────────────────────
function MeasurementsView({ folder, onUpdate, onBack, units, t }) {
  const [selectedM, setSelectedM] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const nextId = useRef(Date.now() + 500);
  const measurements = folder.measurements || [];
  const m = measurements.find(x => x.id===selectedM);

  const addM = name => {
    const nm = name || newName.trim();
    if (!nm) return;
    onUpdate({...folder, measurements:[...measurements,{id:nextId.current++,name:nm,entries:[],period:"weekly"}]});
    setNewName(""); setShowAdd(false);
  };
  const updateM = updated => onUpdate({...folder, measurements:measurements.map(x=>x.id===updated.id?updated:x)});
  const deleteM = id => { onUpdate({...folder, measurements:measurements.filter(x=>x.id!==id)}); setSelectedM(null); };

  if (selectedM && m) return (
    <div>
      <div style={{padding:"0 24px 0"}}>
        <div style={{fontSize:10,letterSpacing:3,color:"#00D4AA",textTransform:"uppercase",paddingTop:20,marginBottom:2}}>{t.measurements}</div>
        <h1 style={{margin:"0 0 0",fontSize:24,fontWeight:700,letterSpacing:-0.5,background:"linear-gradient(135deg,#fff 40%,#888)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{m.name}</h1>
      </div>
      <MeasurementDetail meas={m} onChange={updateM} onDelete={deleteM} onBack={()=>setSelectedM(null)} units={units} t={t}/>
    </div>
  );

  return (
    <div>
      <div style={{padding:"0 24px"}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#00D4AA",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:4,padding:"14px 0 8px 0",fontFamily:"inherit"}}>← {t.back}</button>
        <div style={{fontSize:10,letterSpacing:3,color:"#00D4AA",textTransform:"uppercase",marginBottom:2}}>{folder.name}</div>
        <h1 style={{margin:"0 0 20px",fontSize:26,fontWeight:700,letterSpacing:-0.5,background:"linear-gradient(135deg,#fff 40%,#888)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{t.measurements}</h1>
      </div>
      <div style={{padding:"0 16px"}}>
        {measurements.map(mx => {
          const filled = (mx.entries||[]).filter(e=>e.value!==""&&e.value!==null);
          const last = filled.length>0 ? parseFloat(filled[filled.length-1].value) : null;
          const first = filled.length>0 ? parseFloat(filled[0].value) : null;
          const prog = (first&&last&&filled.length>1) ? ((last-first)/first*100).toFixed(1) : null;
          const su = units==="metric" ? t.cm : t.inch;
          return (
            <div key={mx.id} style={{display:"flex",alignItems:"center",background:"#111120",border:"1px solid #1e1e30",borderRadius:18,padding:"12px 14px",marginBottom:10,gap:10}}>
              <button onClick={()=>setSelectedM(mx.id)} style={{flex:1,textAlign:"left",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:12,WebkitTapHighlightColor:"transparent"}}>
                <div style={{width:40,height:40,borderRadius:12,background:"#00D4AA18",border:"1.5px solid #00D4AA44",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <RulerIcon size={20} color="#00D4AA"/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:15,color:"#e8e8f0",marginBottom:2}}>{mx.name}</div>
                  <div style={{fontSize:11,color:"#555"}}>{filled.length>0?`${filled.length} ${t.days} • ${t.lastEntry}: ${last} ${su}`:"—"}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginRight:4}}>
                  {prog!==null&&<div style={{fontSize:13,fontWeight:800,color:parseFloat(prog)>=0?"#00D4AA":"#FF3B7A",fontFamily:"monospace"}}>{parseFloat(prog)>=0?"+":""}{prog}%</div>}
                  <div style={{fontSize:16,color:"#2a2a3a"}}>›</div>
                </div>
              </button>
              <button onClick={()=>deleteM(mx.id)} style={{background:"#2a0d0d",border:"1px solid #5a2020",color:"#FF3B7A",cursor:"pointer",fontSize:13,padding:"6px 9px",borderRadius:9,flexShrink:0,fontWeight:700,lineHeight:1}}>✕</button>
            </div>
          );
        })}
        {showAdd ? (
          <div style={{background:"#111120",border:"1px solid #2a2a3a",borderRadius:18,padding:"16px",marginBottom:10}}>
            <div style={{fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>{t.addMeasurement}</div>
            <input autoFocus placeholder={t.measurementName} value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addM()}
              style={{width:"100%",background:"#0d0d1a",border:"1px solid #2a2a3a",borderRadius:10,color:"#e8e8f0",padding:"10px 14px",fontSize:15,fontFamily:"inherit",marginBottom:12,boxSizing:"border-box",outline:"none"}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>addM()} style={{flex:1,padding:"11px",borderRadius:12,background:"#00D4AA",border:"none",color:"#000",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.add}</button>
              <button onClick={()=>{setShowAdd(false);setNewName("");}} style={{flex:1,padding:"11px",borderRadius:12,background:"#1a1a28",border:"none",color:"#888",fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>{t.cancel}</button>
            </div>
          </div>
        ) : (
          <button onClick={()=>setShowAdd(true)} style={{width:"100%",padding:"13px",borderRadius:18,background:"none",border:"2px dashed #1a3a2a",color:"#00D4AA",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <span style={{fontSize:18,lineHeight:1}}>+</span> {t.addMeasurement}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── PERIOD FOLDER VIEW ───────────────────────────────────────────────────────
function PeriodFolderView({ folder, onUpdate, onBack, units, t }) {
  const [view, setView] = useState(null);
  if (view==="exercises") return <ExercisesView folder={folder} onUpdate={f=>onUpdate({...folder,exercises:f.exercises})} onBack={()=>setView(null)} units={units} t={t}/>;
  if (view==="measurements") return <MeasurementsView folder={folder} onUpdate={f=>onUpdate({...folder,measurements:f.measurements})} onBack={()=>setView(null)} units={units} t={t}/>;
  const exCount = (folder.exercises||[]).length;
  const mCount = (folder.measurements||[]).length;
  return (
    <div>
      <div style={{padding:"0 24px"}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#FF6B35",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:4,padding:"14px 0 8px 0",fontFamily:"inherit"}}>← {t.back}</button>
        <div style={{fontSize:10,letterSpacing:3,color:"#FF6B35",textTransform:"uppercase",marginBottom:2}}>{t.folders}</div>
        <h1 style={{margin:"0 0 24px",fontSize:28,fontWeight:700,letterSpacing:-0.8,background:"linear-gradient(135deg,#fff 40%,#888)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{folder.name}</h1>
      </div>
      <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:12}}>
        <button onClick={()=>setView("exercises")} style={{width:"100%",textAlign:"left",background:"linear-gradient(135deg,#1a0f06,#0f0f1a)",border:"1px solid #FF6B3530",borderRadius:22,padding:"20px",cursor:"pointer",WebkitTapHighlightColor:"transparent",display:"block"}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{width:52,height:52,borderRadius:16,background:"#FF6B3520",border:"1.5px solid #FF6B3550",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <DumbbellIcon size={28} color="#FF6B35"/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:17,color:"#e8e8f0",marginBottom:3,letterSpacing:-0.3}}>{t.exercises}</div>
              <div style={{fontSize:12,color:"#555"}}>{exCount} items</div>
            </div>
            <div style={{fontSize:20,color:"#FF6B3560"}}>›</div>
          </div>
        </button>
        <button onClick={()=>setView("measurements")} style={{width:"100%",textAlign:"left",background:"linear-gradient(135deg,#06181a,#0f0f1a)",border:"1px solid #00D4AA30",borderRadius:22,padding:"20px",cursor:"pointer",WebkitTapHighlightColor:"transparent",display:"block"}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{width:52,height:52,borderRadius:16,background:"#00D4AA20",border:"1.5px solid #00D4AA50",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <RulerIcon size={28} color="#00D4AA"/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:17,color:"#e8e8f0",marginBottom:3,letterSpacing:-0.3}}>{t.measurements}</div>
              <div style={{fontSize:12,color:"#555"}}>{mCount} items</div>
            </div>
            <div style={{fontSize:20,color:"#00D4AA60"}}>›</div>
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── SETTINGS SCREEN ─────────────────────────────────────────────────────────
function SettingsScreen({ lang, units, onSwitchLang, onSetUnits, onClearData, onBack, t, nickname, onSetNickname }) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [nickInput, setNickInput] = useState(nickname || "");
  const [nickSaved, setNickSaved] = useState(false);

  const saveNick = () => {
    onSetNickname(nickInput.trim());
    setNickSaved(true);
    setTimeout(() => setNickSaved(false), 1800);
  };

  return (
    <div style={{padding:"0 16px", paddingBottom: 40}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:"#FF6B35",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:4,padding:"14px 8px 8px 0",fontFamily:"inherit"}}>← {t.back}</button>
      <h1 style={{margin:"0 0 24px 8px",fontSize:26,fontWeight:700,letterSpacing:-0.8,background:"linear-gradient(135deg,#fff 40%,#888)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{t.settings}</h1>

      {/* Nick */}
      <div style={{background:"#111120",border:"1px solid #1e1e30",borderRadius:20,padding:"16px 18px",marginBottom:12}}>
        <div style={{fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>{t.nickname}</div>
        <div style={{fontSize:11,color:"#3a3a55",marginBottom:12,lineHeight:1.4}}>{t.nicknameHint}</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{position:"relative",flex:1}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"#444",userSelect:"none"}}>@</span>
            <input
              value={nickInput}
              onChange={e => { setNickInput(e.target.value.replace(/\s/g,"")); setNickSaved(false); }}
              onKeyDown={e => e.key==="Enter" && saveNick()}
              placeholder={t.nicknamePlaceholder}
              maxLength={24}
              style={{width:"100%",background:"#0d0d1a",border:"1px solid #2a2a3a",borderRadius:10,color:"#e8e8f0",padding:"10px 12px 10px 28px",fontSize:15,fontFamily:"monospace",fontWeight:600,outline:"none",boxSizing:"border-box"}}
            />
          </div>
          <button onClick={saveNick} style={{padding:"10px 16px",borderRadius:10,background:nickSaved?"#00D4AA":"#FF6B35",border:"none",color:nickSaved?"#000":"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"background 0.3s",flexShrink:0,minWidth:64}}>
            {nickSaved ? "✓" : t.add}
          </button>
        </div>
        {nickInput.trim() && (
          <div style={{marginTop:10,fontSize:12,color:"#444",fontFamily:"monospace"}}>
            Podgląd: <span style={{color:"#FF6B35",fontWeight:700}}>@{nickInput.trim()}</span>
          </div>
        )}
      </div>

      {/* Friends coming soon */}
      <div style={{background:"linear-gradient(135deg,#0f0f1a,#12081a)",border:"1px solid #2a1a3a",borderRadius:20,padding:"16px 18px",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{fontSize:26,flexShrink:0}}>👥</div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:"#7C6AF7",marginBottom:4,letterSpacing:-0.2}}>{t.friendsComingSoon}</div>
          </div>
        </div>
      </div>

      {/* Language */}
      <div style={{background:"#111120",border:"1px solid #1e1e30",borderRadius:20,padding:"16px 18px",marginBottom:12}}>
        <div style={{fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>{t.language}</div>
        <div style={{display:"flex",gap:16,alignItems:"center"}}>
          <button onClick={()=>onSwitchLang("pl")} style={{background:"none",border:"none",cursor:"pointer",padding:0,opacity:lang==="pl"?1:0.3,transition:"opacity 0.2s",borderRadius:"50%",boxShadow:lang==="pl"?"0 0 0 2.5px #FF6B35":"none",display:"flex"}}>
            <FlagPL size={38}/>
          </button>
          <button onClick={()=>onSwitchLang("en")} style={{background:"none",border:"none",cursor:"pointer",padding:0,opacity:lang==="en"?1:0.3,transition:"opacity 0.2s",borderRadius:"50%",boxShadow:lang==="en"?"0 0 0 2.5px #FF6B35":"none",display:"flex"}}>
            <FlagEN size={38}/>
          </button>
        </div>
      </div>

      {/* Units */}
      <div style={{background:"#111120",border:"1px solid #1e1e30",borderRadius:20,padding:"16px 18px",marginBottom:12}}>
        <div style={{fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>{t.units}</div>
        <div style={{display:"flex",gap:0,background:"#0a0a14",borderRadius:12,border:"1px solid #1e1e30",overflow:"hidden",width:"fit-content"}}>
          {[["metric",t.metric],["imperial",t.imperial]].map(([val,label])=>(
            <button key={val} onClick={()=>onSetUnits(val)} style={{padding:"9px 20px",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,background:units===val?"#FF6B35":"transparent",color:units===val?"#fff":"#555",transition:"all 0.2s"}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear data */}
      <div style={{background:"#111120",border:"1px solid #1e1e30",borderRadius:20,padding:"16px 18px",marginTop:4}}>
        <div style={{fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>{t.clearData}</div>
        {!confirmClear ? (
          <button onClick={()=>setConfirmClear(true)} style={{padding:"11px 22px",borderRadius:12,background:"#2a0d0d",border:"1px solid #5a2020",color:"#FF3B7A",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
            🗑 {t.clearData}
          </button>
        ) : (
          <div>
            <div style={{fontSize:13,color:"#aaa",marginBottom:14,lineHeight:1.5}}>{t.clearConfirm}</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{onClearData();setConfirmClear(false);}} style={{flex:1,padding:"11px",borderRadius:12,background:"#FF3B7A",border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.clearYes}</button>
              <button onClick={()=>setConfirmClear(false)} style={{flex:1,padding:"11px",borderRadius:12,background:"#1a1a28",border:"none",color:"#888",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{t.clearNo}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const appStyle = {
  minHeight:"100vh", background:"#0a0a14", color:"#e8e8f0",
  fontFamily:"'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif",
  maxWidth:430, margin:"0 auto", paddingBottom:48,
};

export default function App() {
  // Load persisted state or defaults
  const saved = loadState();
  const [lang, setLang] = useState(saved?.lang || "pl");
  const [nickname, setNickname] = useState(saved?.nickname || "");
  const [units, setUnits] = useState(saved?.units || "metric");
  const [folders, setFolders] = useState(saved?.folders || makeInitialFolders());
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const nextFolderId = useRef(saved?.nextId || 20);
  const t = T[lang];

  // Persist on every change
  useEffect(() => {
    saveState({ lang, units, folders, nextId: nextFolderId.current, nickname });
  }, [lang, units, folders]);

  const switchLang = newLang => {
    setLang(newLang);
    setFolders(prev => prev.map(f => f.isDefault ? {...f, name:T[newLang].defaultFolderName} : f));
  };
  const clearData = () => {
    const fresh = makeInitialFolders();
    setFolders(fresh);
    setNickname("");
    setSelectedFolder(null);
    setShowSettings(false);
    saveState({ lang, units, folders: fresh, nextId: 20, nickname: "" });
  };

  const folder = folders.find(f => f.id===selectedFolder);

  const addFolder = () => {
    if (!newFolderName.trim()) return;
    const defs = lang==="pl" ? defaultMeasurements_pl : defaultMeasurements_en;
    setFolders(prev => [...prev, {
      id: nextFolderId.current++,
      name: newFolderName.trim(),
      exercises: [],
      measurements: defs.map((name,i) => ({id:Date.now()+i, name, entries:[], period:"weekly"})),
    }]);
    setNewFolderName(""); setShowAddFolder(false);
  };
  const updateFolder = updated => setFolders(prev => prev.map(f => f.id===updated.id ? updated : f));
  const deleteFolder = id => { setFolders(prev => prev.filter(f => f.id!==id)); if (selectedFolder===id) setSelectedFolder(null); };

  // Settings screen
  if (showSettings) return (
    <div style={appStyle}>
      <div style={{display:"flex",justifyContent:"space-between",padding:"14px 24px 0",fontSize:11,color:"#333"}}>
        <span>9:41</span><span style={{letterSpacing:2}}>● ▲ ▮</span>
      </div>
      <SettingsScreen lang={lang} units={units} onSwitchLang={switchLang} onSetUnits={setUnits} onClearData={clearData} onBack={()=>setShowSettings(false)} t={t} nickname={nickname} onSetNickname={setNickname}/>
    </div>
  );

  // Folder detail
  if (selectedFolder && folder) return (
    <div style={appStyle}>
      <div style={{display:"flex",justifyContent:"space-between",padding:"14px 24px 0",fontSize:11,color:"#333"}}>
        <span>9:41</span><span style={{letterSpacing:2}}>● ▲ ▮</span>
      </div>
      <PeriodFolderView folder={folder} onUpdate={updateFolder} onBack={()=>setSelectedFolder(null)} units={units} t={t}/>
    </div>
  );

  // Home screen
  return (
    <div style={appStyle}>
      <div style={{display:"flex",justifyContent:"space-between",padding:"14px 24px 0",fontSize:11,color:"#333"}}>
        <span>9:41</span><span style={{letterSpacing:2}}>● ▲ ▮</span>
      </div>

      {/* Header */}
      <div style={{padding:"18px 24px 0",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{fontSize:10,letterSpacing:4,color:"#FF6B35",textTransform:"uppercase",marginBottom:3}}>{t.appSub}</div>
          <h1 style={{margin:0,fontSize:28,fontWeight:800,letterSpacing:-1,background:"linear-gradient(135deg,#fff 40%,#666)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{t.appName}</h1>
          {nickname && <div style={{fontSize:12,color:"#FF6B35",fontFamily:"monospace",fontWeight:600,marginTop:3}}>@{nickname}</div>}
        </div>
        <button onClick={()=>setShowSettings(true)} style={{background:"#111120",border:"1px solid #1e1e30",borderRadius:12,padding:"10px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",marginTop:4}}>
          <GearIcon size={20} color="#888"/>
        </button>
      </div>

      {/* Folders */}
      <div style={{padding:"20px 16px 0"}}>
        {folders.length===0 && !showAddFolder && (
          <div style={{textAlign:"center",padding:"40px 20px 30px"}}>
            <div style={{fontSize:44,marginBottom:16}}>💪</div>
            <div style={{fontSize:17,fontWeight:700,color:"#e8e8f0",marginBottom:8}}>{t.welcome}</div>
            <div style={{fontSize:13,color:"#555",marginBottom:28}}>{t.welcomeSub}</div>
            <button onClick={()=>setShowAddFolder(true)} style={{padding:"13px 28px",borderRadius:14,background:"#FF6B35",border:"none",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.addFolder}</button>
          </div>
        )}

        {folders.map(f => (
          <div key={f.id} style={{display:"flex",alignItems:"center",background:"#111120",border:"1px solid #1e1e30",borderRadius:20,padding:"14px 14px",marginBottom:10,gap:10}}>
            <button onClick={()=>setSelectedFolder(f.id)} style={{flex:1,textAlign:"left",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:14,WebkitTapHighlightColor:"transparent"}}>
              <div style={{width:46,height:46,borderRadius:14,background:"linear-gradient(135deg,#FF6B3520,#7C6AF720)",border:"1px solid #FF6B3530",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:22}}>📁</span>
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:16,color:"#e8e8f0",letterSpacing:-0.2}}>{f.name}</div>
                <div style={{fontSize:11,color:"#444",marginTop:2}}>
                  {(f.exercises||[]).length} {t.exercises.toLowerCase()} · {(f.measurements||[]).length} {t.measurements.toLowerCase()}
                </div>
              </div>
              <div style={{fontSize:20,color:"#2a2a3a"}}>›</div>
            </button>
            <button onClick={()=>deleteFolder(f.id)} style={{background:"#2a0d0d",border:"1px solid #5a2020",color:"#FF3B7A",cursor:"pointer",fontSize:13,padding:"6px 10px",borderRadius:10,flexShrink:0,fontWeight:700,lineHeight:1}} title={t.deleteFolder}>✕</button>
          </div>
        ))}

        {showAddFolder ? (
          <div style={{background:"#111120",border:"1px solid #2a2a3a",borderRadius:20,padding:"18px",marginBottom:10}}>
            <div style={{fontSize:10,color:"#555",letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>{t.addFolder}</div>
            <input autoFocus placeholder={t.folderName} value={newFolderName}
              onChange={e=>setNewFolderName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addFolder()}
              style={{width:"100%",background:"#0d0d1a",border:"1px solid #2a2a3a",borderRadius:10,color:"#e8e8f0",padding:"11px 14px",fontSize:15,fontFamily:"inherit",marginBottom:12,boxSizing:"border-box",outline:"none"}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={addFolder} style={{flex:1,padding:"12px",borderRadius:12,background:"#FF6B35",border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{t.create}</button>
              <button onClick={()=>{setShowAddFolder(false);setNewFolderName("");}} style={{flex:1,padding:"12px",borderRadius:12,background:"#1a1a28",border:"none",color:"#888",fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>{t.cancel}</button>
            </div>
          </div>
        ) : folders.length>0 && (
          <button onClick={()=>setShowAddFolder(true)} style={{width:"100%",padding:"13px",borderRadius:18,background:"none",border:"2px dashed #2a2a3a",color:"#FF6B35",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <span style={{fontSize:18,lineHeight:1}}>+</span> {t.addFolder}
          </button>
        )}
      </div>
    </div>
  );
}

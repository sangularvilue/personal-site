"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe, { GlobePoint } from "./Globe";

type Event = GlobePoint & { title: string; year: number; place: string; field: string; weight: number };
type Result = { points: number; distance: number; yearError: number; metric: number; eraScale: number };
type BoardRow = { name: string; score: number };

const EVENTS: Event[] = [
  ["Constantine wins the Battle of the Milvian Bridge.",312,41.94,12.47,"Rome, Italy","Imperial politics",4],
  ["Pride and Prejudice is first published.",1813,51.51,-.13,"London, England","Literature",3],
  ["The Gutenberg Bible comes off the press.",1455,50,8.27,"Mainz, Germany","Technology",4],
  ["Mansa Musa arrives in Cairo on his pilgrimage.",1324,30.04,31.24,"Cairo, Egypt","Economic history",3],
  ["Mehmed II captures Constantinople.",1453,41.01,28.98,"Constantinople","Military history",5],
  ["Haiti declares its independence.",1804,19.45,-72.68,"Gonaïves, Haiti","Revolution",4],
  ["The Meiji Restoration is proclaimed.",1868,35.68,139.76,"Tokyo, Japan","State formation",4],
  ["The Wright brothers make the first controlled powered flight.",1903,36.02,-75.67,"Kitty Hawk, USA","Aviation",3],
  ["India becomes independent from British rule.",1947,28.61,77.21,"New Delhi, India","Decolonization",5],
  ["The double-helix structure of DNA is published.",1953,52.21,.12,"Cambridge, England","Science",2],
  ["The Treaty of Tordesillas divides new lands between two crowns.",1494,41.5,-5,"Tordesillas, Spain","Diplomacy",4],
  ["Hiram Bingham reaches Machu Picchu.",1911,-13.16,-72.55,"Cusco Region, Peru","Archaeology",2],
  ["French soldiers uncover the Rosetta Stone.",1799,31.4,30.42,"Rashid, Egypt","Linguistics",2],
  ["King John seals Magna Carta.",1215,51.44,-.57,"Runnymede, England","Legal history",4],
  ["The Zulu army defeats a British column at Isandlwana.",1879,-28.36,30.65,"Isandlwana, South Africa","Colonial history",3],
  ["The Song dynasty is founded.",960,34.8,114.31,"Kaifeng, China","Dynastic history",3],
  ["Ashoka conquers Kalinga.",-261,20.27,85.84,"Odisha, India","Ancient history",3],
  ["Writing emerges in the city of Uruk.",-3200,31.32,45.64,"Uruk, Mesopotamia","Writing systems",3],
  ["Akhenaten establishes a new capital at Amarna.",-1346,27.65,30.9,"Amarna, Egypt","Religious history",2],
  ["The first modern Olympic Games open.",1896,37.98,23.73,"Athens, Greece","Sport",2],
  ["The gold rush begins after discovery at Sutter’s Mill.",1848,38.8,-120.89,"Coloma, USA","Migration",2],
  ["The Berlin Conference convenes to regulate European colonization.",1884,52.52,13.4,"Berlin, Germany","Geopolitics",5],
  ["The first successful smallpox vaccination is administered.",1796,51.71,-2.5,"Berkeley, England","Medicine",2],
  ["The Panama Canal opens to traffic.",1914,9.08,-79.68,"Panama","Infrastructure",3],
].map(([title,year,lat,lon,place,field,weight]) => ({ title, year, lat, lon, place, field, weight } as Event));

const FALLBACK: BoardRow[] = [{name:"atlas_finch",score:2468},{name:"yearzero",score:2312},{name:"cicero_7",score:2190}];
const ZOOM_SPANS = [6026,1200,240,40,4,.2], ZOOM_LABELS = ["millennia","centuries","decades","years","months","days"];
function seededQuestions() {
  let seed = [...new Date().toISOString().slice(0,10)].reduce((n,c)=>Math.imul(n^c.charCodeAt(0),16777619),2166136261)>>>0;
  const rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296};
  return [...EVENTS].map(event=>({event,rank:rand()/event.weight})).sort((a,b)=>a.rank-b.rank).slice(0,6).map(x=>x.event);
}
function yearLabel(year:number,detailed=false){
  if(detailed&&Math.abs(year-Math.round(year))>.005){const whole=Math.floor(year),month=Math.max(1,Math.min(12,Math.round((year-whole)*12+1)));return `${new Date(2000,month-1).toLocaleString("en",{month:"short"})} ${Math.abs(whole)} ${whole<0?"BC":"AD"}`}
  return `${Math.round(Math.abs(year))} ${year<0?"BC":"AD"}`;
}
function greatCircle(a:GlobePoint,b:GlobePoint){
  const r=Math.PI/180,dLat=(b.lat-a.lat)*r,dLon=(b.lon-a.lon)*r,h=Math.sin(dLat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLon/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
}
function scoreGuess(guess:GlobePoint,year:number,event:Event):Result{
  const distance=greatCircle(guess,event),yearError=Math.abs(year-event.year),eraScale=Math.max(6,Math.min(140,(2026-event.year)*.075));
  const metric=Math.hypot(distance/1800,yearError/eraScale),points=Math.round(500/(1+metric**1.65)*10)/10;
  return {points,distance,yearError,metric,eraScale};
}

export default function ThenThere(){
  const questions=useMemo(seededQuestions,[]),[round,setRound]=useState(0),[year,setYear]=useState(1000),[zoom,setZoom]=useState(0);
  const [guess,setGuess]=useState<GlobePoint|null>(null),[result,setResult]=useState<Result|null>(null),[total,setTotal]=useState(0),[finished,setFinished]=useState(false);
  const [name,setName]=useState(""),[board,setBoard]=useState<BoardRow[]>(FALLBACK),[posted,setPosted]=useState(false),hold=useRef<ReturnType<typeof setInterval>|null>(null);
  const event=questions[round],span=ZOOM_SPANS[zoom],min=Math.max(-4000,year-span/2),max=Math.min(2026,year+span/2);
  useEffect(()=>{document.body.classList.add("then-there-mode");return()=>document.body.classList.remove("then-there-mode")},[]);
  useEffect(()=>{fetch("/api/thenthere/leaderboard").then(r=>r.ok?r.json():Promise.reject()).then(d=>setBoard(d.scores)).catch(()=>{})},[]);
  const stopHold=useCallback(()=>{if(hold.current)clearInterval(hold.current);hold.current=null},[]);
  const startHold=()=>{stopHold();hold.current=setInterval(()=>setZoom(z=>Math.min(ZOOM_SPANS.length-1,z+1)),620)};
  useEffect(()=>stopHold,[stopHold]);
  const choose=(p:GlobePoint)=>{if(!result)setGuess(p)};
  const lock=()=>{if(!guess||result)return;const next=scoreGuess(guess,year,event);setResult(next);setTotal(t=>Math.round((t+next.points)*10)/10)};
  const advance=()=>{if(round===5){setFinished(true);return}setRound(r=>r+1);setGuess(null);setResult(null);setYear(1000);setZoom(0)};
  const reset=()=>{setRound(0);setYear(1000);setZoom(0);setGuess(null);setResult(null);setTotal(0);setFinished(false);setPosted(false);setName("")};
  const submit=async()=>{if(!name.trim()||posted)return;try{const r=await fetch("/api/thenthere/leaderboard",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:name.trim(),score:Math.round(total)})});if(r.ok)setBoard((await r.json()).scores)}catch{}setPosted(true)};
  if(finished)return <main className="tt-shell"><Header total={total}/><section className="tt-end"><div className="tt-final"><p>Today’s expedition</p><strong>{Math.round(total).toLocaleString()}</strong><span>out of 3,000</span><h1>{total>2200?"You knew where history stood.":total>1400?"A respectable passage through time.":"The map remembers. Try again tomorrow."}</h1><button onClick={reset}>↻ Play again</button></div><aside className="tt-leader"><h2>♜ Today’s leaders</h2><ol>{board.slice(0,5).map((row,i)=><li key={`${row.name}-${i}`}><span>{i+1}</span><b>{row.name}</b><strong>{row.score.toLocaleString()}</strong></li>)}</ol><label>Post your score</label><div><input value={name} onChange={e=>setName(e.target.value.slice(0,18))} placeholder="your name" disabled={posted}/><button onClick={submit} disabled={!name.trim()||posted}>{posted?"Posted":"Join board"}</button></div></aside></section></main>;
  return <main className="tt-shell"><Header total={total} round={round}/><section className="tt-play"><div className="tt-prompt"><div><p className="tt-kicker">Round {round+1} of 6 <span>{event.field}</span></p><h1>{event.title}</h1><p className="tt-instruction">Place it in space and time.</p></div><div className="tt-globe-wrap"><Globe guess={guess} answer={result?event:null} locked={!!result} onGuess={choose}/>{!guess&&<p className="tt-globe-hint">Drag to rotate · click to mark</p>}<div className="tt-globe-key"><span className="guess-dot"/>guess {result&&<><span className="answer-dot"/>answer</>}</div></div></div><aside className="tt-time"><div className="tt-year"><p>Your year</p><strong>{yearLabel(year,zoom>3).replace(/ (BC|AD)$/,'')}</strong><span>{year<0?"BC":"AD"}</span></div><div className="tt-zoom"><span>◷ Scale: {ZOOM_LABELS[zoom]}</span><div>{ZOOM_LABELS.map((_,i)=><i key={i} className={i<=zoom?"on":""}/>)}</div></div><div className="tt-timeline" onPointerDown={startHold} onPointerUp={stopHold} onPointerCancel={stopHold} onPointerLeave={stopHold}><input type="range" aria-label="Choose a year" min={min} max={max} step={zoom===5?1/365:zoom===4?1/12:1} value={year} onChange={e=>{setYear(Number(e.target.value));setResult(null)}}/><div><span>{yearLabel(min)}</span><span>{yearLabel((min+max)/2)}</span><span>{yearLabel(max)}</span></div></div><p className="tt-note">Drag to travel. Press and hold the timeline to zoom from millennia down to days.</p>{result?<div className="tt-result"><div><span>+ {result.points.toFixed(1)}</span> points</div><p><b>{event.place}</b> · {yearLabel(event.year)}</p><ul><li>{Math.round(result.distance).toLocaleString()} km away</li><li>{Math.round(result.yearError).toLocaleString()} years off</li><li>L² distance {result.metric.toFixed(2)}</li></ul><button onClick={advance}>{round===5?"See today’s score":"Next event"} →</button></div>:<><button className="tt-lock" onClick={lock} disabled={!guess}>Lock in this guess</button><p className="tt-ready">{guess?"Location marked. Adjust the year, then lock it in.":"Rotate the globe and mark a location."}</p></>}<div className="tt-rule"><span>Surface-distance scale</span><b>1,800 km</b><span>Date scale</span><b>Era-adjusted</b><span>Distance</span><b>L²</b><span>Perfect round</span><b>500 pts</b></div></aside></section></main>;
}

function Header({total,round}:{total:number;round?:number}){return <header className="tt-top"><a href="/" className="tt-mark"><span>then</span><i>/</i><span>there</span></a>{round!==undefined?<div className="tt-rounds">{[0,1,2,3,4,5].map(i=><span key={i} className={i===round?"active":i<round?"done":""}>{i<round?"✓":i+1}</span>)}</div>:<div/>}<div className="tt-score">{Math.round(total).toLocaleString()} pts</div></header>}

"use client";
import { useEffect, useId, useLayoutEffect, useRef } from 'react';

const hours=Array.from({length:12},(_,i)=>String(i+1));
const minutes=Array.from({length:60},(_,i)=>String(i).padStart(2,'0'));
const periods=['AM','PM'];

function Wheel({label,options,value,answered,onChoose,wrap=true}:{label:string;options:string[];value:string;answered:boolean;onChoose:(value:string)=>void;wrap?:boolean}) {
  const id=useId(),frame=useRef<HTMLDivElement>(null);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null),interacted=useRef(false),choose=useRef(onChoose);
  const index=options.indexOf(value),offset=wrap?options.length:0,centre=offset+index;
  useEffect(()=>{choose.current=onChoose;},[onChoose]);
  useLayoutEffect(()=>{interacted.current=false;if(frame.current)frame.current.scrollTop=centre*44;},[centre]);
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
  function select(next:number) {
    if(timer.current)clearTimeout(timer.current);
    interacted.current=false;
    const wrapped=wrap?((next%options.length)+options.length)%options.length:Math.max(0,Math.min(options.length-1,next));
    if(frame.current)frame.current.scrollTop=(offset+wrapped)*44;
    choose.current(options[wrapped]);
  }
  return <div ref={frame} role="listbox" aria-label={label} aria-activedescendant={`${id}-${centre}`} tabIndex={0}
    onPointerDown={()=>{interacted.current=true;}} onWheel={()=>{interacted.current=true;}}
    onScroll={()=>{if(!interacted.current)return;if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>select(Math.round((frame.current?.scrollTop||0)/44)),150);}}
    onKeyDown={event=>{if(!['ArrowUp','ArrowDown','Enter',' '].includes(event.key))return;event.preventDefault();select(index+(event.key==='ArrowUp'?-1:event.key==='ArrowDown'?1:0));}}>
    {Array.from({length:options.length*(wrap?3:1)},(_,i)=><button id={`${id}-${i}`} tabIndex={-1} type="button" role="option" aria-label={options[i%options.length]} aria-selected={answered&&i===centre} className={i===centre?'is-centred':''} key={i} onClick={()=>select(i)}>{options[i%options.length]}</button>)}
  </div>;
}

export function TimePicker({value,onChange,label}:{value:string;onChange:(value:string)=>void;label:string}) {
  const hour=value?Number(value.slice(0,2)):6,minute=value?Number(value.slice(3)):0;
  const update=(h:number,m:number)=>onChange(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
  return <div className="os-time-picker" role="group" aria-label={label}><div className="os-time-wheels">
    <Wheel label="Hour" options={hours} value={String(hour%12||12)} answered={Boolean(value)} onChoose={h=>update(Number(h)%12+(hour>=12?12:0),minute)}/>
    <Wheel label="Minute" options={minutes} value={String(minute).padStart(2,'0')} answered={Boolean(value)} onChoose={m=>update(hour,Number(m))}/>
    <Wheel label="AM/PM" wrap={false} options={periods} value={hour<12?'AM':'PM'} answered={Boolean(value)} onChoose={p=>update(hour%12+(p==='PM'?12:0),minute)}/>
  </div></div>;
}

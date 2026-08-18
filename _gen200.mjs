import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env=fs.readFileSync('.env.local','utf8').split('\n').reduce((a,l)=>{const m=l.match(/^([A-Z_]+)=(.*)$/);if(m){a[m[1]]=m[2].split(/\s+#/)[0].trim();}return a;},{});
const admin=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const KEY=env.OPENAI_API_KEY;
const LABEL={biology:'Biology (Botany & Zoology) for Nepal MEC CEE medical entrance',chemistry:'Chemistry (physical, organic, inorganic) for Nepal MEC CEE',physics:'Physics for Nepal MEC CEE',mental_agility:'Mental Agility Test (MAT): logical reasoning, series, analogies, coding-decoding, quantitative aptitude for Nepal MEC CEE'};
const PLAN={physics:50,chemistry:50,biology:80,mental_agility:20};

const {data:subs}=await admin.from('subjects').select('id,name');
const {data:chs}=await admin.from('chapters').select('id,subject_id');
const chBySub={}; chs.forEach(c=>{(chBySub[c.subject_id]=chBySub[c.subject_id]||[]).push(c.id);});
const subByName={}; subs.forEach(s=>subByName[s.name]=s.id);

async function chunk(label,n,avoid){
  const prompt=`Generate ${n} high-quality, factually-correct, exam-accurate MCQs for ${label}. Exactly 4 distinct options, one correct. Mix difficulty. Return ONLY JSON {"questions":[{"question":"...","options":["o1","o2","o3","o4"],"correct":"A","explanation":"...","difficulty":"easy|medium|hard"}]}. Avoid repeating: ${avoid.slice(-15).join(' | ').slice(0,1500)}`;
  const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+KEY},body:JSON.stringify({model:'gpt-4o',messages:[{role:'user',content:prompt}],temperature:0.85,response_format:{type:'json_object'}})});
  const j=await r.json(); if(!r.ok){console.log('  err',j.error?.message);return[];}
  try{const p=JSON.parse(j.choices[0].message.content);const arr=Array.isArray(p)?p:(p.questions||Object.values(p).find(Array.isArray)||[]);return arr;}catch{return[];}
}

let grand=0;
for(const [name,target] of Object.entries(PLAN)){
  const sid=subByName[name]; const chapters=chBySub[sid]||[];
  const {data:ex}=await admin.from('questions').select('question_text').eq('subject_id',sid);
  const seen=new Set((ex||[]).map(q=>q.question_text.trim().toLowerCase()));
  const toInsert=[]; const avoid=[];
  let guard=0;
  while(toInsert.length<target && guard<Math.ceil(target/20)+3){
    guard++;
    const need=Math.min(20,target-toInsert.length);
    const items=await chunk(LABEL[name],need,avoid);
    if(!items.length)break;
    for(const q of items){
      if(!q.question||!Array.isArray(q.options)||q.options.length<4||!q.correct)continue;
      const key=String(q.question).trim().toLowerCase(); if(seen.has(key))continue; seen.add(key);
      const L=String(q.correct).trim().toUpperCase().replace(/[^A-D]/g,'').slice(0,1); if(!L)continue;
      avoid.push(String(q.question).slice(0,60));
      toInsert.push({question_text:q.question,options:q.options.slice(0,4).map(String),correct_answer:L,explanation:q.explanation||'',difficulty:['easy','medium','hard'].includes(q.difficulty)?q.difficulty:'medium',subject_id:sid,chapter_id:chapters.length?chapters[Math.floor(Math.random()*chapters.length)]:null,is_published:true});
    }
  }
  // insert in batches of 50
  for(let i=0;i<toInsert.length;i+=50){const b=toInsert.slice(i,i+50);const {error}=await admin.from('questions').insert(b);if(error){console.log(name,'insert err',error.message);break;}}
  console.log('✅ '+name+': +'+toInsert.length); grand+=toInsert.length;
}
const {count}=await admin.from('questions').select('*',{count:'exact',head:true});
console.log('\nGenerated '+grand+' new | total questions in DB: '+count);

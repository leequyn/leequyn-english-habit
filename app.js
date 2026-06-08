const data=[
  ['Dễ - làm quen','https://learningenglish.voanews.com/z/3521','https://www.newsinlevels.com/','What did I do today?'],
  ['Dễ - lặp lại','https://learningenglish.voanews.com/z/3521','https://www.newsinlevels.com/','Describe my current job.'],
  ['Dễ - củng cố','https://www.youtube.com/@VOALearningEnglish','https://www.newsinlevels.com/','Why do I want to improve English?'],
  ['Trung bình - công việc','https://www.youtube.com/@SpeakEnglishWithVanessa','https://breakingnewsenglish.com/','What project am I working on now?'],
  ['Trung bình - AI/công nghệ','https://www.youtube.com/@OpenAI','https://openai.com/news/','How can AI help my work?'],
  ['Ôn tập thông minh','https://learningenglish.voanews.com/','https://www.newsinlevels.com/','What did I learn this week?'],
  ['Tổng kết & thiết kế tuần sau','https://www.youtube.com/@VOALearningEnglish','https://breakingnewsenglish.com/','My goals for next week.']
];

const listen=['Nghe 1 bài/video không nhìn transcript.','Trả lời: bài nói về chủ đề gì?','Nghe lại đoạn khó nhất.','Ghi 3 từ/cụm từ nghe được.'];
const read=['Đọc 1 bài phù hợp trình độ.','Đọc lần 1 để nắm ý chính.','Tóm tắt ai/cái gì/vì sao/kết quả.','Tra tối đa 5 từ.'];
const speak=['Nói 2-4 phút.','Không dừng để tra từ.','Thiếu từ thì diễn đạt vòng.','Ghi lại 3 câu muốn nói tốt hơn.'];

let current=+(localStorage.currentDay||1);
const keyC='englishHabitChecksV2';
const keyN='englishHabitNotesV2';
const keyA='englishHabitActivityV5';
const keyU='englishHabitShieldUsedV5';

const getObj=(key)=>JSON.parse(localStorage.getItem(key)||'{}');
const setObj=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
const getArr=(key)=>JSON.parse(localStorage.getItem(key)||'[]');
const setArr=(key,value)=>localStorage.setItem(key,JSON.stringify([...new Set(value)]));

function checks(){return getObj(keyC)}
function notes(){return getObj(keyN)}
function activity(){return getObj(keyA)}
function used(){return getArr(keyU)}
function dateStr(d=new Date()){return d.toISOString().slice(0,10)}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
function moduleCount(arr){return [arr.slice(0,4),arr.slice(4,8),arr.slice(8,13)].filter(group=>group.some(Boolean)).length}

function markActive(count){
  if(!count)return;
  const active=activity();
  const today=dateStr();
  active[today]=Math.max(active[today]||0,count);
  setObj(keyA,active);
}

function shieldsEarned(){return Math.min(3,Math.floor(Object.keys(activity()).length/7))}
function shieldsLeft(){return Math.max(0,shieldsEarned()-used().length)}

function computeStreak(){
  const active=activity();
  const shieldUsed=used();
  let total=0;
  let day=new Date();
  let lastWasShield=false;
  let available=shieldsLeft();
  while(true){
    const key=dateStr(day);
    if(active[key]){
      total++;
      lastWasShield=false;
      day=addDays(day,-1);
      continue;
    }
    if(available>0 && !lastWasShield && !shieldUsed.includes(key)){
      available--;
      total++;
      lastWasShield=true;
      day=addDays(day,-1);
      continue;
    }
    break;
  }
  return total;
}

function maybeUseShield(){
  const active=activity();
  const shieldUsed=used();
  let day=new Date();
  let available=shieldsLeft();
  let lastWasShield=false;
  while(true){
    const key=dateStr(day);
    if(active[key]){
      lastWasShield=false;
      day=addDays(day,-1);
      continue;
    }
    if(available>0 && !lastWasShield && !shieldUsed.includes(key)){
      shieldUsed.push(key);
      setArr(keyU,shieldUsed);
      return;
    }
    break;
  }
}

function isDone(day){
  const c=checks()[day]||[];
  return c.length>=13 && c.every(Boolean);
}

function firstUnfinishedDay(){
  const index=data.findIndex((_,i)=>!isDone(i+1));
  return index===-1?data.length:index+1;
}

function doneCount(){return data.filter((_,i)=>isDone(i+1)).length}
function progressFor(day){
  const c=checks()[day]||[];
  return Math.round((c.filter(Boolean).length/13)*100)||0;
}

function saveDay(){
  const c=checks();
  const n=notes();
  const dayChecks=[...document.querySelectorAll('input[type=checkbox]')].map(x=>x.checked);
  c[current]=dayChecks;
  n[current]=[...document.querySelectorAll('textarea')].map(x=>x.value);
  setObj(keyC,c);
  setObj(keyN,n);
  markActive(moduleCount(dayChecks));
  updateNav();
}

function updateNav(){
  maybeUseShield();
  const done=doneCount();
  const target=firstUnfinishedDay();
  document.getElementById('streakMetric').textContent=computeStreak();
  document.getElementById('lessonMetric').textContent=done+'/7';
  document.getElementById('shieldMetric').textContent=shieldsLeft();
  document.getElementById('bar').style.width=(done/7*100)+'%';
  document.getElementById('streakText').textContent=done+'/7';
  document.getElementById('continueText').textContent=`Tiếp tục: Day ${target} (${progressFor(target)}%)`;
  renderDays();
  renderHeatmap();
}

function renderDays(){
  const html=data.map((item,i)=>`<button class="dayBtn ${i+1===current?'active':''} ${isDone(i+1)?'done':''}" onclick="go(${i+1})"><span class="row"><b>Day ${i+1}</b><span class="badge">${isDone(i+1)?'Done':'Open'}</span></span><span class="small">${item[0]} · ${progressFor(i+1)}%</span></button>`).join('');
  document.getElementById('dayList').innerHTML=html;
  document.getElementById('mobileTabs').innerHTML=html;
}

function renderHeatmap(){
  const active=activity();
  let html='';
  for(let i=27;i>=0;i--){
    const day=addDays(new Date(),-i);
    const key=dateStr(day);
    const value=active[key]||0;
    html+=`<div class="cell ${value?'lvl'+value:''}" data-tip="${key}\n${value?'Có học ✓':'Không học'}\nProgress: ${Math.round(value/3*100)}%"></div>`;
  }
  document.getElementById('heatGrid').innerHTML=html;
}

function block(icon,title,link,items,placeholder){
  return `<div class="task card"><h3>${icon} ${title}</h3>${link?`<p><a href="${link}" target="_blank">Mở nguồn học</a></p>`:''}${items.map(t=>`<label><input type="checkbox"> ${t}</label>`).join('')}<textarea placeholder="${placeholder}"></textarea></div>`;
}

function render(){
  const item=data[current-1];
  const c=checks()[current]||[];
  const n=notes()[current]||[];
  document.getElementById('levelText').textContent=item[0];
  document.getElementById('dayTitle').textContent='Ngày '+current;
  document.getElementById('tasks').innerHTML=
    block('🎧','Listening',item[1],listen,'Video nói về gì? Hiểu bao nhiêu %?')+
    block('📖','Reading',item[2],read,'Tóm tắt bài đọc và ghi từ mới...')+
    block('🎤','Speaking',null,[`Chủ đề: ${item[3]}`,...speak],'Ghi 3 câu muốn nói tốt hơn...');
  document.getElementById('completeBox').innerHTML=`<label><input type="checkbox"> <b>Hoàn thành Ngày ${current}</b> — bài này đã xong 100%.</label>`;
  document.querySelectorAll('input[type=checkbox]').forEach((x,i)=>{x.checked=!!c[i];x.onchange=saveDay});
  document.querySelectorAll('textarea').forEach((x,i)=>{x.value=n[i]||'';x.oninput=saveDay});
  document.getElementById('prevBtn').disabled=current===1;
  document.getElementById('nextBtn').disabled=current===7;
  localStorage.currentDay=current;
  updateNav();
}

function go(day){current=day;render()}
document.getElementById('prevBtn').onclick=()=>{if(current>1)go(current-1)};
document.getElementById('nextBtn').onclick=()=>{if(current<7)go(current+1)};
document.getElementById('startBtn').onclick=()=>{go(firstUnfinishedDay());setTimeout(()=>document.getElementById('studyArea').scrollIntoView({behavior:'smooth',block:'start'}),50)};
render();
import * as THREE from '/public/vendor/three165/three.module.min.js';
import { GLTFLoader } from '/public/vendor/three165/GLTFLoader.js';

const roomUrl='/public/assets/rec_room_wedding.glb';
const chapters=[
  ['Discover Cairo','اكتشف القاهرة','#/',-.5,.34,23,-5,5],
  ['Plan the space','خطط للمكان','seating',0,.55,18,0,1],
  ['Compare venues','قارن القاعات','#/compare',.7,.37,22,5,0],
  ['Choose a date','اختر التاريخ','#/',-1.3,.42,21,-6,-3],
  ['Send a request','أرسل طلبًا','#/requests',2.5,.43,22,-2,-6],
  ['Vendor workspace','مساحة المورد','#/vendor',1.7,.48,23,6,-4],
  ['Admin review','مراجعة الإدارة','#/admin',0,1.08,29,0,5]
];
const chapterCopy={
  en:[['Find venues across Cairo by date, guests and budget.','Search venues'],['Arrange tables and seats in your saved plan.','Open seating chart'],['Compare venues side by side.','Compare venues'],['Check a venue’s date and session before requesting.','Explore venues'],['Follow the status of your venue inquiries.','My requests'],['Manage listings and incoming requests.','Vendor dashboard'],['Review submitted venue details.','Admin review']],
  ar:[['ابحث عن القاعات في القاهرة حسب التاريخ والضيوف والميزانية.','ابحث عن قاعة'],['رتب الطاولات والمقاعد في خطتك المحفوظة.','افتح مخطط الجلوس'],['قارن القاعات جنبًا إلى جنب.','قارن القاعات'],['تحقق من تاريخ القاعة والفترة قبل إرسال الطلب.','تصفح القاعات'],['تابع حالة استفسارات القاعات.','طلباتي'],['أدر الإعلانات والطلبات الواردة.','لوحة المورد'],['راجع بيانات القاعات المقدمة.','مراجعة الإدارة']]
};

function disposeModel(model) {
  const geometries=new Set(),materials=new Set(),textures=new Set();
  model?.traverse(node=>{
    if(node.geometry)geometries.add(node.geometry);
    for(const material of [node.material].flat().filter(Boolean)){
      materials.add(material);
      for(const value of Object.values(material))if(value?.isTexture)textures.add(value);
    }
  });
  textures.forEach(item=>item.dispose());
  materials.forEach(item=>item.dispose());
  geometries.forEach(item=>item.dispose());
}

export function mountOriginalRoom3D(host,{lang='en'}={}) {
  const viewport=host.querySelector('.room-3d-canvas'),status=host.querySelector('.room-3d-status');
  const request=new AbortController();
  let cancelled=false,renderer,observer,model,frame=0,tourTimer=0,active=0,auto=false,audioContext,muted=true,collapsed=false;
  const events=new AbortController();
  const state={yaw:-.5,pitch:.34,distance:23,targetY:2.5},destination={...state},pointer={x:0,y:0,active:false};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pins=document.createElement('div'),panel=document.createElement('div'),dock=document.createElement('div'),loading=document.createElement('div');
  pins.className='room-tour-pins';panel.className='room-tour-panel';panel.setAttribute('aria-live','polite');dock.className='room-tour-dock';loading.className='room-tour-loading';
  loading.textContent=lang==='ar'?'جاري تحميل مشهد الفرح…':'Loading wedding scene…';
  viewport.append(pins,panel,dock,loading);
  pins.innerHTML=chapters.map((chapter,index)=>`<button type="button" data-tour-chapter="${index}" aria-label="${lang==='ar'?chapter[1]:chapter[0]}" title="${lang==='ar'?chapter[1]:chapter[0]}">${String(index+1).padStart(2,'0')}</button>`).join('');
  const renderUI=()=>{
    const ch=chapters[active],ar=lang==='ar';
    const [detail,action]=chapterCopy[ar?'ar':'en'][active];
    panel.innerHTML=`<span class="room-tour-count">${String(active+1).padStart(2,'0')} / 07</span><button class="room-tour-collapse" type="button" data-tour="collapse" aria-label="${collapsed?(ar?'توسيع':'Expand'):(ar?'طي':'Collapse')}" aria-expanded="${!collapsed}">${collapsed?'+':'−'}</button><strong>${ar?ch[1]:ch[0]}</strong>${collapsed?'':`<p>${detail}</p><a class="button" href="${ch[2]==='seating'?(location.hash.startsWith('#/plans/')?location.hash.replace(/\?view=.*/,'')+'?view=seating':'#/plans'):ch[2]}">${action} ↗</a>`}`;
    dock.innerHTML=`<button type="button" data-tour="auto" aria-pressed="${auto}">${auto?(ar?'إيقاف':'Pause'):(ar?'تشغيل الجولة':'Play tour')}</button><button type="button" data-tour="prev" aria-label="${ar?'السابق':'Previous'}">‹</button><div class="room-tour-steps" role="group" aria-label="${ar?'محطات الجولة':'Tour chapters'}">${chapters.map((item,index)=>`<button type="button" data-tour-chapter="${index}" aria-label="${ar?item[1]:item[0]}" aria-current="${index===active?'step':'false'}" title="${ar?item[1]:item[0]}">${String(index+1).padStart(2,'0')}<span>${ar?item[1]:item[0]}</span></button>`).join('')}</div><button type="button" data-tour="next" aria-label="${ar?'التالي':'Next'}">›</button><button type="button" data-tour="reset">${ar?'إعادة ضبط':'Reset view'}</button><div class="room-tour-roles" role="group" aria-label="${ar?'الدور':'View by role'}">${[[0,ar?'عميل':'Couple'],[5,ar?'مورد':'Vendor'],[6,ar?'إدارة':'Admin']].map(([index,label])=>`<button type="button" data-tour-chapter="${index}" aria-label="${label}" aria-pressed="${active===index}">${label}</button>`).join('')}</div>`;
    host.querySelector('[data-scene-sound]')?.setAttribute('aria-pressed',String(!muted));
  };
  renderUI();
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x0e0d0c);
  const camera=new THREE.PerspectiveCamera(45,1,.1,300);
  const ambient=new THREE.HemisphereLight(0xfff3e2,0x241c18,1.7);scene.add(ambient);
  const sun=new THREE.DirectionalLight(0xffd9a3,2.2);sun.position.set(-12,22,16);scene.add(sun);
  const fill=new THREE.DirectionalLight(0xcbd8e8,.8);fill.position.set(15,14,-12);scene.add(fill);
  const moods={golden:[0x0e0d0c,0xfff3e2,0xffd9a3,1.7,2.2],sunrise:[0x161719,0xfff8f1,0xffc4c8,1.7,1.9],midnight:[0x080a12,0xb8c3e8,0xa9b9ee,1.1,1.4]};
  const draw=()=>{if(!renderer)return;const {yaw,pitch,distance,targetY}=state;camera.position.set(Math.sin(yaw)*Math.cos(pitch)*distance,targetY+Math.sin(pitch)*distance,Math.cos(yaw)*Math.cos(pitch)*distance);camera.lookAt(0,targetY,0);renderer.render(scene,camera);pins.querySelectorAll('button').forEach(button=>{const ch=chapters[Number(button.dataset.tourChapter)],point=new THREE.Vector3(ch[6],Math.max(1,targetY*.7),ch[7]);const inFront=point.clone().sub(camera.position).dot(camera.getWorldDirection(new THREE.Vector3()))>0;point.project(camera);button.hidden=!inFront||Math.abs(point.x)>.9||Math.abs(point.y)>.88||point.z>=1;if(!button.hidden){button.style.left=`${(point.x*.5+.5)*viewport.clientWidth}px`;button.style.top=`${(-point.y*.5+.5)*viewport.clientHeight}px`;}});};
  const resize=()=>{if(!renderer)return;const width=Math.max(1,viewport.clientWidth),height=Math.max(1,viewport.clientHeight);camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);draw();};
  const setMood=mode=>{const [background,ambientColor,sunColor,ambientPower,sunPower]=moods[mode];scene.background.setHex(background);ambient.color.setHex(ambientColor);ambient.intensity=ambientPower;sun.color.setHex(sunColor);sun.intensity=sunPower;host.querySelectorAll('[data-scene-atmosphere]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.sceneAtmosphere===mode)));draw();};
  const animate=()=>{frame=0;for(const key of ['yaw','pitch','distance','targetY'])state[key]+=(destination[key]-state[key])*.09;draw();if(['yaw','pitch','distance','targetY'].some(key=>Math.abs(destination[key]-state[key])>.005))frame=requestAnimationFrame(animate);else{Object.assign(state,destination);draw();}};
  const flyTo=()=>{const ch=chapters[active];Object.assign(destination,{yaw:ch[3],pitch:ch[4],distance:ch[5],targetY:state.targetY});cancelAnimationFrame(frame);if(reduced){Object.assign(state,destination);draw();}else frame=requestAnimationFrame(animate);};
  const chime=()=>{if(muted||!audioContext)return;const note=audioContext.createOscillator(),gain=audioContext.createGain();note.type='sine';note.frequency.value=880;gain.gain.setValueAtTime(.025,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+.18);note.connect(gain).connect(audioContext.destination);note.start();note.stop(audioContext.currentTime+.2);};
  const select=index=>{active=(index+chapters.length)%chapters.length;renderUI();flyTo();chime();};
  const stopTour=()=>{auto=false;clearInterval(tourTimer);renderUI();};
  const toggleTour=()=>{if(auto){stopTour();return;}auto=true;renderUI();select(active);tourTimer=setInterval(()=>select(active+1),7500);};
  host.addEventListener('click',event=>{const chapter=event.target.closest('[data-tour-chapter]');if(chapter){select(Number(chapter.dataset.tourChapter));return;}const tour=event.target.closest('[data-tour]')?.dataset.tour;if(tour==='collapse'){collapsed=!collapsed;renderUI();return;}if(tour==='auto'){toggleTour();return;}if(tour==='prev'||tour==='next'){select(active+(tour==='next'?1:-1));return;}if(tour==='reset'){flyTo();return;}if(event.target.closest('[data-scene-sound]')){muted=!muted;if(!muted){audioContext??=new (window.AudioContext||window.webkitAudioContext)();audioContext.resume();chime();}renderUI();return;}if(event.target.closest('[data-scene-fullscreen]')){if(document.fullscreenElement===host)document.exitFullscreen();else host.requestFullscreen?.();return;}const zoom=event.target.closest('[data-scene-zoom]')?.dataset.sceneZoom;if(zoom){state.distance=Math.max(3,Math.min(100,state.distance+(zoom==='in'?-4:4)));draw();return;}const mood=event.target.closest('[data-scene-atmosphere]')?.dataset.sceneAtmosphere;if(mood&&moods[mood]){setMood(mood);return;}const view=event.target.closest('[data-scene-view]')?.dataset.sceneView;if(view==='top'){state.yaw=0;state.pitch=1.54;state.distance=30;draw();}else if(view==='perspective')flyTo();},{signal:events.signal});
  window.addEventListener('keydown',event=>{if(!host.isConnected||!renderer||/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)||event.altKey||event.ctrlKey||event.metaKey)return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();select(active+(event.key==='ArrowRight'?1:-1));}else if(event.code==='Space'&&document.activeElement?.tagName!=='BUTTON'){event.preventDefault();toggleTour();}},{signal:events.signal});

  (async()=>{
    try {
      status.textContent=lang==='ar'?'جاري تحميل مشهد الفرح الأصلي (٨٧ ميجابايت)…':'Loading original wedding scene (87 MB)…';
      const response=await fetch(roomUrl,{signal:request.signal});
      if(!response.ok)throw new Error('Model unavailable');
      const length=Number(response.headers.get('content-length'));
      let bytes;
      if(response.body&&length>0){
        const reader=response.body.getReader(),buffer=new Uint8Array(length);let offset=0;
        while(true){const {done,value}=await reader.read();if(done)break;buffer.set(value,offset);offset+=value.length;loading.textContent=(lang==='ar'?'جاري تحميل المشهد ':'Loading scene ')+Math.min(100,Math.round(offset/length*100))+'%';}
        if(offset!==length)throw new Error('Incomplete model download');
        bytes=buffer.buffer;
      }else bytes=await response.arrayBuffer();
      if(cancelled)return;
      status.textContent=lang==='ar'?'جاري تجهيز تفاصيل القاعة…':'Preparing the detailed room…';
      loading.textContent=lang==='ar'?'جاري تجهيز تفاصيل المشهد…':'Preparing scene details…';
      const gltf=await new GLTFLoader().parseAsync(bytes,'');
      if(cancelled){disposeModel(gltf.scene);return;}
      model=gltf.scene;
      const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
      if(!Number.isFinite(size.x+size.y+size.z)||Math.max(size.x,size.y,size.z)<=0)throw new Error('Invalid model bounds');
      model.scale.setScalar(18/Math.max(size.x,size.z));
      bounds.setFromObject(model);
      const center=bounds.getCenter(new THREE.Vector3());
      model.position.set(-center.x,-bounds.min.y,-center.z);
      state.targetY=Math.max(1,bounds.getSize(new THREE.Vector3()).y*.22);
      destination.targetY=state.targetY;
      scene.add(model);
      renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
      renderer.toneMapping=THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure=1.65;
      renderer.outputColorSpace=THREE.SRGBColorSpace;
      viewport.prepend(renderer.domElement);
      observer=new ResizeObserver(resize);observer.observe(viewport);
      const signal=events.signal;
      renderer.domElement.style.touchAction='none';
      const pointers=new Map();let pinchDistance=0;
      const twoFingerDist=()=>{const [a,b]=[...pointers.values()];return a&&b?Math.hypot(a.x-b.x,a.y-b.y):0;};
      renderer.domElement.addEventListener('pointerdown',event=>{
        stopTour();cancelAnimationFrame(frame);
        pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
        if(pointers.size===1){pointer.active=true;pointer.x=event.clientX;pointer.y=event.clientY;}
        else if(pointers.size===2){pointer.active=false;pinchDistance=twoFingerDist();}
        renderer.domElement.setPointerCapture?.(event.pointerId);
      },{signal});
      renderer.domElement.addEventListener('pointermove',event=>{
        if(pointers.has(event.pointerId))pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
        if(pointers.size===2){
          const nextDist=twoFingerDist();
          if(pinchDistance>0&&nextDist>0){
            state.distance=Math.max(3,Math.min(100,state.distance+(pinchDistance-nextDist)*.1));
            draw();
          }
          pinchDistance=nextDist;
          return;
        }
        if(!pointer.active)return;
        state.yaw+=(event.clientX-pointer.x)*.008;state.pitch=Math.max(.08,Math.min(1.54,state.pitch+(event.clientY-pointer.y)*.008));pointer.x=event.clientX;pointer.y=event.clientY;draw();
      },{signal});
      renderer.domElement.addEventListener('pointerup',event=>{
        pointers.delete(event.pointerId);if(pointers.size<2)pinchDistance=0;
        pointer.active=pointers.size===1;
        if(pointer.active){const rem=[...pointers.values()][0];pointer.x=rem.x;pointer.y=rem.y;}
      },{signal});
      renderer.domElement.addEventListener('pointercancel',event=>{
        pointers.delete(event.pointerId);if(pointers.size<2)pinchDistance=0;pointer.active=false;
      },{signal});
      renderer.domElement.addEventListener('wheel',event=>{event.preventDefault();state.distance=Math.max(3,Math.min(100,state.distance+Math.sign(event.deltaY)*2));draw();},{passive:false,signal});
      status.hidden=true;loading.remove();resize();
    } catch(error) {
      if(!cancelled){status.textContent=lang==='ar'?'تعذر فتح المشهد الأصلي. جرّب مرة أخرى أو استخدم عرض خطتك ثلاثي الأبعاد.':'Could not open the original scene. Try again or use your layout’s 3D view.';loading.textContent=status.textContent;}
    }
  })();
  return ()=>{cancelled=true;request.abort();events.abort();clearInterval(tourTimer);cancelAnimationFrame(frame);observer?.disconnect();audioContext?.close();disposeModel(model);renderer?.dispose();renderer?.domElement.remove();pins.remove();panel.remove();dock.remove();loading.remove();};
}

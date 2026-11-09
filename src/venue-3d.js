import { seatPositions, planningWords } from './planning-views.js';

let threePromise;
export function loadThree() {
  if (!threePromise) threePromise = new Promise((resolve, reject) => {
    if (window.THREE) { resolve(window.THREE); return; }
    const script = document.createElement('script');
    script.src = '/public/vendor/three.min.js';
    script.onload = () => window.THREE?resolve(window.THREE):reject(new Error('3D library did not initialize'));
    script.onerror = () => reject(new Error('3D library unavailable'));
    document.head.append(script);
  }).catch(error=>{threePromise=null;throw error;});
  return threePromise;
}

export function previewLayout(kind='wedding') {
  const conference=kind==='conference',mixed=kind==='mixed',outdoor=['garden','courtyard'].includes(kind);
  const tables=Array.from({length:mixed?6:conference?8:10},(_,index)=>({
    label:String(index+1),shape:conference||mixed&&index%2?'rect':'round',seats:conference?10:8,
    x:140+(index%5)*180,y:190+Math.floor(index/5)*220,
    assignments:Array(conference?10:8).fill(null)
  }));
  const features=conference?[{kind:'stage',x:500,y:75,width:250,height:90},{kind:'screen',x:500,y:55,width:180,height:50},{kind:'entrance',x:500,y:650,width:120,height:55}]
    :mixed?[{kind:'stage',x:500,y:75,width:220,height:90},{kind:'buffet',x:900,y:475,width:130,height:80},{kind:'entrance',x:500,y:650,width:120,height:55}]
    :[{kind:'stage',x:500,y:75,width:220,height:90},{kind:'dance',x:500,y:540,width:170,height:100},{kind:'buffet',x:900,y:475,width:130,height:80},{kind:'entrance',x:500,y:650,width:120,height:55}];
  return {tables,features,environment:outdoor?'outdoor':'indoor'};
}

export function mountRoom3D(host,layout,{lang='en'}={}) {
  if(host.dataset.originalRoom!==undefined){
    let cancelled=false,dispose=()=>{};
    import('./original-room-3d.js').then(module=>{if(!cancelled)dispose=module.mountOriginalRoom3D(host,{lang});}).catch(()=>{if(!cancelled)host.querySelector('.room-3d-status').textContent=lang==='ar'?'تعذر فتح المشهد الأصلي.':'Could not open the original scene.';});
    return ()=>{cancelled=true;dispose();};
  }
  let cancelled=false,dispose=()=>{};
  const viewport=host.querySelector('.room-3d-canvas');
  const status=host.querySelector('.room-3d-status');
  const guided=host.hasAttribute('data-plan-preview');
  loadThree().then(THREE=>{
    if(cancelled)return;
    let renderer;
    try { renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'}); }
    catch { status.textContent=lang==='ar'?'عرض 3D غير متاح على هذا الجهاز. استخدم مخطط 2D.':'3D is unavailable on this device. Use the 2D chart.';return; }
    const resources=new Set(),track=item=>(resources.add(item),item);
    const outdoor=layout.environment==='outdoor';
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x0e0d0c);scene.fog=new THREE.FogExp2(0x0e0d0c,.012);
    const camera=new THREE.PerspectiveCamera(45,1,.1,120);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.05;
    if(THREE.SRGBColorSpace)renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.setClearColor(0x0e0d0c);
    viewport.append(renderer.domElement);
    const ambient=new THREE.HemisphereLight(0xffebd2,0x1a1614,1.3);scene.add(ambient);
    const sun=new THREE.DirectionalLight(0xffdfaf,.85);sun.position.set(-6,12,10);scene.add(sun);
    const atmospheres={golden:[0x0e0d0c,0xffebd2,0xffd599,1.3,2.6],sunrise:[0x0a0c10,0xfff0f5,0xffcdd2,1.2,2.2],midnight:[0x050608,0x9fa8da,0xc5cae9,.7,1.2]};
    const setAtmosphere=mode=>{const [background,ambientColor,sunColor,ambientPower,sunPower]=atmospheres[mode];scene.background.setHex(background);scene.fog.color.setHex(background);renderer.setClearColor(background);ambient.color.setHex(ambientColor);ambient.intensity=ambientPower;sun.color.setHex(sunColor);sun.intensity=sunPower;host.querySelectorAll('[data-scene-atmosphere]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.sceneAtmosphere===mode)));};
    setAtmosphere('golden');
    const material=(color,roughness=.82)=>track(new THREE.MeshStandardMaterial({color,roughness}));
    const stone=material(outdoor?0x8fb18a:0xd6bda1),wall=material(0xd9bd9c),accent=material(0x875f49),tabletop=material(0xf0dfc2),chair=material(0x276f66),assigned=material(0xc95e70),floorTrim=material(0x99765a),glass=material(0x7cb0b4);
    const box=(width,height,depth,mat,x,y,z)=>{const mesh=new THREE.Mesh(track(new THREE.BoxGeometry(width,height,depth)),mat);mesh.position.set(x,y,z);scene.add(mesh);return mesh;};
    const cylinder=(top,bottom,height,mat,x,y,z,segments=20)=>{const mesh=new THREE.Mesh(track(new THREE.CylinderGeometry(top,bottom,height,segments)),mat);mesh.position.set(x,y,z);scene.add(mesh);return mesh;};
    const label=(text,x,y,z,width=.8)=>{
      const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;
      const pen=canvas.getContext('2d');pen.fillStyle='#163c38';pen.fillRect(0,0,256,64);pen.fillStyle='#fff';pen.font='bold 29px sans-serif';pen.textAlign='center';pen.textBaseline='middle';pen.fillText(String(text).slice(0,18),128,34,240);
      const sprite=new THREE.Sprite(track(new THREE.SpriteMaterial({map:track(new THREE.CanvasTexture(canvas)),depthTest:false})));sprite.position.set(x,y,z);sprite.scale.set(width,.32,1);scene.add(sprite);
    };
    box(20,.16,14,stone,0,-.08,0);
    if(outdoor){
      const hedge=material(0x5d8b63),leaves=material(0x3f7956);
      box(20,1,.4,hedge,0,.5,-7);
      box(.4,1,14,hedge,-10,.5,0);
      box(.4,1,14,hedge,10,.5,0);
      for(const x of [-8,-4,4,8]){cylinder(.12,.16,1.8,accent,x,.9,-6.45,8);const crown=new THREE.Mesh(track(new THREE.SphereGeometry(.9,10,8)),leaves);crown.position.set(x,2.15,-6.45);scene.add(crown);}
    }else{
      const grid=new THREE.GridHelper(20,20,0xb99c7c,0xc8ae91);grid.position.y=.015;scene.add(grid);
      box(20,4.5,.18,wall,0,2.25,-7);
      box(.18,4.5,14,wall,-10,2.25,0);
      box(.18,4.5,14,wall,10,2.25,0);
      box(20,.08,.2,floorTrim,0,.03,-6.85);
      for(const x of [-6,0,6]){box(2.2,2.6,.07,glass,x,2.35,-6.87);box(2.45,.12,.12,accent,x,3.7,-6.82);}
    }
    const colors={stage:0xc8926d,dance:0xe9a9bb,buffet:0x8eb394,entrance:0x8aa9c3,aisle:0xd3b797,screen:0x667991};
    for(const item of layout.features||[]){
      const x=(item.x-500)/50,z=(item.y-350)/50,w=item.width/50,d=item.height/50,mat=material(colors[item.kind]||0xc9a884);
      if(item.kind==='screen'){box(w,1.7,.12,mat,x,2.1,z);box(w+.15,.12,.2,accent,x,3.02,z);}
      else if(item.kind==='buffet'){box(w,.16,d,mat,x,.85,z);for(const dx of [-w/2+.16,w/2-.16])for(const dz of [-d/2+.16,d/2-.16])box(.1,.78,.1,accent,x+dx,.4,z+dz);}
      else box(w,item.kind==='stage'?.34:.08,d,mat,x,item.kind==='stage'?.17:.04,z);
      label(item.label||planningWords(lang)[item.kind]||item.kind,x,item.kind==='screen'?3.35:1.18,z,1.25);
    }
    const chairGroups={empty:[],assigned:[]},tableBodies=[];
    const selectedTabletop=material(0xf2b544);
    for(const [tableIndex,table] of (layout.tables||[]).entries()){
      const x=(table.x-500)/50,z=(table.y-350)/50;
      let body;
      if(table.shape==='round'){body=cylinder(.72,.72,.14,tabletop,x,.78,z);cylinder(.12,.12,.7,accent,x,.37,z);}
      else {const top=Math.ceil((table.seats-2)/2),bottom=Math.floor((table.seats-2)/2),width=Math.max(120,Math.max(top,bottom)*23+32)/50;body=box(width,.14,1.28,tabletop,x,.78,z);box(.18,.7,.18,accent,x,.38,z);}
      body.userData.tableIndex=tableIndex;tableBodies.push(body);
      label(table.label,x,1.32,z);
      seatPositions(table).forEach(({x:dx,y:dz},index)=>{
        chairGroups[table.assignments?.[index]?'assigned':'empty'].push({x:x+dx/50,z:z+dz/50,back:dz<0?-.13:.13});
      });
    }
    const seatGeometry=track(new THREE.BoxGeometry(.29,.09,.29)),backGeometry=track(new THREE.BoxGeometry(.28,.44,.07)),dummy=new THREE.Object3D();
    for(const [group,positions] of Object.entries(chairGroups)){
      if(!positions.length)continue;
      const mat=group==='assigned'?assigned:chair,seatMesh=new THREE.InstancedMesh(seatGeometry,mat,positions.length),backMesh=new THREE.InstancedMesh(backGeometry,mat,positions.length);
      positions.forEach((position,index)=>{dummy.position.set(position.x,.46,position.z);dummy.updateMatrix();seatMesh.setMatrixAt(index,dummy.matrix);dummy.position.set(position.x,.69,position.z+position.back);dummy.updateMatrix();backMesh.setMatrixAt(index,dummy.matrix);});
      seatMesh.instanceMatrix.needsUpdate=true;backMesh.instanceMatrix.needsUpdate=true;seatMesh.frustumCulled=false;backMesh.frustumCulled=false;scene.add(seatMesh,backMesh);
    }
    const state={yaw:guided?0:.55,pitch:guided?1.5:.58,distance:guided?28:27,targetX:0,targetY:0,targetZ:0},destination={...state};
    const pointer={x:0,y:0,startX:0,startY:0,active:false};
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
    let animation=0,activeStop=guided?'overview':'';
    const draw=()=>{const {yaw,pitch,distance,targetX,targetY,targetZ}=state;camera.position.set(targetX+Math.sin(yaw)*Math.cos(pitch)*distance,targetY+Math.sin(pitch)*distance,targetZ+Math.cos(yaw)*Math.cos(pitch)*distance);camera.lookAt(targetX,targetY,targetZ);renderer.render(scene,camera);};
    const overheadDistance=()=>Math.max(28,21/(2*Math.tan(camera.fov*Math.PI/360)*Math.max(.35,camera.aspect)));
    const resize=()=>{const width=Math.max(1,viewport.clientWidth),height=Math.max(1,viewport.clientHeight);camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);if(activeStop==='overview')state.distance=overheadDistance();draw();};
    const observer=new ResizeObserver(resize);observer.observe(viewport);
    const events=new AbortController(),signal=events.signal;
    const markStop=name=>{activeStop=name;host.querySelectorAll('[data-scene-stop]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.sceneStop===name)));};
    const aim=(px,py,pz,tx,ty,tz)=>{const dx=px-tx,dy=py-ty,dz=pz-tz;return {yaw:Math.atan2(dx,dz),pitch:Math.atan2(dy,Math.hypot(dx,dz)),distance:Math.hypot(dx,dy,dz),targetX:tx,targetY:ty,targetZ:tz};};
    const animate=()=>{animation=0;for(const key of Object.keys(state))state[key]+=(destination[key]-state[key])*.12;draw();if(Object.keys(state).some(key=>Math.abs(destination[key]-state[key])>.005))animation=requestAnimationFrame(animate);else{Object.assign(state,destination);draw();}};
    const moveTo=next=>{cancelAnimationFrame(animation);Object.assign(destination,next);if(reduced){Object.assign(state,destination);draw();}else animation=requestAnimationFrame(animate);};
    const stopCamera=name=>{
      const feature=kind=>(layout.features||[]).find(item=>item.kind===kind);
      const point=item=>({x:(item.x-500)/50,z:(item.y-350)/50});
      let next;
      if(name==='overview')next={yaw:0,pitch:1.5,distance:overheadDistance(),targetX:0,targetY:0,targetZ:0};
      else if(name==='entrance'){const entrance=point(feature('entrance')||{x:500,y:650});next=aim(Math.max(-7,Math.min(7,entrance.x)),2.6,Math.min(10,entrance.z+3),0,1,-2);}
      else if(name==='stage'){const stage=point(feature('stage')||feature('screen')||{x:500,y:75});next=aim(Math.max(-7,Math.min(7,stage.x+3)),3.1,stage.z+6,stage.x,.8,stage.z);}
      else {const tables=layout.tables||[],x=tables.length?tables.reduce((sum,item)=>sum+(item.x-500)/50,0)/tables.length:0,z=tables.length?tables.reduce((sum,item)=>sum+(item.y-350)/50,0)/tables.length:0;next=aim(0,4.2,10,x*.4,.8,z);}
      markStop(name);moveTo(next);
    };
    const selectTable=index=>{
      const table=layout.tables?.[index],info=host.querySelector('.room-3d-table-info');
      tableBodies.forEach((body,i)=>{body.material=i===index?selectedTabletop:tabletop;});
      if(host.querySelector('[data-scene-table]'))host.querySelector('[data-scene-table]').value=table?String(index):'';
      if(!info)return;
      info.replaceChildren();info.hidden=!table;
      if(!table){draw();return;}
      const heading=document.createElement('h3');heading.textContent=table.label;
      const assigned=(table.assignments||[]).map((id,seat)=>({seat,name:layout.guests?.find(guest=>guest.id===id)?.name})).filter(item=>item.name);
      const summary=document.createElement('p');summary.textContent=`${assigned.length} / ${table.seats} ${lang==='ar'?'مقاعد مخصصة':'assigned seats'}`;
      info.append(heading,summary);
      if(assigned.length){const list=document.createElement('ol');for(const item of assigned){const row=document.createElement('li');row.textContent=`${lang==='ar'?'مقعد':'Seat'} ${item.seat+1}: ${item.name}`;list.append(row);}info.append(list);}
      else{const empty=document.createElement('p');empty.textContent=lang==='ar'?'لم يتم تخصيص ضيوف لهذه الطاولة بعد.':'No guests assigned to this table yet.';info.append(empty);}
      draw();
    };
    renderer.domElement.addEventListener('pointerdown',event=>{cancelAnimationFrame(animation);pointer.active=true;pointer.x=pointer.startX=event.clientX;pointer.y=pointer.startY=event.clientY;renderer.domElement.setPointerCapture(event.pointerId);},{signal});
    renderer.domElement.addEventListener('pointermove',event=>{if(!pointer.active)return;const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;if(dx||dy){state.yaw+=dx*.008;state.pitch=Math.max(.18,Math.min(1.54,state.pitch+dy*.008));markStop('');}pointer.x=event.clientX;pointer.y=event.clientY;draw();},{signal});
    renderer.domElement.addEventListener('pointerup',event=>{pointer.active=false;if(!guided||Math.hypot(event.clientX-pointer.startX,event.clientY-pointer.startY)>6)return;const rect=renderer.domElement.getBoundingClientRect();mouse.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(mouse,camera);const hit=raycaster.intersectObjects(tableBodies)[0];if(hit)selectTable(hit.object.userData.tableIndex);},{signal});
    renderer.domElement.addEventListener('pointercancel',()=>{pointer.active=false;},{signal});
    renderer.domElement.addEventListener('wheel',event=>{event.preventDefault();cancelAnimationFrame(animation);markStop('');state.distance=Math.max(4,Math.min(55,state.distance+Math.sign(event.deltaY)*2));draw();},{passive:false,signal});
    host.addEventListener('click',event=>{const mood=event.target.closest('[data-scene-atmosphere]')?.dataset.sceneAtmosphere;if(mood&&atmospheres[mood]){setAtmosphere(mood);draw();return;}const stop=event.target.closest('[data-scene-stop]')?.dataset.sceneStop;if(stop){stopCamera(stop);return;}const view=event.target.closest('[data-scene-view]')?.dataset.sceneView;if(!view)return;if(view==='top'){state.yaw=0;state.pitch=1.45;state.distance=28;}else{state.yaw=.55;state.pitch=.58;state.distance=27;}draw();},{signal});
    host.addEventListener('change',event=>{if(event.target.matches('[data-scene-table]'))selectTable(event.target.value===''?-1:Number(event.target.value));},{signal});
    status.hidden=true;resize();
    dispose=()=>{events.abort();observer.disconnect();cancelAnimationFrame(animation);for(const item of resources)item.dispose();renderer.dispose();renderer.domElement.remove();};
  }).catch(()=>{if(!cancelled)status.textContent=lang==='ar'?'تعذر تحميل عرض 3D. استخدم مخطط 2D.':'Could not load 3D. Use the 2D chart.';});
  return ()=>{cancelled=true;dispose();};
}

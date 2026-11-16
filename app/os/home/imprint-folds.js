// This renderer draws complete filaments on a folded three-dimensional bundle.
// The depth-only surface hides rear filaments; it contributes no visible pixels.
const TAU = Math.PI * 2;
const unit = a => { const n = Math.hypot(...a) || 1; return a.map(v => v / n); };
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const AREAS = ["starting", "notes", "thoughts", "routine", "log-week", "protocol"];

export function createFoldRecipe(random) {
  const phase = random() * TAU;
  const flip = random() > .5 ? 1 : -1;
  const knots = [
    [335,155,0,67],[360,90,10,62],[415,135,40,78],[405,220,25,82],
    [300,265,0,58],[185,250,-20,70],[125,290,0,88],[130,355,30,94],
    [195,395,45,90],[170,330,10,76],[215,335,-10,68],[250,460,-30,67],
    [165,560,-10,88],[185,650,20,96],[285,700,40,100],[380,640,25,98],
    [365,555,0,91],[270,545,-35,80],[270,625,-50,86],[285,655,-20,84],
    [300,570,25,66],[245,490,40,57],[235,410,55,48],[290,335,65,48],[350,270,45,50],[350,215,35,57],
  ].map(([x,y,z,r], i) => [
    260 + flip * ((x-260) * (.9 + random()*.05) + 9*Math.sin(i*.55+phase)),
    400 + (y-400)*.93 + 7*Math.sin(i*.7+phase), z, r*(.9+random()*.12),
  ]);
  return { version: 3, knots, phase, flatten: .42 + random()*.1, filamentCount: 256 };
}

function curve(knots, t) {
  const n = knots.length;
  const p = ((t % 1 + 1) % 1) * n;
  const i = Math.floor(p), u = p-i;
  const a = knots[(i+n-1)%n], b = knots[i%n], c = knots[(i+1)%n], d = knots[(i+2)%n];
  // Periodic cubic B-spline: continuous curvature keeps the offset filaments
  // smooth through folds, including where the center path crosses a knot.
  const weights=[(1-u)**3,3*u**3-6*u*u+4,-3*u**3+3*u*u+3*u+1,u**3];
  return b.map((_,k)=>(a[k]*weights[0]+b[k]*weights[1]+c[k]*weights[2]+d[k]*weights[3])/6);
}

export function foldFrame(recipe, t) {
  const center = curve(recipe.knots, t);
  const before = curve(recipe.knots, t-.0001), after = curve(recipe.knots,t+.0001);
  const tangent = unit(after.slice(0,3).map((v,i)=>v-before[i]));
  const a = unit(cross(tangent,[0,0,1]));
  const b = unit(cross(tangent,a));
  const twist = .9*Math.sin(t*TAU*3+recipe.phase)+.25*Math.sin(t*TAU*5+recipe.phase);
  const normal = a.map((v,i)=>v*Math.cos(twist)+b[i]*Math.sin(twist));
  const binormal = a.map((v,i)=>-v*Math.sin(twist)+b[i]*Math.cos(twist));
  return { center, normal, binormal };
}

function position(recipe, frame, angle) {
  const {center,normal,binormal} = frame;
  const c = Math.cos(angle), s = Math.sin(angle), radius = center[3];
  const point = center.slice(0,3).map((v,i)=>v+radius*(normal[i]*c+binormal[i]*s*recipe.flatten));
  const face = unit(normal.map((v,i)=>v*c+binormal[i]*s/recipe.flatten));
  return { point, face };
}

export function foldFilament(recipe, index, samples = 576) {
  const angle = index/recipe.filamentCount*TAU;
  const points = [];
  for(let step=0;step<=samples;step++) {
    const t=step/samples;
    const a=angle+.008*Math.sin(t*TAU*3+angle*2);
    const {point,face}=position(recipe,foldFrame(recipe,t),a);
    points.push({ x:point[0], y:point[1], z:point[2], light:.18+.82*Math.max(0,face[0]*-.35+face[1]*-.45+face[2]*.82), front:face[2] });
  }
  return { points, area:AREAS[Math.floor(index/recipe.filamentCount*6)],
    accent:Math.abs((index/(recipe.filamentCount/6)%1)-.45)*2, width:.3+.65*(.5+.5*Math.sin(index*2.17))**2, grain:.35+.65*(.5+.5*Math.sin(index*2.31)) };
}

export function makeFoldScene(recipe, width, height) {
  const sx=width/520, sy=height/800;
  const depth=new Float32Array(width*height).fill(-Infinity);
  const steps=576, around=128;
  const rows=[];
  for(let step=0;step<=steps;step++) {
    const frame=foldFrame(recipe,step/steps);
    const row=[];
    for(let ring=0;ring<=around;ring++) {
      const {point}=position(recipe,frame,ring/around*TAU);
      row.push([point[0]*sx,point[1]*sy,point[2]]);
    }
    rows.push(row);
  }
  const triangle=(a,b,c)=>{
    const minX=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),maxX=Math.min(width-1,Math.ceil(Math.max(a[0],b[0],c[0])));
    const minY=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),maxY=Math.min(height-1,Math.ceil(Math.max(a[1],b[1],c[1])));
    const divisor=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
    if(Math.abs(divisor)<.00001)return;
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
      const u=((b[1]-c[1])*(x+.5-c[0])+(c[0]-b[0])*(y+.5-c[1]))/divisor;
      const v=((c[1]-a[1])*(x+.5-c[0])+(a[0]-c[0])*(y+.5-c[1]))/divisor;
      if(u>=0&&v>=0&&u+v<=1){const at=y*width+x;depth[at]=Math.max(depth[at],u*a[2]+v*b[2]+(1-u-v)*c[2]);}
    }
  };
  for(let step=0;step<steps;step++)for(let ring=0;ring<around;ring++){
    const a=rows[step][ring],b=rows[step+1][ring],c=rows[step+1][ring+1],d=rows[step][ring+1];
    triangle(a,b,c);triangle(a,c,d);
  }
  const filaments=Array.from({length:recipe.filamentCount},(_,index)=>foldFilament(recipe,index,steps));
  return {depth,filaments,width,height,sx,sy};
}

export function paintFoldScene(context,scene,colors) {
  const {width,height,depth,sx,sy}=scene;
  const image=context.createImageData(width,height), pixels=image.data;
  const coverageMap=new Float32Array(width*height), lightMap=new Float32Array(width*height);
  const stamps=new Uint16Array(width*height);
  let stamp=0, touched=[];
  const put=(x,y,z,light,coverage)=>{
    if(x<0||y<0||x>=width||y>=height||z<depth[y*width+x]-1)return;
    const index=y*width+x;
    if(stamps[index]!==stamp){stamps[index]=stamp;coverageMap[index]=0;touched.push(index);}
    if(coverage>coverageMap[index]){coverageMap[index]=coverage;lightMap[index]=light;}
  };
  for(const filament of scene.filaments){
    stamp++;touched=[];
    const amount=Math.max(0,Math.min(1,colors[filament.area]||0));
    const orange=amount>0&&filament.accent<amount*.45;
    const base=orange?[227,107,55]:[241,239,232];
    const radius=filament.width*(sx+sy)*.25;
    for(let i=1;i<filament.points.length;i++){
      const a=filament.points[i-1],b=filament.points[i];
      if(a.front<-.03&&b.front<-.03)continue;
      const ax=a.x*sx,ay=a.y*sy,bx=b.x*sx,by=b.y*sy,dx=bx-ax,dy=by-ay;
      const length=dx*dx+dy*dy;
      if(length<.00001)continue;
      for(let y=Math.max(0,Math.floor(Math.min(ay,by)-radius-1));y<=Math.min(height-1,Math.ceil(Math.max(ay,by)+radius+1));y++){
        for(let x=Math.max(0,Math.floor(Math.min(ax,bx)-radius-1));x<=Math.min(width-1,Math.ceil(Math.max(ax,bx)+radius+1));x++){
          const t=Math.max(0,Math.min(1,((x+.5-ax)*dx+(y+.5-ay)*dy)/length));
          const distance=Math.hypot(x+.5-ax-t*dx,y+.5-ay-t*dy);
          const coverage=Math.max(0,Math.min(1,radius+.5-distance));
          if(coverage>0)put(x,y,a.z+(b.z-a.z)*t,(a.light+(b.light-a.light)*t)*filament.grain,coverage);
        }
      }
    }
    for(const index of touched){
      const at=index*4,coverage=coverageMap[index],light=lightMap[index],old=pixels[at+3]/255,alpha=coverage+old*(1-coverage);
      for(let k=0;k<3;k++)pixels[at+k]=Math.round((base[k]*light*coverage+pixels[at+k]*old*(1-coverage))/alpha);
      pixels[at+3]=Math.round(alpha*255);
    }
  }
  context.putImageData(image,0,0);
}

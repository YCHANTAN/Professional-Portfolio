import { test, expect } from '@playwright/test';
import { specialIdleFrame } from '../src/components/companion/animationClips';
import { advanceCat, catFrame, createCatState, type CatState } from '../src/components/companion/catController';

const bounds = { left: 0, top: 0, right: 1000, bottom: 1000 };
const setupCat = () => {
  const state = createCatState();
  advanceCat(state, { time: 0, dt: 1/60, target: { x: 300, y: 400 }, owner: { x: 328, y: 332 }, ownerSize: 160, bounds, frozen: false, reduced: false, dragging: false, clear: () => true, random: () => .2 });
  return state;
};
function tick(state: CatState, time: number, ownerX: number, clear = true, frozen = false) {
  const old = { ...state.position };
  advanceCat(state, { time, dt: 1/60, target: { x: ownerX - 28, y: 400 }, owner: { x: ownerX, y: 332 }, ownerSize: 160, bounds, frozen, reduced: false, dragging: false, clear: () => clear, random: () => .2 });
  return Math.hypot(state.position.x-old.x,state.position.y-old.y);
}

test('cat movement chooses exactly one velocity-correct clip without sit/walk oscillation', () => {
  for (const speed of [30,70]) {
    const state = setupCat(); const frames = new Set<number>();
    for (let i=1;i<=180;i++) {
      const travelled = tick(state,i*1000/60,328+i*speed/60);
      if (i>12) {
        expect(travelled).toBeGreaterThan(.1);
        expect(state.animation).toBe(speed===70?'running':'walking');
        const frame=catFrame(state,i*1000/60); frames.add(frame);
        expect(frame).toBeGreaterThanOrEqual(speed===70?20:16);
        expect(frame).toBeLessThanOrEqual(speed===70?23:19);
      }
    }
    expect(frames.size).toBe(4);
    for(let i=181;i<=300;i++) tick(state,i*1000/60,328+180*speed/60);
    expect(state.animation).toBe('idle');
    expect(catFrame(state,5000)).toBeLessThan(16);
  }
});

test('cat changes direction without resetting its gait, and blocked or paused movement cannot render a gait', () => {
  const state=setupCat();
  for(let i=1;i<=90;i++) tick(state,i*1000/60,328+i);
  const phase=state.phase;
  for(let i=91;i<=110;i++) tick(state,i*1000/60,418-(i-90));
  expect(state.facing).toBe(-1); expect(state.phase).toBeGreaterThan(phase);
  state.routeCheckAt=0;
  tick(state,2000,200,false);
  expect(state.speed).toBe(0); expect(state.animation).toBe('idle');
  const stopped={...state.position};
  tick(state,3000,100,true,true);
  expect(state.position).toEqual(stopped); expect(state.animation).toBe('idle');
});

test('actual human contact artwork swaps the bright near leg; cat has distinct four-legged walk and gathered gallop', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async()=>{
    // Vite loads the same draw functions and PNG assets as the live overlay.
    const human = await import('/src/components/companion/CompanionSprite.tsx');
    const cat = await import('/src/components/companion/CatCompanion.tsx');
    const load = (file:string) => new Promise<HTMLImageElement>(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.src='/avatars/'+file+'.png';});
    const [atlas,image] = await Promise.all(['christian-animations','tabby-cat-animations'].map(load));
    const canvas=document.createElement('canvas');canvas.width=canvas.height=96;const ctx=canvas.getContext('2d')!;
    const nearLeg = (frame:number) => {
      human.drawCompanionFrame(ctx,{atlas,frame,facing:1,lookX:0,lookY:0});
      const p=ctx.getImageData(0,0,96,96).data; let xSum=0,n=0;
      for(let y=67;y<83;y++) for(let x=10;x<86;x++) {const i=(y*96+x)*4;if(p[i+3]&&p[i+2]>155&&p[i+2]>p[i+1]+20&&p[i]<130){xSum+=x;n++;}}
      return { x:xSum/n, n };
    };
    const legs=[30,32,34,36].map(nearLeg);
    const catFrames=[];
    for(let frame=16;frame<24;frame++){
      cat.drawCatFrame(ctx,{image,frame,facing:1});
      const p=ctx.getImageData(0,0,96,96).data;let min=96,max=0;for(let y=0;y<96;y++)for(let x=0;x<96;x++)if(p[(y*96+x)*4+3]){min=Math.min(min,x);max=Math.max(max,x);}
      catFrames.push({png:canvas.toDataURL(),width:max-min,corner:p[3]});
    }
    // Measure paint on the canvas itself, excluding the avatar's skin and clothing.
    const art=[];for(const frame of [47,48,49,50,51,52]){human.drawCompanionFrame(ctx,{atlas,frame,facing:1,lookX:0,lookY:0});const p=ctx.getImageData(0,0,96,96).data;let color=0;for(let y=30;y<84;y++)for(let x=66;x<94;x++){const i=(y*96+x)*4;if(p[i+3]&&((p[i]>190&&p[i+1]>65&&p[i+1]<210&&p[i+2]<100)||(p[i+2]>160&&p[i]<100)))color++;}art.push(color);}
    return {legs,catFrames,art};
  });
  for(const leg of result.legs) expect(leg.n).toBeGreaterThan(50);
  expect(result.legs[0].x).toBeGreaterThan(48); expect(result.legs[1].x).toBeLessThan(43);
  expect(result.legs[2].x).toBeGreaterThan(48); expect(result.legs[3].x).toBeLessThan(43);
  expect(new Set(result.catFrames.slice(0,4).map(f=>f.png)).size).toBe(4);
  expect(new Set(result.catFrames.slice(4).map(f=>f.png)).size).toBe(4);
  for(const frame of result.catFrames) expect(frame.corner).toBe(0);
  expect(result.catFrames[6].width).toBeLessThan(result.catFrames[4].width-10);
  expect(result.art[4]).toBeGreaterThan(result.art[0]+20);
});

for(const seed of [.2,.6]) test(`special idle ${seed===.2?'laptop':'painting'} enters, animates, exits and alternates; grabbing removes props`, async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'}); await page.clock.install();
  await page.addInitScript(value=>{Math.random=()=>value;},seed); await page.goto('/');
  const avatar=page.locator('.pixel-companion'), button=page.getByRole('button',{name:'Christian pixel avatar',exact:true});
  await expect(button).toBeVisible(); await expect(page.locator('.cat-sprite')).toBeVisible();
  const wait=12000+seed*8000;
  await page.clock.fastForward(wait+100); await expect(avatar).toHaveAttribute('data-mode','transitioning');
  await page.clock.runFor(1200); await expect(avatar).toHaveAttribute('data-mode',seed===.2?'idle_laptop':'idle_painting');
  const poses=new Set<string>();
  for(let i=0;i<12;i++){
    poses.add(await page.locator('.companion-sprite').evaluate((c:HTMLCanvasElement)=>c.toDataURL()));
    await page.clock.runFor(180);
  }
  expect(poses.size).toBeGreaterThanOrEqual(3);
  expect(await page.locator('.companion-cat').getAttribute('data-cat-mode')).toBe('idle');
  await page.clock.fastForward(18000+seed*8000);
  await expect(avatar).toHaveAttribute('data-mode','transitioning');
  await page.clock.runFor(1000); await expect(avatar).toHaveAttribute('data-mode','idle');
  await page.clock.fastForward(wait+100); await page.clock.runFor(1200);
  await expect(avatar).toHaveAttribute('data-mode',seed===.2?'idle_painting':'idle_laptop');
  const box=(await button.boundingBox())!;
  await page.mouse.move(box.x+box.width/2,box.y+40);await page.mouse.down();await page.mouse.move(box.x+box.width/2-120,box.y-80,{steps:5});
  await expect(avatar).toHaveAttribute('data-mode','drag');
  const frame=Number(await avatar.getAttribute('data-frame'));expect(frame).toBeGreaterThanOrEqual(24);expect(frame).toBeLessThanOrEqual(27);
  await page.mouse.up();await expect(avatar).toHaveAttribute('data-mode','watch');
  expect(Number(await avatar.getAttribute('data-frame'))).toBeLessThan(30);
  await page.clock.fastForward(21000);await expect(avatar).toHaveAttribute('data-mode','idle');
});


test('special props are cleared by keyboard, controls, project suspension, and reduced motion', async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await page.clock.install();
  await page.addInitScript(()=>{Math.random=()=>.2;});await page.goto('/');
  const avatar=page.locator('.pixel-companion'),button=page.getByRole('button',{name:'Christian pixel avatar',exact:true});
  await expect(button).toBeVisible();
  const special=async()=>{await page.clock.fastForward(13800);await page.clock.runFor(1200);await expect(avatar).toHaveAttribute('data-mode',/idle_laptop|idle_painting/);};
  await special();await button.focus();await page.keyboard.press('ArrowLeft');
  await expect(avatar).toHaveAttribute('data-mode','watch');expect(Number(await avatar.getAttribute('data-frame'))).toBeLessThan(30);
  await page.clock.fastForward(20100);await special();await page.keyboard.press('Enter');
  await expect(avatar).toHaveAttribute('data-mode','menu');await expect(avatar).toHaveAttribute('data-frame','0');
  await page.getByRole('button',{name:'Cancel',exact:true}).click();await special();
  await page.evaluate(()=>document.querySelector<HTMLButtonElement>('.project-card h3 button')!.click());
  await expect(avatar).toHaveAttribute('data-mode','suspended');await expect(avatar).toHaveAttribute('data-frame','0');
  await page.getByRole('button',{name:'Close project details'}).click();await special();
  await page.emulateMedia({reducedMotion:'reduce'});await expect(avatar).toHaveAttribute('data-mode','idle');
  await expect(avatar).toHaveAttribute('data-frame','0');await page.clock.fastForward(60000);await expect(avatar).toHaveAttribute('data-frame','0');
  expect(await page.locator('.cat-sprite').count()).toBe(1);expect(await page.locator('.companion-sprite').count()).toBe(1);
});


test('finished artwork stays finished throughout the painting activity',()=>{
  expect(specialIdleFrame('painting','active',0)).toBe(47);
  expect(specialIdleFrame('painting','active',3900)).toBe(51);
  const poses=new Set<number>();
  for(let elapsed=7000;elapsed<26000;elapsed+=100){
    const frame=specialIdleFrame('painting','active',elapsed);
    expect(frame).toBeGreaterThanOrEqual(54);expect(frame).toBeLessThanOrEqual(57);poses.add(frame);
  }
  expect(poses.size).toBe(4);
  expect(specialIdleFrame('painting','exit',899)).toBe(0);
  expect(specialIdleFrame('laptop','exit',899)).toBe(0);
});

test('phone painting remains inside the viewport and can be interrupted by touch',async({browser})=>{
  const context=await browser.newContext({viewport:{width:320,height:568},isMobile:true,hasTouch:true});
  const page=await context.newPage();await page.emulateMedia({reducedMotion:'no-preference'});await page.clock.install();
  await page.addInitScript(()=>{Math.random=()=>.6;});await page.goto('/');
  const button=page.getByRole('button',{name:'Christian pixel avatar',exact:true});await expect(button).toBeVisible();
  await page.clock.fastForward(16900);await page.clock.runFor(1200);
  await expect(page.locator('.pixel-companion')).toHaveAttribute('data-mode','idle_painting');
  await page.clock.runFor(7500);expect(Number(await page.locator('.pixel-companion').getAttribute('data-frame'))).toBeGreaterThanOrEqual(54);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320);
  const box=(await button.boundingBox())!;const client=await context.newCDPSession(page);
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+30}]});
  await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width/2-60,y:box.y-90}]});
  await expect(page.locator('.pixel-companion')).toHaveAttribute('data-mode','drag');
  expect(Number(await page.locator('.pixel-companion').getAttribute('data-frame'))).toBeLessThan(30);
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(page.locator('.pixel-companion')).toHaveAttribute('data-mode','watch');
  await context.close();
});

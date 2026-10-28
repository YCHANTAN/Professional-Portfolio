import { test, expect, type Page } from '@playwright/test';

async function moveAvatar(page:Page,x:number,y:number) {
  const root=(await page.locator('.pixel-companion').boundingBox())!;
  const button=(await page.getByRole('button',{name:'Christian pixel avatar',exact:true}).boundingBox())!;
  const point={x:button.x+button.width/2,y:button.y+30};
  await page.mouse.move(point.x,point.y);await page.mouse.down();
  await page.mouse.move(point.x+x-root.x,point.y+y-root.y,{steps:5});await page.mouse.up();
  await expect(page.locator('.pixel-companion')).toHaveAttribute('data-mode','watch');
}
async function followDistance(page:Page) {
  const owner=(await page.locator('.pixel-companion').boundingBox())!;
  const cat=(await page.locator('.companion-cat').boundingBox())!;
  return Math.hypot(cat.x-(owner.x-cat.width*.32),cat.y-(owner.y+owner.height*.94-cat.height*.94));
}

test('cat follows center-to-left drops around a page control instead of staying behind',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await page.clock.install();
  await page.addInitScript(()=>{Math.random=()=>.2;});await page.goto('/');await expect(page.locator('.cat-sprite')).toBeVisible();
  await page.evaluate(()=>{const button=document.createElement('button');button.textContent='Detour test control';Object.assign(button.style,{position:'fixed',left:'400px',top:'350px',width:'100px',height:'280px',zIndex:'20'});document.body.append(button);});
  await moveAvatar(page,700,400);await page.clock.runFor(11000);expect(await followDistance(page)).toBeLessThan(15);
  await moveAvatar(page,100,400);await page.clock.runFor(14000);expect(await followDistance(page)).toBeLessThan(80);
  const landing = await page.evaluate(async()=>{
    const {catObstacles,findCatPath}=await import('/src/components/companion/catNavigation.ts');
    const owner=document.querySelector('.pixel-companion')!.getBoundingClientRect(),cat=document.querySelector('.companion-cat')!.getBoundingClientRect();
    const controls=Array.from(document.querySelectorAll<HTMLElement>('a[href],button,input,textarea,select')).filter(e=>!e.closest('[data-pixel-companion]')&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').map(e=>e.getBoundingClientRect()).filter(r=>r.width&&r.height&&r.right>0&&r.bottom>0&&r.left<innerWidth&&r.top<innerHeight);
    const path=findCatPath({x:cat.x,y:cat.y},{x:owner.x-cat.width*.32,y:owner.y+owner.height*.94-cat.height*.94},{left:12,top:12,right:innerWidth-cat.width-12,bottom:innerHeight-cat.height-12},catObstacles(controls,cat.width));
    return path?Math.hypot(cat.x-path.goal.x,cat.y-path.goal.y):Infinity;
  });
  expect(landing).toBeLessThan(4);
});

import { catObstacles, catSegmentClear, findCatPath } from '../src/components/companion/catNavigation';
import { advanceCat, createCatState } from '../src/components/companion/catController';

test('navigation detours around controls, accepts clear diagonals, and finds a safe landing beside an obstructed drop',()=>{
  const bounds={left:12,top:12,right:900,bottom:800};
  const obstacles=catObstacles([{left:400,top:350,right:500,bottom:630}],88);
  const from={x:670,y:468},target={x:72,y:468};
  expect(catSegmentClear(from,target,obstacles)).toBe(false);
  const route=findCatPath(from,target,bounds,obstacles)!;
  expect(route).not.toBeNull();expect(route.waypoints.length).toBeGreaterThan(1);
  let position=from;for(const waypoint of route.waypoints){expect(catSegmentClear(position,waypoint,obstacles)).toBe(true);position=waypoint;}
  expect(route.goal).toEqual(target);
  expect(catSegmentClear({x:600,y:100},{x:100,y:300},obstacles)).toBe(true);
  const blockedDrop=findCatPath(from,{x:420,y:450},bounds,obstacles)!;
  expect(blockedDrop).not.toBeNull();expect(blockedDrop.goal).not.toEqual({x:420,y:450});
  expect(catSegmentClear(blockedDrop.goal,blockedDrop.goal,obstacles)).toBe(true);
});

test('blocked following retries and retargets immediately after another pickup',()=>{
  const state=createCatState();const bounds={left:0,top:0,right:1000,bottom:800};let allowed=false;
  let target={x:700,y:400};let time=0;
  const step=(dragging=false)=>{time+=1000/60;advanceCat(state,{time,dt:1/60,target,owner:{x:target.x+28,y:332},ownerSize:160,bounds,frozen:false,reduced:false,dragging,clear:()=>allowed,navigate:()=>allowed?{goal:target,waypoints:[target]}:null,random:()=>.2});};
  step();target={x:100,y:400};for(let i=0;i<60;i++)step();expect(state.following).toBe(true);expect(state.speed).toBe(0);
  allowed=true;for(let i=0;i<300;i++)step();expect(state.position.x).toBeLessThan(400);
  step(true);target={x:800,y:250};step(true);step();expect(state.following).toBe(true);expect(state.routeTarget).toEqual(target);
  for(let i=0;i<600;i++)step();expect(Math.hypot(state.position.x-target.x,state.position.y-target.y)).toBeLessThan(4);
});

test('repeated mobile drops retarget the cat before it finishes the previous trip',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();await page.emulateMedia({reducedMotion:'no-preference'});await page.clock.install();
  await page.addInitScript(()=>{Math.random=()=>.2;});await page.goto('/');await expect(page.locator('.cat-sprite')).toBeVisible();
  const client=await context.newCDPSession(page);
  for(const target of [{x:130,y:500},{x:230,y:300},{x:24,y:400}]){
    const root=(await page.locator('.pixel-companion').boundingBox())!;
    const box=(await page.getByRole('button',{name:'Christian pixel avatar',exact:true}).boundingBox())!;
    const start={x:box.x+box.width/2,y:box.y+30};
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
    await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+target.x-root.x,y:start.y+target.y-root.y}]});
    await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.clock.runFor(300);
  }
  await page.clock.runFor(10000);expect(await followDistance(page)).toBeLessThan(35);
  const cat=(await page.locator('.companion-cat').boundingBox())!;
  expect(cat.x).toBeGreaterThanOrEqual(12);expect(cat.x+cat.width).toBeLessThanOrEqual(378);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
  await context.close();
});

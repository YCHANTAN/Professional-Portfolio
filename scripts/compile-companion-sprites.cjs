const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');

// Run a local Vite server first. Source artwork is retained outside the public bundle.
(async () => {
  const root = path.resolve(__dirname, '..');
  const names = ['christian-sprites','christian-gait-v2','christian-opposite-contact','christian-run-opposite','christian-activities-v2','christian-painting-finish','tabby-cat-sprites','tabby-cat-gait-v2','tabby-cat-opposite-contact'];
  const sources = Object.fromEntries(names.map(name => [name, 'data:image/png;base64,' + fs.readFileSync(path.join(root,'output/companion-animation-sources',name+'.png')).toString('base64')]));
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(process.argv[2] || 'http://127.0.0.1:4175');
    const result = await page.evaluate(async data => {
      const { drawCompanionFrame, drawCatFrame } = await import('/src/components/companion/sourceSpriteRenderer.ts');
      const load = name => new Promise((resolve,reject) => { const image = new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=data[name]; });
      const [atlas,strideAtlas,oppositeAtlas,runOppositeAtlas,activityAtlas,paintingFinishAtlas,image,gait,opposite] = await Promise.all(['christian-sprites','christian-gait-v2','christian-opposite-contact','christian-run-opposite','christian-activities-v2','christian-painting-finish','tabby-cat-sprites','tabby-cat-gait-v2','tabby-cat-opposite-contact'].map(load));
      const tile=document.createElement('canvas');tile.width=tile.height=96;const ctx=tile.getContext('2d');
      const human=document.createElement('canvas');human.width=human.height=768;const h=human.getContext('2d');h.imageSmoothingEnabled=false;
      for(let frame=0;frame<58;frame++) {
        if(frame>=6&&frame<=17) continue; // Retired locomotion frames cannot accidentally ship as active poses.
        drawCompanionFrame(ctx,{atlas,strideAtlas,oppositeAtlas,runOppositeAtlas,activityAtlas,paintingFinishAtlas,frame,facing:1,lookX:0,lookY:0});
        h.drawImage(tile,frame%8*96,Math.floor(frame/8)*96);
      }
      const cat=document.createElement('canvas');cat.width=576;cat.height=384;const c=cat.getContext('2d');c.imageSmoothingEnabled=false;
      for(let frame=0;frame<24;frame++) {
        if((frame>=4&&frame<=7)||(frame>=13&&frame<=15)) continue;
        drawCatFrame(ctx,{image,gait,opposite,frame,facing:1});c.drawImage(tile,frame%6*96,Math.floor(frame/6)*96);
      }
      return { human:human.toDataURL(),cat:cat.toDataURL() };
    },sources);
    for(const [key,name] of [['human','christian-animations'],['cat','tabby-cat-animations']]) {
      const bytes=Buffer.from(result[key].split(',')[1],'base64');
      fs.writeFileSync(path.join(root,'public/avatars',name+'.png'),bytes);
      console.log(name+'.png: '+bytes.length+' bytes');
    }
  } finally { await browser.close(); }
})();

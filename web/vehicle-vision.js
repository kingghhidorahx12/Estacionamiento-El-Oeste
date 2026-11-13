'use strict';
// Scores compare visible emblem geometry; they are not identity probabilities.
function paintName(r,g,b){
 r/=255;g/=255;b/=255;const hi=Math.max(r,g,b),lo=Math.min(r,g,b),d=hi-lo,s=hi?d/hi:0;let h=0;
 if(d){h=hi===r?((g-b)/d)%6:hi===g?(b-r)/d+2:(r-g)/d+4;h=(h*60+360)%360;}
 if(s<.17)return hi<.24?'Negro':hi>.83?'Blanco':'Gris';
 if(h<15||h>=345)return hi<.5?'Guinda':s<.3&&hi>.85?'Rosa':'Rojo';
 if(h<45)return hi<.55?'Café':s<.35?'Beige':'Naranja';
 if(h<68)return s<.45?'Beige':hi<.82?'Dorado':'Amarillo';
 if(h<170)return 'Verde';if(h<260)return 'Azul';if(h<315)return 'Morado';return hi<.5?'Guinda':'Rosa';
}
function paintEvidence(image){
 const {width,height,data}=image;if(width<24||height<24)return null;const votes=[];
 for(const box of [[.25,.23,.18,.13],[.57,.23,.18,.13]]){const counts=new Map();let n=0;
  for(let y=Math.floor(box[1]*height);y<(box[1]+box[3])*height;y+=3)for(let x=Math.floor(box[0]*width);x<(box[0]+box[2])*width;x+=3){const i=(y*width+x)*4;if(data[i+3]<200)continue;const r=data[i],g=data[i+1],b=data[i+2];if(Math.max(r,g,b)>250&&Math.min(r,g,b)>245)continue;const name=paintName(r,g,b);counts.set(name,(counts.get(name)||0)+1);n++;}
  const top=[...counts].sort((a,b)=>b[1]-a[1])[0];if(!top||n<12||top[1]/n<.65)return null;votes.push(top[0]);
 }return votes[0]===votes[1]?{color:votes[0],evidence:'paint-pixels'}:null;
}
function visibleBrand(text,makes){
 const tokens=String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9 -]/g,' ').split(/\s+/).filter(Boolean),found=new Set();
 const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
 for(const brand of makes){const needle=normalize(brand);for(let i=0;i<tokens.length;i++)for(let n=1;n<=3&&i+n<=tokens.length;n++){if(normalize(tokens.slice(i,i+n).join(''))===needle)found.add(brand);}}
 return found.size===1?[...found][0]:null;
}
if(typeof module!=='undefined')module.exports={paintName,paintEvidence,visibleBrand};

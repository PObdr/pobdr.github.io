export class Timeline{
 constructor(min,max,change){Object.assign(this,{min,max,time:min,speed:60,playing:false,change,last:null});this.tick=this.tick.bind(this)}
 seek(t){if(!Number.isFinite(t))return;this.time=Math.max(this.min,Math.min(this.max,t));if(this.time>=this.max)this.playing=false;this.change(true)}
 toggle(){if(this.time>=this.max)this.time=this.min;this.playing=!this.playing;this.change(true)}
 tick(ts){if(this.last!==null&&this.playing){this.time=Math.min(this.max,this.time+Math.min((ts-this.last)/1000,1)*this.speed);if(this.time>=this.max)this.playing=false;this.change(false)}this.last=ts;requestAnimationFrame(this.tick)}
 start(){requestAnimationFrame(this.tick)}
}

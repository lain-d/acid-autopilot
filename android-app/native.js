/* Android app glue. Loaded only inside the app (the web version never sees it).
   1. Keeps the set playing with the screen off: while a set runs, a foreground service with a "Playing" notification
      keeps Android from pausing or closing the app.
   2. Exports: the web page saves through a download link, which an app can't follow, so the finished file is written
      to the app's storage and handed to Android's share sheet (save to Files, Drive, send to a chat...). */
(function(){
  var C=window.Capacitor; if(!C||!C.isNativePlatform||!C.isNativePlatform()) return;
  var P=C.Plugins||{};
  var playing=false;
  function sync(){
    var b=document.getElementById("play"); if(!b||!P.BgAudio) return;
    var on=b.getAttribute("aria-pressed")==="true";
    if(on===playing) return; playing=on;
    var p=on?P.BgAudio.start():P.BgAudio.stop(); if(p&&p.catch) p.catch(function(){});
  }
  function watch(){ new MutationObserver(sync).observe(document.body,{subtree:true,attributes:true,attributeFilter:["aria-pressed"]}); sync(); }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",watch); else watch();

  var orig=HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click=function(){
    if(this.hasAttribute("download")&&/^blob:/.test(this.href)&&P.Filesystem&&P.Share){ save(this.href,this.getAttribute("download")||"acid-set"); return; }
    return orig.apply(this,arguments);
  };
  function msg(t){ var m=document.getElementById("exMsg"); if(m) m.textContent=t; }
  function save(url,name){
    msg("Preparing "+name+"…");
    fetch(url).then(function(r){ return r.blob(); }).then(function(blob){
      return new Promise(function(res,rej){ var fr=new FileReader(); fr.onload=function(){ res(String(fr.result).split(",")[1]); }; fr.onerror=rej; fr.readAsDataURL(blob); });
    }).then(function(b64){
      return P.Filesystem.writeFile({path:name,data:b64,directory:"CACHE"});
    }).then(function(w){
      msg("Choose where to save "+name+".");
      return P.Share.share({title:name,files:[w.uri],dialogTitle:"Save or share your set"});
    }).then(function(){ msg("Shared "+name+"."); },function(e){ msg("Could not save the file"+(e&&e.message?": "+e.message:".")); });
  }
})();

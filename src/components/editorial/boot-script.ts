/**
 * Inline boot script for the public site (runs in <head>, before first paint).
 *
 * 1. Marks public pages with html.site so the editorial styles (no rules or
 *    outlines, more air) never touch /admin, which shares this layout.
 * 2. Adds html.js: text animations only hide text when JavaScript is running,
 *    so the page is always readable without it.
 * 3. Watches [data-reveal] elements and marks them [data-in] once they scroll
 *    into view. A MutationObserver picks up elements from client navigation.
 * 4. Logo intro on every full page load (not on in-site navigation, never
 *    with reduced motion): html.logo-intro draws the header logo in place; on
 *    the home page html.logo-intro-home runs the full construction intro
 *    instead, and html.intro-delay holds the hero until the veil opens. The
 *    hero headline waits on html.hl-intro instead, which no timer removes:
 *    its verb line loops forever, and changing its timing mid-loop made the
 *    verbs jump (only navigating away clears it, in <SiteClassSync>).
 * 5. Counters (<AnimatedCounter>) count in CSS, but Safari doesn't redraw a
 *    counter() whose value is animated, so the figures sat on 0 and then
 *    jumped. While one runs, its value is copied to [data-n] each frame,
 *    which the counter shows instead (see "Counters" in globals.css). It is
 *    rounded, as Safari reports the animated integer as a decimal.
 */
export const editorialBootScript = `(function(){
var d=document.documentElement;
function mark(){d.classList.toggle('site',!/^\\/admin(\\/|$)/.test(location.pathname));}
mark();window.__cwMarkSite=mark;
try{if(d.classList.contains('site')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){var h=location.pathname==='/';d.classList.add('logo-intro');if(h)d.classList.add('logo-intro-home','intro-delay','hl-intro');setTimeout(function(){d.classList.remove('logo-intro','logo-intro-home');},h?3100:1750);if(h)setTimeout(function(){d.classList.remove('intro-delay');},6800);}}catch(e){}
d.classList.add('js');
document.addEventListener('animationstart',function(e){if(e.animationName!=='count-up')return;var el=e.target,on=true;function tick(){if(!on)return;var n=Math.round(parseFloat(getComputedStyle(el,'::after').getPropertyValue('--count')));if(n===n&&el.getAttribute('data-n')!==String(n))el.setAttribute('data-n',n);requestAnimationFrame(tick);}requestAnimationFrame(tick);el.addEventListener('animationend',function end(a){if(a.animationName!=='count-up')return;on=false;el.removeEventListener('animationend',end);el.removeAttribute('data-n');});});
if(!('IntersectionObserver' in window)){d.classList.remove('js');return;}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.setAttribute('data-in','');io.unobserve(e.target);}});},{rootMargin:'0px 0px -12% 0px',threshold:0});
function watch(el){if(!el.hasAttribute('data-in')&&!el.__cw){el.__cw=1;io.observe(el);}}
function scan(root){if(root.matches&&root.matches('[data-reveal]'))watch(root);if(root.querySelectorAll)root.querySelectorAll('[data-reveal]').forEach(watch);}
function start(){scan(document.body);new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1)scan(n);});});}).observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();`;

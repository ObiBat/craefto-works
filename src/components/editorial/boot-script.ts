/**
 * Inline boot script for the public site (runs in <head>, before first paint).
 *
 * 1. Marks public pages with html.site so the editorial styles (no rules or
 *    outlines, more air) never touch /admin or /portal, which share this layout.
 * 2. Adds html.js: text animations only hide text when JavaScript is running,
 *    so the page is always readable without it.
 * 3. Watches [data-reveal] elements and marks them [data-in] once they scroll
 *    into view. A MutationObserver picks up elements from client navigation.
 * 4. Logo intro, once per session (?intro replays): html.logo-intro draws the
 *    header logo in place; on the home page html.logo-intro-home runs the full
 *    intro instead, and html.intro-delay holds the hero until the veil opens.
 */
export const editorialBootScript = `(function(){
var d=document.documentElement;
function mark(){var p=location.pathname;d.classList.toggle('site',!/^\\/(admin|portal)(\\/|$)/.test(p)&&location.hostname.indexOf('project-portal')!==0);}
mark();window.__cwMarkSite=mark;
try{var q=location.search.indexOf('intro')>-1;if(d.classList.contains('site')&&(q||!sessionStorage.getItem('cw-intro'))&&!matchMedia('(prefers-reduced-motion: reduce)').matches){sessionStorage.setItem('cw-intro','1');var h=location.pathname==='/';d.classList.add('logo-intro');if(h)d.classList.add('logo-intro-home','intro-delay');setTimeout(function(){d.classList.remove('logo-intro','logo-intro-home');},h?2450:1750);if(h)setTimeout(function(){d.classList.remove('intro-delay');},5200);}}catch(e){}
d.classList.add('js');
if(!('IntersectionObserver' in window)){d.classList.remove('js');return;}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.setAttribute('data-in','');io.unobserve(e.target);}});},{rootMargin:'0px 0px -12% 0px',threshold:0});
function watch(el){if(!el.hasAttribute('data-in')&&!el.__cw){el.__cw=1;io.observe(el);}}
function scan(root){if(root.matches&&root.matches('[data-reveal]'))watch(root);if(root.querySelectorAll)root.querySelectorAll('[data-reveal]').forEach(watch);}
function start(){scan(document.body);new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1)scan(n);});});}).observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();`;

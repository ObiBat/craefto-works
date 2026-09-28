/**
 * Inline boot script for the public site (runs in <head>, before first paint).
 *
 * 1. Marks public pages with html.site so the editorial styles (no rules or
 *    outlines, more air) never touch /admin or /portal, which share this layout.
 * 2. Adds html.js: text animations only hide text when JavaScript is running,
 *    so the page is always readable without it.
 * 3. Watches [data-reveal] elements and marks them [data-in] once they scroll
 *    into view. A MutationObserver picks up elements from client navigation.
 */
export const editorialBootScript = `(function(){
var d=document.documentElement;
function mark(){var p=location.pathname;d.classList.toggle('site',!/^\\/(admin|portal)(\\/|$)/.test(p)&&location.hostname.indexOf('project-portal')!==0);}
mark();window.__cwMarkSite=mark;
d.classList.add('js');
if(!('IntersectionObserver' in window)){d.classList.remove('js');return;}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.setAttribute('data-in','');io.unobserve(e.target);}});},{rootMargin:'0px 0px -6% 0px',threshold:0});
function watch(el){if(!el.hasAttribute('data-in')&&!el.__cw){el.__cw=1;io.observe(el);}}
function scan(root){if(root.matches&&root.matches('[data-reveal]'))watch(root);if(root.querySelectorAll)root.querySelectorAll('[data-reveal]').forEach(watch);}
function start(){scan(document.body);new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1)scan(n);});});}).observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();`;

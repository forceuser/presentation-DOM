!function(){"use strict";function a(a,b,c,d,e,f){b[a]&&(c.push(a),(b[a]===!0||1===b[a])&&d.push(e+a+"/"+f))}function b(a,b,c,d,e){var f=d+b+"/"+e;require._fileExists(a.toUrl(f+".js"))&&c.push(f)}function c(a,b,d){var e;for(e in b)!b.hasOwnProperty(e)||a.hasOwnProperty(e)&&!d?"object"==typeof b[e]&&(!a[e]&&b[e]&&(a[e]={}),c(a[e],b[e],d)):a[e]=b[e]}var d=/(^.*(^|\/)nls(\/|$))([^\/]*)\/?([^\/]*)/;define(["module"],function(e){var f=e.config?e.config():{};return{version:"2.0.5",load:function(e,g,h,i){i=i||{},i.locale&&(f.locale=i.locale);var j,k,l,m=d.exec(e),n=m[1],o=m[4],p=m[5],q=o.split("-"),r=[],s={},t="";if(m[5]?(n=m[1],j=n+p):(j=e,p=m[4],o=f.locale,o||(o=f.locale="undefined"==typeof navigator?"root":(navigator.languages&&navigator.languages[0]||navigator.language||navigator.userLanguage||"root").toLowerCase()),q=o.split("-")),i.isBuild){for(r.push(j),b(g,"root",r,n,p),k=0;k<q.length;k++)l=q[k],t+=(t?"-":"")+l,b(g,t,r,n,p);g(r,function(){h()})}else g([j],function(b){var d,e=[];for(a("root",b,e,r,n,p),k=0;k<q.length;k++)d=q[k],t+=(t?"-":"")+d,a(t,b,e,r,n,p);g(r,function(){var a,d,f;for(a=e.length-1;a>-1&&e[a];a--)f=e[a],d=b[f],(d===!0||1===d)&&(d=g(n+f+"/"+p)),c(s,d);h(s)})})}}})}();
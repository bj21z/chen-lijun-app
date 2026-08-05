import fs from 'node:fs/promises';
const groups=[
 {layer:'官方与本人',tier:'A',queries:['site:weibo.com 陈丽君-lyx','site:weibo.com/zjxbhyjt 陈丽君','浙江小百花 陈丽君 官方']},
 {layer:'权威媒体',tier:'A',queries:['陈丽君 site:news.cn OR site:chinanews.com.cn OR site:people.com.cn','陈丽君 浙江 新闻 采访']},
 {layer:'演出与节目',tier:'A',queries:['陈丽君 演出 开票 巡演','陈丽君 节目 晚会 采访','陈丽君 我的大观园']},
 {layer:'视频平台',tier:'B',queries:['陈丽君 抖音 视频','陈丽君 哔哩哔哩 视频','陈丽君 直播 花絮']},
 {layer:'戏迷社区',tier:'B',queries:['陈丽君 微博 超话','陈丽君 百度贴吧','陈丽君 今日头条 戏迷']}
];
const decode=s=>String(s||'').replace(/<!\[CDATA\[|\]\]>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const text=(b,t)=>decode((b.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)<\\/${t}>`,'i'))||[])[1]||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const cat=t=>/开票|演出|巡演|剧场|首演|场次/.test(t)?'演出':/采访|专访|人物|对话/.test(t)?'采访':/晚会|节目|电影|综艺|直播/.test(t)?'节目':/微博|抖音|视频|超话|贴吧|粉丝/.test(t)?'平台互动':'综合动态';
const all=[],checks=[];
for(const g of groups)for(const q of g.queries){const start=Date.now();try{const r=await fetch('https://www.bing.com/news/search?format=rss&setlang=zh-cn&q='+encodeURIComponent(q),{headers:{'User-Agent':'Mozilla/5.0 YunshangXiaobaihua/2.0'}});if(!r.ok)throw new Error(String(r.status));const xml=await r.text();let n=0;for(const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)){const b=m[1],title=text(b,'title').replace(/\s*[-_|].{0,18}$/,'').trim(),url=text(b,'link');if(!title.includes('陈丽君')||!url)continue;let date='';try{date=new Date(text(b,'pubDate')).toISOString().slice(0,10)}catch{}all.push({date,title,desc:text(b,'description').slice(0,220),source:text(b,'News:Source')||'公开网络',url,category:cat(title),tier:g.tier,layer:g.layer});n++;}checks.push({layer:g.layer,ok:true,count:n,ms:Date.now()-start});}catch{checks.push({layer:g.layer,ok:false,count:0,ms:Date.now()-start});}}
const seen=new Set();const items=all.filter(x=>{const k=x.title.replace(/[\s·，。、“”《》：:]/g,'');if(seen.has(k))return false;seen.add(k);return true}).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,80);
const now=new Date().toISOString();
await fs.writeFile('data/daily.json',JSON.stringify({updatedAt:now,checkedAt:now,version:'2.0-'+now.slice(0,10),checks,items},null,2));

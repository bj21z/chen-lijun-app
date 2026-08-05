const SOURCE_GROUPS = [
  { layer:'官方与本人', tier:'A', queries:['site:weibo.com 陈丽君-lyx','site:weibo.com/zjxbhyjt 陈丽君','浙江小百花 陈丽君 官方'] },
  { layer:'权威媒体', tier:'A', queries:['陈丽君 site:news.cn OR site:chinanews.com.cn OR site:people.com.cn','陈丽君 site:zjnews.zjol.com.cn OR site:tidetimes.com.cn'] },
  { layer:'演出与节目', tier:'A', queries:['陈丽君 演出 开票 巡演','陈丽君 节目 晚会 采访','陈丽君 我的大观园'] },
  { layer:'视频平台', tier:'B', queries:['陈丽君 抖音 视频','陈丽君 哔哩哔哩 视频','陈丽君 直播 花絮'] },
  { layer:'戏迷社区', tier:'B', queries:['陈丽君 微博 超话','陈丽君 百度贴吧','陈丽君 今日头条 戏迷'] }
];
const decode=s=>String(s||'').replace(/<!\[CDATA\[|\]\]>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const text=(block,tag)=>decode((block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,'i'))||[])[1]||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const cleanTitle=s=>String(s||'').replace(/\s*[-_|].{0,18}$/,'').replace(/\s+/g,' ').trim();
const categoryFor=t=>/开票|演出|巡演|剧场|首演|场次/.test(t)?'演出':/采访|专访|人物|对话/.test(t)?'采访':/晚会|节目|电影|综艺|直播/.test(t)?'节目':/微博|抖音|视频|超话|贴吧|粉丝/.test(t)?'平台互动':'综合动态';
const parse=(xml,meta)=>[...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(m=>{const b=m[1],title=cleanTitle(text(b,'title'));let date='';try{date=new Date(text(b,'pubDate')).toISOString().slice(0,10)}catch{}return {title,url:text(b,'link'),desc:text(b,'description').slice(0,220),source:text(b,'News:Source')||text(b,'source')||'公开网络',date,category:categoryFor(title),tier:meta.tier,layer:meta.layer}}).filter(x=>x.title&&x.url&&x.title.includes('陈丽君'));
const score=x=>({A:30,B:15}[x.tier]||0)+(x.layer==='官方与本人'?30:0)+(x.layer==='权威媒体'?24:0)+(x.date?Math.max(0,30-Math.floor((Date.now()-new Date(x.date))/86400000)):0);
export async function onRequestGet(){
 const all=[]; const checks=[];
 await Promise.all(SOURCE_GROUPS.flatMap(g=>g.queries.map(async q=>{const started=Date.now();try{const u='https://www.bing.com/news/search?format=rss&setlang=zh-cn&q='+encodeURIComponent(q);const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0 YunshangXiaobaihua/2.0'}});if(!r.ok)throw new Error(String(r.status));const parsed=parse(await r.text(),g);all.push(...parsed);checks.push({layer:g.layer,ok:true,count:parsed.length,ms:Date.now()-started});}catch(e){checks.push({layer:g.layer,ok:false,count:0,ms:Date.now()-started});}})));
 const seen=new Set();const items=all.filter(x=>{const k=x.title.replace(/[\s·，。、“”《》：:]/g,'');if(seen.has(k))return false;seen.add(k);return true}).sort((a,b)=>score(b)-score(a)||b.date.localeCompare(a.date)).slice(0,60);
 const now=new Date().toISOString();
 return new Response(JSON.stringify({updatedAt:now,checkedAt:now,version:'2.0-live',items,checks}),{headers:{'content-type':'application/json;charset=UTF-8','cache-control':'public,max-age=900,stale-while-revalidate=3600','access-control-allow-origin':'*'}});
}

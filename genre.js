const params=new URLSearchParams(location.search);const requested=params.get("genre")||"drama";const definition=window.WLW_LETTERBOXD_GENRES.find(item=>item.slug===requested);const pageSize=20;const requestedPage=Math.max(1,Number.parseInt(params.get("page")||"1",10)||1);
const title=document.querySelector("#listing-title"),grid=document.querySelector("#listing-grid"),template=document.querySelector("#listing-card-template"),pagination=document.querySelector("#listing-pagination");
if(!definition){title.textContent="未找到";grid.innerHTML='<p class="empty-listing">没有找到这个体裁。</p>';}
else{
  title.textContent=definition.label;document.title=`${definition.label} · WLW Film Archive`;
  const rank=new Map(window.WLW_POPULARITY_ORDER.map((name,index)=>[name,index]));
  const movies=Object.values(window.WLW_CATALOG).flatMap(group=>group.movies).filter(movie=>window.getFullWLWGenres(movie.title).includes(definition.slug)).sort((a,b)=>(rank.get(a.title)??9999)-(rank.get(b.title)??9999)||a.title.localeCompare(b.title,"en",{sensitivity:"base"}));
  const totalPages=Math.max(1,Math.ceil(movies.length/pageSize));const page=Math.min(requestedPage,totalPages);
  movies.slice((page-1)*pageSize,page*pageSize).forEach(movie=>{const node=template.content.cloneNode(true);node.querySelector("h3 a").textContent=movie.title;node.querySelector(".movie-meta").textContent=[movie.year,...window.getFullWLWGenres(movie.title).slice(0,2)].join(" • ");window.applyWLWPoster(node,movie);grid.appendChild(node);});
  if(!movies.length)grid.innerHTML='<p class="empty-listing">当前清单中暂无该体裁影片。</p>';
  window.makePagination(pagination,totalPages,page,value=>`./genre.html?genre=${encodeURIComponent(definition.slug)}&page=${value}`);
}

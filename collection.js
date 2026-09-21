const params=new URLSearchParams(location.search);const requested=params.get("collection")||"";const definition=window.WLW_COLLECTIONS.find(item=>item.slug===requested);const pageSize=20;const requestedPage=Math.max(1,Number.parseInt(params.get("page")||"1",10)||1);
const title=document.querySelector("#listing-title"),grid=document.querySelector("#listing-grid"),template=document.querySelector("#listing-card-template"),pagination=document.querySelector("#listing-pagination");
if(!definition){title.textContent="未找到";grid.innerHTML='<p class="empty-listing">没有找到这个 collection。</p>';}
else{
  title.textContent=definition.label;document.title=`${definition.label} · WLW Film Archive`;
  const catalogMovies=Object.values(window.WLW_CATALOG).flatMap(group=>group.movies);const byTitle=new Map(catalogMovies.map(movie=>[movie.title,movie]));
  const movies=definition.movies.map(name=>byTitle.get(name)).filter(Boolean);
  const totalPages=Math.max(1,Math.ceil(movies.length/pageSize));const page=Math.min(requestedPage,totalPages);
  movies.slice((page-1)*pageSize,page*pageSize).forEach(movie=>{const node=template.content.cloneNode(true);node.querySelector("h3 a").textContent=movie.title;node.querySelector(".movie-meta").textContent=[movie.year,...window.getWLWGenres(movie.title).slice(0,2)].join(" • ");window.applyWLWPoster(node,movie);grid.appendChild(node);});
  if(!movies.length)grid.innerHTML='<p class="empty-listing">当前 collection 暂无影片。</p>';
  window.makePagination(pagination,totalPages,page,value=>`./collection.html?collection=${encodeURIComponent(definition.slug)}&page=${value}`);
}

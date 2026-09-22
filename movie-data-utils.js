(function(){
  const metadata=window.WLW_MOVIE_METADATA||{};
  window.getWLWMetadata=title=>metadata[title]||{};
  window.getWLWAliases=title=>metadata[title]?.aliases||[];
  window.getWLWPoster=movie=>metadata[movie.title]?.poster||`./assets/posters/${movie.poster}`;
  function placeholderPoster(title){
    const initials=String(title||"?").split(/\s+/).filter(Boolean).slice(0,2).map(word=>word[0]).join("").toUpperCase();
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900"><rect width="600" height="900" fill="#111015"/><circle cx="485" cy="145" r="150" fill="#a76891" opacity=".18"/><path d="M0 720L320 390l280 280v230H0z" fill="#1f4157" opacity=".42"/><text x="44" y="815" fill="#f1ece7" font-size="78" font-family="Arial" font-weight="700">${initials}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }
  window.getWLWPlaceholderPoster=placeholderPoster;

  window.applyWLWPoster=(root,movie)=>{
  const detailHref=`./movie.html?title=${encodeURIComponent(movie.title)}`;

  root.querySelectorAll(".poster-link,h3 a").forEach(anchor=>{
    anchor.href=detailHref;
    anchor.setAttribute("aria-label",`查看 ${movie.title} 详情`);
  });

  const link=root.querySelector(".poster-link");
  if(!link)return;

  let image=link.querySelector(".poster");

  if(!image){
    image=document.createElement("img");
    image.className="poster";
    link.prepend(image);
  }

  image.src=window.getWLWPoster(movie);
  image.alt=`${movie.title} 电影海报`;
  image.addEventListener("error",()=>{image.src=placeholderPoster(movie.title);},{once:true});
};
  const overrides={"50cm":["drama","romance"],"Accused":["drama","thriller"],"A Bit of Scarlet":["documentary","history"],"A Date for Mad Mary":["comedy","drama"],"A Great Ride":["documentary","short"],"A Secret Love":["documentary","biography"],"Aimée & Jaguar":["drama","romance"],"Am I OK?":["comedy","drama"],"Anaïs in Love":["comedy","romance"],"Attachment":["horror","romance"],"Atomic Blonde":["action","thriller"],
    "Badhaai Do":["comedy","drama"],"Benedetta":["biography","drama"],"Bit":["comedy","horror"],"Black Widow":["crime","thriller"],"Blue Jean":["drama","history"],"Booksmart":["comedy","drama"],"Bottoms":["comedy","sport"],"Bulletproof: A Lesbian's Guide to Surviving the Plot":["documentary","comedy"],"But I'm a Cheerleader":["comedy","romance"],
    "The Celluloid Closet":["documentary","history"],"Christmas at the Ranch":["comedy","romance"],"Codependent Lesbian Space Alien Seeks Same":["comedy","sci-fi"],"D.E.B.S.":["action","comedy"],"Drive-Away Dolls":["comedy","crime"],"Edie & Thea: A Very Long Engagement":["documentary","biography"],"Fear Street: 1666":["horror","mystery"],"Fear Street: 1978":["horror","mystery"],"Fear Street: 1994":["horror","mystery"],"Forbidden Love: The Unashamed Stories of Lesbian Lives":["documentary","history"],"Four Minutes":["drama","music"],"Friends & Family Christmas":["comedy","romance"],
    "Happiest Season":["comedy","romance"],"Heart Shot":["action","romance"],"Henry & June":["biography","drama"],"I Care a Lot":["comedy","crime"],"Imagine Me & You":["comedy","romance"],"Jagged Mind":["thriller","romance"],"Jennifer's Body":["comedy","horror"],"Kokomo City":["documentary"],"Lesbian Space Princess":["animation","comedy"],"Lesvia":["documentary","history"],"Loving Highsmith":["documentary","biography"],
    "Mulholland Drive":["drama","mystery"],"Nelly & Nadine":["documentary","history"],"On the Edge":["action","drama"],"Official Competition":["comedy","drama"],"Para:dies":["drama","documentary"],"Puccini for Beginners":["comedy","romance"],"Rebel Dykes":["documentary","history"],"Sally":["documentary","biography"],"The Serpent's Skin":["horror","romance"],"The Sign of the Cross":["drama","history"],"So Damn Easy Going":["comedy","drama"],"Thelma":["drama","thriller"],"Tove":["biography","drama"],"Town Bloody Hall":["documentary"],"Whistle":["horror","thriller"],"Chely Wright: Wish Me Away":["documentary","music"],"Word Is Out: Stories of Some of Our Lives":["documentary","history"],"Practical Magic":["comedy", "drama", "fantasy", "romance"],"Pitch Perfect":["comedy", "music", "romance"],"Pitch Perfect 2":["comedy", "music"],"Pitch Perfect 3":["comedy", "music"],"Mean Girls":["comedy", "music"],"Wicked":["drama", "fantasy", "music", "romance"],"Wicked: For Good":["drama", "fantasy", "music", "romance"],"Notes on a Scandal":["drama"],"What Keeps You Alive":["horror", "thriller"],"Tully":["comedy", "drama"],"Thoroughbreds":["crime", "drama", "thriller"],"The Novice":["drama", "thriller"],"That's Not Us":["comedy", "drama", "romance"],"Only the Animals":["crime", "drama", "mystery", "thriller"],"Lizzie":["crime", "drama", "history", "romance", "thriller"],"Hearts Beat Loud":["comedy", "drama", "music"],"Be with Me":["drama", "romance"],"Babylon":["comedy", "drama", "history"],"Aniara":["drama", "science-fiction"],"Black Swan":["drama", "horror", "thriller"],"Little Trouble Girls":["drama"]};
  window.getWLWGenres=title=>overrides[title]||["drama","romance"];
  window.getFullWLWGenres=title=>window.getWLWGenres(title);
  window.makePagination=function(container,total,current,makeHref){container.replaceChildren();if(total<=1)return;
    const pages=total<=7?Array.from({length:total},(_,i)=>i+1):[1,2,3,4,"…",total-1,total];
    [...new Set(pages)].forEach(value=>{if(value==="…"){const span=document.createElement("span");span.className="pagination-gap";span.textContent="…";container.appendChild(span);return;}const link=document.createElement("a");link.className=`letter-button${value===current?" active":""}`;link.href=makeHref(value);link.textContent=value;if(value===current)link.setAttribute("aria-current","page");container.appendChild(link);});
  };
})();
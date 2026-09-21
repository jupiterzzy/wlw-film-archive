// Letterboxd's complete genre menu. Keep slugs stable because detail-page URLs use them.
window.WLW_LETTERBOXD_GENRES=[
  {slug:"action",label:"ACTION"},{slug:"adventure",label:"ADVENTURE"},{slug:"animation",label:"ANIMATION"},
  {slug:"comedy",label:"COMEDY"},{slug:"crime",label:"CRIME"},{slug:"documentary",label:"DOCUMENTARY"},
  {slug:"drama",label:"DRAMA"},{slug:"family",label:"FAMILY"},{slug:"fantasy",label:"FANTASY"},
  {slug:"history",label:"HISTORY"},{slug:"horror",label:"HORROR"},{slug:"music",label:"MUSIC"},
  {slug:"mystery",label:"MYSTERY"},{slug:"romance",label:"ROMANCE"},{slug:"science-fiction",label:"SCIENCE FICTION"},
  {slug:"thriller",label:"THRILLER"},{slug:"tv-movie",label:"TV MOVIE"},{slug:"war",label:"WAR"},{slug:"western",label:"WESTERN"}
];

// Extra Letterboxd-style classifications. A movie may intentionally appear in several genres.
window.WLW_GENRE_EXTRAS={
  "Atomic Blonde":["action","crime"],"Black Widow":["crime","thriller"],"Bottoms":["comedy"],"Booksmart":["comedy"],
  "Bound":["crime","thriller"],"D.E.B.S.":["action","comedy","romance"],"Drive-Away Dolls":["comedy","crime","thriller"],
  "Love Lies Bleeding":["crime","romance","thriller"],"I Care a Lot":["comedy","crime","thriller"],"Eileen":["crime","mystery","thriller"],
  "Mulholland Drive":["mystery","thriller"],"Chloe":["mystery","thriller"],"Thelma":["fantasy","mystery","thriller"],
  "The Five Devils":["fantasy","drama"],"My Animal":["fantasy","horror","romance"],"Carmilla":["fantasy","horror","romance"],
  "The Carmilla Movie":["comedy","fantasy","horror"],"Jennifer's Body":["comedy","horror"],"Fear Street: 1666":["horror","mystery","thriller"],"Fear Street: 1978":["horror","mystery","thriller"],"Fear Street: 1994":["horror","mystery","thriller"],
  "Attachment":["horror","romance"],"Bit":["comedy","horror"],"Whistle":["horror","thriller"],"The Serpent's Skin":["horror","romance"],
  "Lesbian Space Princess":["animation","comedy","science-fiction"],"Codependent Lesbian Space Alien Seeks Same":["comedy","romance","science-fiction"],
  "Portrait of a Lady on Fire":["drama","history","romance"],"Carol":["drama","history","romance"],"Benedetta":["drama","history","romance"],
  "Ammonite":["drama","history","romance"],"Colette":["drama","history"],"Tove":["drama","history"],"Vita & Virginia":["drama","history","romance"],
  "Aimée & Jaguar":["drama","history","romance","war"],"The Favourite":["comedy","drama","history"],"Farewell, My Queen":["drama","history"],
  "The Girl King":["drama","history","romance"],"Elisa & Marcela":["drama","history","romance"],"Reaching for the Moon":["drama","history","romance"],
  "Four Minutes":["drama","music"],"Queens of Drama":["drama","music"],"Chuck Chuck Baby":["comedy","music","romance"],
  "Sœur Sourire":["drama","history","music"],"Wild Nights with Emily":["comedy","history"],"Happiest Season":["comedy","romance"],
  "But I'm a Cheerleader":["comedy","romance"],"Imagine Me & You":["comedy","romance"],"Saving Face":["comedy","drama","romance"],
  "The Half of It":["comedy","drama","romance"],"A Date for Mad Mary":["comedy","drama"],"Am I OK?":["comedy","drama"],
  "Anaïs in Love":["comedy","romance"],"Christmas at the Ranch":["comedy","romance"],"Friends & Family Christmas":["comedy","romance"],
  "Edie & Thea: A Very Long Engagement":["documentary","history"],"The Celluloid Closet":["documentary","history"],
  "Forbidden Love: The Unashamed Stories of Lesbian Lives":["documentary","history"],"Rebel Dykes":["documentary","history"],
  "Nelly & Nadine":["documentary","history"],"Loving Highsmith":["documentary","history"],"Kokomo City":["documentary"]
};

// Temporary popularity fallback. Exact Letterboxd watched totals are kept separate
// from genres so a later data refresh changes order without changing page code.
window.WLW_POPULARITY_ORDER=[
  "Portrait of a Lady on Fire","Bottoms","Carol","Jennifer's Body","Mulholland Drive","Booksmart","Love Lies Bleeding","The Favourite",
  "May December","Atomic Blonde","Happiest Season","I Care a Lot","Ammonite","But I'm a Cheerleader","Bound","The Half of It","Disobedience",
  "Boys Don't Cry","Saving Face","Imagine Me & You","Benedetta","Fried Green Tomatoes","Blue Jean","The World to Come","The Fallout","Eileen",
  "D.E.B.S.","Water Lilies","Desert Hearts","High Art","Thelma","Fear Street: 1994","Fear Street: 1978","Fear Street: 1666","Pariah","Certain Women","Drive-Away Dolls","Colette",
  "The Watermelon Woman","Heavenly Creatures","Gia","Show Me Love","My Summer of Love","The Duke of Burgundy","The Children's Hour",
  "Vita & Virginia","Rafiki","Elisa & Marcela","I Can't Think Straight","A Secret Love","Novitiate","The Girl King","Personal Best"
];

window.getFullWLWGenres=function(title){
  const normalize=genre=>genre==="sci-fi"?"science-fiction":genre;
  return [...new Set([...(window.getWLWGenres?.(title)||[]),...(window.WLW_GENRE_EXTRAS[title]||[])].map(normalize))];
};

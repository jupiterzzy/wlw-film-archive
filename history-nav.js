// Independent browser-style navigation, separate from A–Z and numbered pagination.
const historyNav=document.createElement("nav");
historyNav.className="history-nav";
historyNav.setAttribute("aria-label","浏览历史");
historyNav.innerHTML='<button type="button" aria-label="返回上一页">‹</button><button type="button" aria-label="前往下一页">›</button>';
const [backButton,forwardButton]=historyNav.querySelectorAll("button");
backButton.addEventListener("click",()=>history.back());
forwardButton.addEventListener("click",()=>history.forward());
document.body.appendChild(historyNav);

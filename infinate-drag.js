/*
  Diagonal Drift Gallery — Header Code Injection CSS
  ----------------------------------------------------
  Paste this whole block into Settings -> Advanced -> Code Injection -> HEADER.
  Pair with ddg-gallery.js hosted on GitHub, referenced via a single
  <script src="..."> line in your FOOTER Code Injection.
*/
.ddg-gallery{
  position:relative;
  width:100vw;
  left:50%; right:50%;
  margin-left:-50vw; margin-right:-50vw;
  height:var(--ddg-height, 90vh);
  overflow:hidden;
  background:transparent;
}
.ddg-gallery .ddg-stage{ position:absolute; inset:0; touch-action:none; overflow:hidden; }
.ddg-gallery .ddg-field{ position:absolute; top:0; left:0; }
.ddg-gallery .ddg-tile{
  position:absolute; display:block; overflow:hidden;
  background:transparent; border-radius:2px; z-index:1;
}
.ddg-gallery a.ddg-tile{ cursor:pointer; }
.ddg-gallery .ddg-tile img{
  width:100%; height:100%; object-fit:contain; display:block;
  pointer-events:none; -webkit-user-drag:none; user-select:none;
  transition:transform .35s cubic-bezier(.2,.8,.2,1), filter .35s ease;
}
.ddg-gallery.ddg-grayscale .ddg-tile img{ filter:grayscale(1); }
.ddg-gallery .ddg-stage:not(.ddg-dragging) .ddg-tile:hover img{ transform:scale(1.08); filter:brightness(1.08); }
.ddg-gallery.ddg-grayscale .ddg-stage:not(.ddg-dragging) .ddg-tile:hover img{ filter:grayscale(1) brightness(1.08); }
.ddg-gallery .ddg-stage:not(.ddg-dragging) .ddg-tile:hover{ z-index:5; }

.ddg-gallery .ddg-heading{ position:absolute; inset:0; z-index:50; pointer-events:none; display:flex; padding:24px 32px; }
.ddg-gallery .ddg-heading h1{ margin:0; font-size:var(--ddg-heading-size, clamp(1.5rem,4vw,3rem)); }
.ddg-gallery .ddg-heading.ddg-heading-invert h1{ color:#fff; mix-blend-mode:difference; }
.ddg-gallery .ddg-heading.ddg-heading-solid h1{ color:var(--ddg-heading-color, #000); }

.ddg-gallery .ddg-arrow{
  position:absolute;
  bottom:24px;
  left:50%;
  transform:translateX(-50%);
  z-index:60;
  width:40px;
  height:40px;
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  color:#fff;
  mix-blend-mode:difference;
  animation:ddgArrowBounce 1.6s ease-in-out infinite;
  transition:opacity .4s ease;
  pointer-events:auto;
}
.ddg-gallery .ddg-arrow svg{ width:100%; height:100%; }
.ddg-gallery .ddg-arrow.ddg-arrow-hidden{ opacity:0; pointer-events:none; }
@keyframes ddgArrowBounce{
  0%,100%{ transform:translateX(-50%) translateY(0); }
  50%{ transform:translateX(-50%) translateY(8px); }
}

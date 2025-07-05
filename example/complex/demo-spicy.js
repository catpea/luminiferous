import {html, Signal} from './index.js';

import hljs from './highlight-es/highlight.min.js';
import javascript from './highlight-es/languages/javascript.min.js';
import xml from './highlight-es/languages/xml.min.js';
import css from './highlight-es/languages/css.min.js';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('css', css);

// const output = myTag`That ${person} is a ${age}.`;
const value1 = "world1";
const value2 = "world2";

const purple = new Signal("purple");
const blue = new Signal("blue");

const plue = new Signal({
  background: blue,
  color: purple,
});

setInterval(() => {
  purple.value = purple.value == "purple" ? "white" : "purple";
}, 11100);
setInterval(() => {
  blue.value = blue.value == "blue" ? "white" : "blue";
}, 11130);

const someName = new Signal("world");

// const someHtml1 = html`<p>Wee!</p>`
// const someHtml2 = html`<li>are unaffected by this style</li><li>will still show a bullet</li><li>and have appropriate left margin</li>`
const createdElement = document.createElement("div");

// const element = html`
//   <font color=${"red"}>This text has color.</font>
//   <font id=${69}>This text has color.</font>

//   <font color=${purple}>This text has color.</font>
//   <font color=${purple}>This text has color.</font>
//   <button onclick=${() => alert("hello!")}>click me</button>

//   <span style=${{ background: "red" }}>It’s all red!</span>
//   <span style=${plue}>XXXXX It’s all blue!</span>
//   <span ${{style: {background: "yellow", fontWeight: "bold"}}}>whoa</span>

//   <span
//     ${{
//       onmouseover: function() {
//         this.style.background = "yellow";
//       },
//       onmouseout: function() {
//         this.style.background = "";
//       },
//     }}
//     >hover me</span>

//   <h1>GG ${value1}</h1>
//   <h1>Hello ${someName}</h1>
//   <h1>Hello ${someHtml1}</h1>
//   <h1>Hello ${someHtml2}</h1>
//   <h1>Hello ${createdElement}</h1>
//   <button disabled=${true}>Can’t click me</button>
// `;


function feature(user={}){
  const defaults = {
    title: 'Featured Title',
    text: `Paragraph of text beneath the heading to explain the heading. We'll add onto it with another sentence and probably just keep going until we run out of words.`,
    href: '#',
    icon: 'bi bi-alarm',
  };
  const {title, text, href, icon} = Object.assign({}, defaults, user);
  console.log({title, text, href, icon})
  return html`
    <div class="feature col">
      <div class="feature-icon d-inline-flex align-items-center justify-content-center text-bg-primary bg-gradient fs-2 mb-3 px-2 rounded ">
        <i class="${icon}" style="font-size: 2rem;"></i>
      </div>
      <h3 class="fs-2 text-body-emphasis">${title}</h3>
      <p>${text}</p>
      <a href="${href}" class="icon-link">
        Call to action
        <i class="bi bi-chevron-right"></i>
      </a>
    </div>
  `;
}

const websiteVer = '1.0.0';
const websiteName = new Signal("Project Hexafoil");
const websiteIcon = new Signal('bi bi-flower1');
const piSymbol = document.createElement("sup"); piSymbol.innerText = 'π';

setInterval(() => {
  websiteIcon.value = 'bi bi-' + oneOf(['flower1', 'flower2', 'flower3','flower3', 'flower3']);
}, 200);

const website = {

  mainFeatures: [
    {icon:'bi bi-flower1'},
    {icon:'bi bi-flower2'},
    {icon:'bi bi-flower3'},
  ],
  alsoFeatures: [
    {icon:'bi bi-snow'},
    {icon:'bi bi-snow2'},
    {icon:'bi bi-snow3'},
  ],
  littleNotes: [
    {icon:'bi bi-snow'},
    {icon:'bi bi-snow2'},
    {icon:'bi bi-snow3'},
  ],

}

function emailSimulator(){
  const inboxNotification = {
    context: new Signal('btn-primary'),
    count: new Signal(2),
  };
  inboxNotification.count.subscribe(v=>{
    if(v<5) inboxNotification.context.value = 'btn-primary';
    if(v>=5) inboxNotification.context.value  = 'btn-warning';
    if(v>=10) inboxNotification.context.value  = 'btn-danger';
    if(v>=10) inboxNotification.context.value  = 'btn-danger';
  });
  setInterval(() => {
    inboxNotification.count.value += Math.floor(2*Math.random());
  }, 1_000);
  return html`
    <button type="button" class=${['btn', 'position-relative', inboxNotification.context ]}>
      Inbox
      <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow">
        ${inboxNotification.count}+
        <span class="visually-hidden">unread messages</span>
      </span>
    </button>
    <button type="button" class="btn btn-secondary btn-sm" ${{onclick: function(){inboxNotification.count.value=0}}}>
      <i class="bi bi-trash"></i>
    </button>
    <button type="button" class="btn btn-secondary btn-sm" ${{onclick: function(){inboxNotification.count.value++}}}>Send</button>
    <p>It can get pretty fancy</p>
  `;
}

const main = html`
    <main>

      <div class="container-fluid px-4 py-5 shadow" id="featured-3">
        <h2 class="pb-2 border-bottom">${websiteName}<sup>${websiteVer}${piSymbol}</sup> <i class='${websiteIcon}'></i></h2>
        <div class="row g-4 py-5 row-cols-1 row-cols-lg-3">
          ${website.mainFeatures.map(o=>feature(o))}
        </div>
      </div>

      <div class="container-fluid px-4 py-5 shadow" id="featured-3">
        <div class="row g-4 py-5 row-cols-1 row-cols-lg-3">
          ${website.alsoFeatures.map(o=>feature(o))}
        </div>
      </div>

      <div class="container-fluid px-4 py-5 shadow" id="featured-3">
        <div class="row g-4 py-5  ">

          <div class="col-9">
            ${  highlighter(emailSimulator.toString()) }
          </div>

          <div class="col-3">
            ${emailSimulator()}
          </div>

        </div>
      </div>

  </main>
`;

document.body.appendChild(main);
console.log(document.body.innerHTML);

console.log( highlighter(emailSimulator.toString()) )

setTimeout(() => {
  //console.log(element.unsubscribe());
}, 115_000);


/*

  hypnotize
  hurricane
  infinity

  snow
  snow2
  snow3

  star
  star-fill
  star-half
  stars


  bounding-box-circles
  braces-asterisk
  brilliance
  broadcast

  brightness-high
  brightness-high-fill
  brightness-low
  flower1
  flower2
  flower3
  gear
  gear-fill
  gear-wide
  gear-wide-connected



  command
  cpu
  cookie

*/


/**
 * Returns a random element from the provided array, or null if input is invalid.
 * @param {Array} list
 * @returns {*|null}
 */
function oneOf(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

/**
 * Lightweight syntax highlighter.
 * @param {string} srcStr - Source code as a string.
 * @param {Object} [options] - Optional: highlight maps. Example:
 *   {
 *     keywords: { list: ["function", "return"], class: "text-primary" },
 *     types: { list: ["string", "number"], class: "text-info" },
 *     literals: { list: ["true", "false", "null"], class: "text-success" },
 *     comment: { regex: /\/\/.asterisk/g, class: "text-secondary-emphasis" }
 *   }
 */
function highlighter(srcStr, options) {

  // // Final output
  const pre = document.createElement("pre");
  pre.classList.add('rounded', 'border', 'border-black', 'shadow');
  const code = document.createElement("code");
  code.classList.add('hljs', );
  code.innerHTML = hljs.highlight(srcStr, {language: 'JavaScript'}).value
  pre.appendChild(code);
  return pre;

}

// Usage Example:
// document.body.appendChild(highlighter(`function foo(x) {
//   // comment
//   var str = "hello";
//   return str + x * 2;
// }`));

import { html, Signal } from 'https://cdn.jsdelivr.net/npm/luminiferous';

const value1 = "Hello";
const value2 = new Signal("World");

setInterval(() => {
  value2.value = value2.value == "World" ? "Universe" : "World";
}, 666);

const content = html`
  <main class="p-5">
    <div class="alert alert-info" role="alert">${value1} ${value2}</div>
  </main>
`;

document.body.appendChild(content);
//IMPORTANT: to unsubscribe from signals: execute content.unsubscribe();

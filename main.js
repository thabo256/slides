import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@3.2.3/+esm';

const svgs = {
  questionmark: '?',
  neko: '<svg height="3ex" viewBox="0 0 48 48"><defs><style>.a{fill:none;stroke:#000000;stroke-linecap:round;stroke-linejoin:round;}.b{fill:#000000;}</style></defs><path class="a" d="M30.37,23.32a13.6,13.6,0,0,0,3-8.37A9.16,9.16,0,0,0,30,8.24S29.73,5,28.7,4.56s-4.1,2-4.1,2-5,.21-6.93,1.49c0,0-4.44-1.06-5-.29s.26,4.14.26,4.14a9.1,9.1,0,0,0-1.45,5.17c0,3.25,4.91,7.83,4.91,7.83a21.21,21.21,0,0,0-3.12,10.43c0,4.27,2.08,5.3,2.08,5.3"/><path class="a" d="M17.25,29.61,20.15,41s-1.24,2.52,2.57,2.52,3-3.16,1.92-3.59l-1.88-7.22"/><path class="a" d="M29.13,38.07c-2,.81-2.74,3.93.81,3.93s4.92-4,4.92-6.75a29.07,29.07,0,0,0-1.24-6.75,4.25,4.25,0,0,0,1.24-1.84c.17-.9,1.11-10,1.19-10.39a4.27,4.27,0,0,0,.47-1.49,2.65,2.65,0,0,0-3.49-2"/><path class="a" d="M25.23,40.44a19,19,0,0,1,2.25-.27"/><path class="a" d="M20,41.57a6.68,6.68,0,0,1-2.82.43c-1.07,0-3.5-1.77-.15-3.91"/><circle class="a" cx="22.93" cy="27.96" r="2.51"/><path class="a" d="M23.89,25.62a37.14,37.14,0,0,0,5.88-.71"/><path class="a" d="M16.39,24.91a29.71,29.71,0,0,0,5.61.72"/><path class="a" d="M24.76,12.63a2.91,2.91,0,0,1,3.76-.72"/><path class="a" d="M15.37,14.36a2.91,2.91,0,0,1,3.76-.71"/><path class="a" d="M25.92,16.07C24.47,18.32,23,17,22.42,16c-.09,1.34-.94,3.11-2.91,1.34"/><path class="a" d="M28.77,14a3.79,3.79,0,0,0,2.31-.57"/><path class="a" d="M29,15.27A4.66,4.66,0,0,0,31.51,15"/><path class="a" d="M28.77,16.44a2.86,2.86,0,0,0,2.45,0"/><path class="a" d="M16.17,16.74a3.82,3.82,0,0,1-2.37.17"/><path class="a" d="M16.33,18.06a4.6,4.6,0,0,1-2.46.47"/><path class="a" d="M16.93,19.1a2.87,2.87,0,0,1-2.33.76"/><circle class="b" cx="22.21" cy="15.16" r="0.75"/><path class="a" d="M12.93,11.91C13.8,10.5,15,9.39,17.67,8.06"/><path class="a" d="M24.6,6.57A8.35,8.35,0,0,1,30,8.24"/></svg>',
};

const lineNumbers = document.querySelector('.line-numbers');
const editor = document.querySelector('#editor');
const lnColInfo = document.querySelector('#ln-col-info');
const resizer = document.querySelector('.resizer');
const preview = document.querySelector('.preview');
const menuButton = document.querySelector('#menu-button');
const menu = document.querySelector('.menu-sidebar');

/**
 * Updates the slides in the preview area based on the markdown formatted text.
 * @param {string} text markdown formatted text to be converted to HTML
 */
const updateSlides = text => {
  preview.innerHTML = '';
  const split = text.split(/^( {0,3}#{1,2}[ \t]+(.+?)(?:[ \t]+#*[ \t]*)?)$/gm);

  for (let i = 1; i < split.length; i += 3) {
    let content;
    let classes = [];

    if (/^ {0,3}<!--contents-->/m.test(split[i + 2])) {
      content = split[i] + '\n\n';
      for (let j = i + 4; j < split.length; j += 3) {
        content += `- [${split[j]}](#slide-${(j - 2) / 3})\n`;
      }
    } else if (/^ {0,3}<!--flex-->/m.test(split[i + 2])) {
      content = split[i] + '\n\n<div class="flex-container">\n';

      const items = split[i + 2].split(/^(?= {0,3}###[ \t]+.+?(?:[ \t]+#*[ \t]*)?$)/gm);

      for (let j = 1; j < items.length; j++) {
        content += `<div class="flex-item">\n\n${items[j]}</div>\n`;
      }
      content += '</div>';
    } else {
      content = split[i] + split[i + 2];
    }
    if (/^ {0,3}<!--bg-.*?-->/m.test(split[i + 2])) {
      classes.push(split[i + 2].match(/^ {0,3}<!--(bg-.*?)-->/m)[1]);
    }

    let parsed = DOMPurify.sanitize(marked.parse(content));

    // remove disabled attribute from checkboxes
    parsed = parsed.replace(/(?<=<input type="checkbox" )disabled=""(?=(?: checked="")?>)/g, '');

    // replace svg
    parsed = parsed.replace(/<svg[^>]*>\[([\s\S]*?)\]<\/svg>/g, (match, tag) => {
      return svgs[tag] ?? svgs.questionmark;
    });

    const slide = document.createElement('div');
    slide.classList.add('slide');
    slide.classList.add(/^ {0,3}##/.test(split[i]) ? 'text-slide' : 'title-slide');
    slide.classList.add(...classes);
    slide.id = `slide-${(i - 1) / 3}`;
    slide.innerHTML = parsed;
    preview.appendChild(slide);
    slide.addEventListener('dblclick', slideClick);
  }
};

/**
 * Updates the line numbers in the editor & the width of the editor.
 */
const valueChange = () => {
  const lines = editor.value.match(/\n/g) ?? [];

  const difference = lines.length + 1 - lineNumbers.childNodes.length;

  if (difference > 0) {
    for (let i = 0; i < difference; i++) {
      const lineNumber = document.createElement('div');
      lineNumber.textContent = lineNumbers.childNodes.length + 1;
      lineNumbers.appendChild(lineNumber);
    }
  } else if (difference < 0) {
    for (let i = 0; i < Math.abs(difference); i++) {
      lineNumbers.removeChild(lineNumbers.lastChild);
    }
  }

  editor.style.width = `${Math.max(...editor.value.split(/\n/g).map(line => line.length)) + 2}ch`;

  updateSlides(editor.value);
  localStorage.setItem('editorContent', editor.value);
};

/**
 * Corrects the scroll position of the editor when the cursor is at the beginning of a line.
 *
 * Also updates the line and column number information.
 */
const caretChange = () => {
  // correct scroll
  if (editor.value.substring(editor.selectionStart - 5, editor.selectionStart).match(/\n/)) {
    editor.parentElement.parentElement.scrollLeft = 0;
  }

  const lines = [...editor.value.substring(0, editor.selectionEnd).matchAll(/\n/g)] ?? [];
  const ln = lines.length + 1;
  const col = editor.value.substring((lines[lines.length - 1]?.index ?? -1) + 1, editor.selectionEnd).length + 1;

  lnColInfo.textContent = `Ln ${ln}, Col ${col}`;
};

editor.addEventListener('keydown', event => {
  if (event.key === 'Tab') {
    event.preventDefault();

    if (editor.selectionStart === editor.selectionEnd) {
      const caret = editor.selectionStart;

      // Insert 2 spaces at the cursor position
      editor.value = editor.value.substring(0, caret) + '  ' + editor.value.substring(editor.selectionEnd);

      // Move the cursor to the right
      editor.selectionStart = editor.selectionEnd = caret + 2;
    } else {
      let start = editor.selectionStart;
      let end = editor.selectionEnd;

      // array of lines as matches (includes lines and their index)
      const lines = [...editor.value.matchAll(/^.*$/gm)];

      const startline = lines.findLastIndex(line => line.index <= start);
      const endline = lines.findLastIndex(line => line.index <= end);

      if (event.shiftKey) {
        // if shifted: reindent

        // keep track of the start and end of the selection
        if (lines[startline].toString().match(/^\s{2}/)) start -= 2;
        for (let i = startline; i <= endline; i++) {
          if (lines[i].toString().match(/^\s{2}/)) end -= 2;
          lines[i] = lines[i].toString().replace(/^\s{2}/, '');
        }
        editor.value = lines.join('\n');
        editor.selectionStart = start;
        editor.selectionEnd = end;
      } else {
        for (let i = startline; i <= endline; i++) {
          lines[i] = `  ${lines[i]}`;
        }
        editor.value = lines.join('\n');
        // calculate the new start and end of selection
        editor.selectionStart = start + 2;
        editor.selectionEnd = end + (endline - startline + 1) * 2;
      }
    }

    valueChange();
  }
  if (['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    caretChange();
  }
});

editor.addEventListener('keyup', event => {
  if (['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    caretChange();
  }
});

editor.addEventListener('click', caretChange);

editor.addEventListener('input', event => {
  valueChange();
  caretChange();
});

document.querySelector('.editor-padding').addEventListener('click', event => {
  editor.focus();
  editor.setSelectionRange(editor.value.length, editor.value.length);
  caretChange();
});

window.onload = () => {
  const editorPercentage = parseFloat(localStorage.getItem('editorPercentage')) || 0.7;
  document.querySelector('.editor-tab').style.width = `${editorPercentage * 100}%`;
  preview.style.width = `${(1 - editorPercentage) * 100}%`;

  // TODO: add example/tutorial slides
  editor.value = localStorage.getItem('editorContent') || '';

  valueChange();
};

resizer.addEventListener('mousedown', event => {
  event.preventDefault();
  document.addEventListener('mousemove', mouseMove);
  document.addEventListener('mouseup', mouseUp);
});
resizer.addEventListener('touchstart', event => {
  if (document.documentElement.clientWidth < 600) return;
  event.preventDefault();
  document.addEventListener('touchmove', touchMove, { passive: false });
  document.addEventListener('touchend', mouseUp);
  document.addEventListener('touchcancel', mouseUp);
});
const percentage = (value, min, max) => {
  return (value - min) / (max - min);
};
const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};
const mouseMove = event => {
  event.preventDefault();
  const padding = parseInt(window.getComputedStyle(document.body).getPropertyValue('--padding'));
  const editorPercentage = clamp(percentage(event.clientX, padding * 1.5, window.innerWidth - padding * 1.5), 0.1, 0.9);
  document.querySelector('.editor-tab').style.width = `${editorPercentage * 100}%`;
  preview.style.width = `${(1 - editorPercentage) * 100}%`;
};
const touchMove = event => {
  event.preventDefault();
  if (event.touches.length > 1) return;
  const padding = parseInt(window.getComputedStyle(document.body).getPropertyValue('--padding'));
  const editorPercentage = clamp(percentage(event.touches[0].clientX, padding * 1.5, window.innerWidth - padding * 1.5), 0.1, 0.9);
  document.querySelector('.editor-tab').style.width = `${editorPercentage * 100}%`;
  preview.style.width = `${(1 - editorPercentage) * 100}%`;
};
const mouseUp = event => {
  event.preventDefault();
  document.removeEventListener('mousemove', mouseMove);
  document.removeEventListener('mouseup', mouseUp);
  document.removeEventListener('touchmove', touchMove);
  document.removeEventListener('touchend', mouseUp);
  document.removeEventListener('touchcancel', mouseUp);
  const editorPercentage = document.querySelector('.editor-tab').style.width.replace('%', '') / 100;
  localStorage.setItem('editorPercentage', editorPercentage);
};

/**
 * Selects the clicked slide in the editor.
 * @param {MouseEvent} event
 */
const slideClick = event => {
  const title = event.currentTarget.firstElementChild.innerText;
  const index = editor.value.search(new RegExp(`(?<=^ {0,3}#{1,2}[ \t]+)${title}(?:[ \t]+#*[ \t]*)?$`, 'm'));

  editor.setSelectionRange(index, index + title.length);
  editor.focus();
};

/**
 * Downloads a file with the given filename and text.
 * @param {String} filename the name of the downloaded file
 * @param {String} text the content of the file
 */
const downloadFile = (filename, text) => {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 0);
};

/**
 * parses the given text for features
 * @param {string} text text to parse for features
 * @returns {string[]} array of features found in the text
 */
const parseFeatures = text => {
  const features = [];
  if (/^ {0,3}<!--contents-->/m.test(text)) {
    features.push('contents');
  }
  if (/^ {0,3}<!--flex-->/m.test(text)) {
    features.push('flex');
  }
  if (/^ {0,3}<!--bg-.*?-->/m.test(text)) {
    features.push('bg');
  }
  return features;
};

/**
 * gets the CSS styles for the given features.
 * @param {string[]} features
 * @returns {string} CSS styles for the given features
 */
const getStyles = features => {
  let styles = '';

  if (features.includes('flex')) {
    styles += '.flex-container { display: flex; justify-content: space-evenly; gap: 16px; }\n';
  }
  if (features.includes('bg')) {
    styles += '.bg-dark { background-color: #333; }\n';
    styles += '.bg-light { background-color: #f0f0f0; }\n';
    styles += '.bg-blue { background-color: blue }\n';
    styles += '.bg-green { background-color: green }\n';
    styles += '.bg-red { background-color: red }\n';
    styles += '.bg-blur { backdrop-filter: blur(0.25em); }\n';
  }
  return styles;
};

document.querySelector('#download-button').addEventListener('click', () => {
  const title = 'Presentation';
  const styles = `<style>\n${getStyles(parseFeatures(editor.value))}</style>`;

  fetch('html-template.html')
    .then(r => r.text())
    .then(html => {
      html = html.replace(/{{title}}/, title);
      html = html.replace(/{{styles}}/, styles);
      html = html.replace(/{{body}}/, preview.innerHTML);

      downloadFile('presentation.html', html);
    });
});

menuButton.addEventListener('click', () => {
  if (menuButton.getAttribute('aria-expanded') === 'true') {
    menuButton.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
  } else {
    menuButton.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
  }
});

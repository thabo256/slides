import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@3.2.3/+esm';
import { svgs } from './svgs.js';

const lineNumbers = document.querySelector('.line-numbers');
const editor = document.querySelector('#editor');
const lnColInfo = document.querySelector('#ln-col-info');
const resizer = document.querySelector('.resizer');
const preview = document.querySelector('.preview');
const menuButton = document.querySelector('#menu-button');
const menu = document.querySelector('#menu-sidebar');

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
      return svgs[tag] ?? svgs.not_found ?? '?';
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

import { marked } from 'https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js';
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@3.2.3/+esm';

const lineNumbers = document.querySelector('.line-numbers');
const editor = document.querySelector('#editor');
const lnColInfo = document.querySelector('#ln-col-info');
const resizer = document.querySelector('.resizer');
const preview = document.querySelector('.preview');

const updateSlides = (text) => {
  const split = text.split(/^( {0,3}#{1,2}[ \t]+(.+?)(?:[ \t]+#*[ \t]*)?)$/gm);

  for (let i = 1; i < split.length; i += 3) {
    let parsed = DOMPurify.sanitize(marked.parse(split[i] + split[i + 2]));

    // remove disabled attribute from checkboxes
    parsed = parsed.replace(/(?<=<input type="checkbox" )disabled=""(?=(?: checked="")?>)/g, '');

    const slide = document.createElement('div');
    slide.classList.add('slide');
    slide.classList.add(/^ {0,3}##/.test(split[i]) ? 'text-slide' : 'title-slide');
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

  editor.style.width = `${Math.max(...editor.value.split(/\n/g).map((line) => line.length)) + 2}ch`;

  updateSlides(editor.value);
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

editor.addEventListener('keydown', (event) => {
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

      const startline = lines.findLastIndex((line) => line.index <= start);
      const endline = lines.findLastIndex((line) => line.index <= end);

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

editor.addEventListener('keyup', (event) => {
  if (['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    caretChange();
  }
});

editor.addEventListener('click', caretChange);

editor.addEventListener('input', (event) => {
  valueChange();
  caretChange();
});

document.querySelector('.editor-padding').addEventListener('click', (event) => {
  editor.focus();
  editor.setSelectionRange(editor.value.length, editor.value.length);
  caretChange();
});

window.onload = () => {
  valueChange();

  // fetch('TODO.md')
  //   .then((r) => r.text())
  //   .then((text) => {
  //     updateSlides(text);
  //   });

  const editorPercentage = parseFloat(localStorage.getItem('editorPercentage')) || 0.7;
  document.querySelector('.editor-tab').style.width = `${editorPercentage * 100}%`;
  preview.style.width = `${(1 - editorPercentage) * 100}%`;
};

resizer.addEventListener('mousedown', (event) => {
  event.preventDefault();
  document.addEventListener('mousemove', mouseMove);
  document.addEventListener('mouseup', mouseUp);
});
resizer.addEventListener('touchstart', (event) => {
  if (document.documentElement.clientWidth < 600) return;
  event.preventDefault();
  document.addEventListener('touchmove', touchMove, { passive: false });
  document.addEventListener('touchend', mouseUp);
  document.addEventListener('touchcancel', mouseUp);
});
const mouseMove = (event) => {
  event.preventDefault();
  const editorPercentage = Math.min(Math.max(event.clientX / window.innerWidth, 0.1), 0.9);
  document.querySelector('.editor-tab').style.width = `${editorPercentage * 100}%`;
  preview.style.width = `${(1 - editorPercentage) * 100}%`;
};
const touchMove = (event) => {
  event.preventDefault();
  if (event.touches.length > 1) return;
  const editorPercentage = Math.min(Math.max(event.touches[0].clientX / window.innerWidth, 0.1), 0.9);
  document.querySelector('.editor-tab').style.width = `${editorPercentage * 100}%`;
  preview.style.width = `${(1 - editorPercentage) * 100}%`;
};
const mouseUp = (event) => {
  event.preventDefault();
  document.removeEventListener('mousemove', mouseMove);
  document.removeEventListener('mouseup', mouseUp);
  document.removeEventListener('touchmove', touchMove);
  document.removeEventListener('touchend', mouseUp);
  document.removeEventListener('touchcancel', mouseUp);
  const editorPercentage = document.querySelector('.editor-tab').style.width.replace('%', '') / 100;
  localStorage.setItem('editorPercentage', editorPercentage);
};

const slideClick = (event) => {
  const title = event.currentTarget.firstElementChild.innerText;
  const index = editor.value.search(new RegExp(`(?<=^ {0,3}#{1,2}[ \t]+)${title}(?:[ \t]+#*[ \t]*)?$`, 'm'));

  editor.setSelectionRange(index, index + title.length);
  editor.focus();
};

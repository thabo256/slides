export default class converter {
  static makeHtml(text) {
    // replace crlf & cr with lf
    text = text.replace(/\r\n/g, '\n');
    text = text.replace(/\r/g, '\n');

    const lines = text.split('\n');

    const element1 = new element('div');

    element1.blocks(lines);

    return element1.e;
  }
}

class element {
  /**
   * @param {Array<string>} lines
   */
  blocks(lines) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Thematic breaks
      if (/^ {0,3}([-_*])[ \t]*(?:\1[ \t]*){2,}$/.test(line)) {
        this.e.appendChild(document.createElement('hr'));
      } else {
        // ATX headings
        const match = line.match(/^ {0,3}(#{1,6})(?:[ \t]*$|[ \t]+#*[ \t]*$|[ \t]+(.+?)(?:[ \t]+#*[ \t]*)?$)/);
        if (match) {
          const heading = new element('h' + match[1].length);
          heading.inline(match[2] ?? '');
          this.e.appendChild(heading.e);
        }
      }
    }
  }

  /**
   * @param {string} line
   */
  inline(line) {
    this.e.appendChild(document.createTextNode(line));
  }

  /**
   * @param {string} tag
   */
  constructor(tag) {
    this.e = document.createElement(tag);
  }

  // constructor(tag, content, attributes) {
  //   if (typeof tag !== 'string') throw new TypeError('element tag must be of type string');
  //   if (content !== undefined && typeof content !== 'string') throw new TypeError('element content must be of type string');
  //   if (attributes !== undefined && typeof attributes !== 'object') throw new TypeError('element attributes must be in object');
  //   this.tag = tag;
  //   this.content = content;
  //   this.attributes = attributes;
  // }
}

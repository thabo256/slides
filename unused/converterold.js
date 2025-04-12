class converter {
  static makeHtml(text) {
    // replace newlines
    text = text.replace(/\r\n/g, '\n');
    text = text.replace(/\r/g, '\n');
    // ampersand
    text = text.replace(/&(?!#?[xX]?(?:[0-9a-fA-F]+|\w+);)/g, '&amp;');
    // angles
    text = text.replace(/\\</g, '&lt;');
    text = text.replace(/\\>/g, '&gt;');

    // headings
    text = text.replace(/^(#{1,6}) (.+?)\n/gm, (match, m1, m2) => {
      // TODO: add header id
      return `<h${m1.length}>${m2}</h${m1.length}>`;
    });

    // emphasis
    text = text.replace(/([^\\])\*\*\*(.+?)\*\*\*/g, '$1<strong><em>$2</em></strong>');
    text = text.replace(/([^\\])\*\*(.+?)\*\*/g, '$1<strong>$2</strong>');
    text = text.replace(/([^\\])\*(.+?)\*/g, '$1<em>$2</em>');
    text = text.replace(/([^\\])___(.+?)___/g, '$1<strong><em>$2</em></strong>');
    text = text.replace(/([^\\])__(.+?)__/g, '$1<strong>$2</strong>');
    text = text.replace(/([^\\])_(.+?)_/g, '$1<em>$2</em>');

    // horizontal rules
    text = text.replace(/^\*{3,}$/gm, '<hr />');
    text = text.replace(/^-{3,}$/gm, '<hr />');

    // images
    text = text.replace(/\!\[(.*?)]\(\s*<?([^\s'"]*?)>?\s*(?:(["'])(.*?)\3)?\s*\)/g, (match, alttext, path, m3, title) => {
      if (title) {
        return `<img href="${path}" alt="${alttext}" title="${title}" />`;
      }
      return `<img href="${path}" alt="${alttext}" />`;
    });

    // links
    text = text.replace(/\[(.*?)]\(\s*<?([^\s'"]*?)>?\s*(?:(["'])(.*?)\3)?\s*\)/g, (match, m1, m2, m3, m4) => {
      if (m4) {
        return `<a href="${m2}" title="${m4}">${m1}</a>`;
      }
      return `<a href="${m2}">${m1}</a>`;
    });
    text = text.replace(/<((?:https?|ftp):\/\/[^'">\s]+)>/gi, '<a href="$1">$1</a>');

    // code

    // paragraphs
    // TODO

    // blockquotes
    // TODO

    // lists
    // TODO

    // remove escape characters
    text = text.replace(/\\(\\?)/g, '$1');
    return text;
  }
}

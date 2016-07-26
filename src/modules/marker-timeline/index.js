import { subscribe, publish } from 'minpubsub';

const timeToSeconds = time => {
  const t = time.split(':');
  const h = parseFloat(t[0]) * 60 * 60;
  const m = parseFloat(t[1]) * 60;
  const s = parseFloat(t[2]);
  return h + m + s;
};

const chapters = url => fetch(url)
.then(data => data.text())
.then(text => text.replace('WEBVTT\n\n', '').split('\n\n'))
.then(arry => arry.map(chapter => chapter.split('\n')))
.then(arry => arry.map(chapter => ({
  type: 'chapter',
  id: chapter[0],
  start: timeToSeconds(chapter[1].split(' --> ')[0]),
  end: timeToSeconds(chapter[1].split(' --> ')[1]),
  title: chapter[2],
})));

const captions = url => fetch(url)
.then(data => data.text())
.then(text => text.split('\n\n'))
.then(arry => arry.map(caption => caption.split('\n')))
.then(arry => arry.filter(caption => caption[1] !== undefined))
.then(arry => arry.map(caption => ({
  type: 'caption',
  id: caption[0],
  start: timeToSeconds(caption[1].split(' --> ')[0].replace(',', '.')),
  end: timeToSeconds(caption[1].split(' --> ')[1].replace(',', '.')),
  title: caption.slice(2)
        .join(' ')
        .replace('>> ', '')
        .replace('-', '') || '[NO SPEECH]',
})));

const markers = ep => Promise.all([chapters(ep.chapters), captions(ep.captions)])
.then(values => values[0].concat(values[1]))
.then(items => items.sort((a, b) => {
  if (a.start > b.start) { return 1; }
  if (a.start < b.start) { return -1; }
  return 0;
}));

export default {
  render(selector, data) {
    markers(data)
    .then(marks => {
      const container = document.querySelector('marker-timeline');
      const fragment = document.createDocumentFragment();
      const template = mark => `<span>${mark.title}</span>`;
      container.innerHTML = '';
      marks.forEach(mark => {
        const div = document.createElement('mark-');
        const duration = (mark.end - mark.start);
        if (mark.type === 'caption') div.style.flex = `${duration} ${duration} auto`;
        div.setAttribute('type', mark.type);
        div.setAttribute('start', mark.start);
        div.setAttribute('end', mark.end);
        div.innerHTML = template(mark);
        div.addEventListener('click', () => {
          publish('video:seekTo', [mark.start]);
          publish('markers:updateActive', [mark.start]);
        });
        fragment.appendChild(div);
      });
      container.appendChild(fragment);
    });
  },
};

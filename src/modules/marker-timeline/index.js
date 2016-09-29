import { subscribe, publish } from 'minpubsub';

const setProgress = (time, duration) => {
  const container = document.querySelector('marker-timeline');
  const progress = (time / duration) * 100;
  container.style['background-image'] =
    `linear-gradient(to right,
      #333 0px,
      #333 ${progress}%,
      #a41034 ${progress}%,
      #a41034 ${progress + 1}%,
      #333 ${progress + 1}%,
      #333 100%)`;
};

const updateActiveMarker = time => {
  // Find active caption mark in timeline
  const $targetCaption = [...document.querySelectorAll('marker-timeline mark-[type="caption"]')]
  .find(x => time < parseFloat(x.getAttribute('end')));
  if ($targetCaption) {
    // Remove active class from any active caption mark
    [...document.querySelectorAll('marker-timeline mark-[type="caption"].active')]
    .forEach(x => x.classList.remove('active'));
    // Add active class to found marks
    $targetCaption.classList.add('active');
  }
};

function round(value, precision) {
  const multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
}

export default {
  initialize() {
    const container = document.querySelector('marker-timeline');
    subscribe('markers:fetched', this.render('marker-timeline'));
    subscribe('video:tick', updateActiveMarker);
    subscribe('video:tick', setProgress);
    container.addEventListener('click', (e) => {
      const percent = round(e.pageX / window.innerWidth, 2);
      publish('video:seekToPercent', [percent]);
    });
    container.addEventListener('mousemove', (e) => {
      const target = document.querySelectorAll(':hover');
      if (target[target.length - 1].getAttribute('type') !== 'chapter') {
        const pos = (e.pageX - container.offsetLeft) / container.offsetWidth;
        publish('timeline:mouseover', [pos.toFixed(3), e]);
      } else publish('timeline:mouseleave');
    });
    container.addEventListener('mouseleave', () => {
      publish('timeline:mouseleave');
    });
  },
  render(selector) {
    return (data) => {
      const container = document.querySelector(selector);
      const fragment = document.createDocumentFragment();
      const template = mark => `<span>${mark.title}</span>`;

      container.innerHTML = '';
      data.forEach(mark => {
        const duration = (mark.end - mark.start);
        let div;
        if (mark.type === 'chapter') {
          div = document.createElement('chapter-');
          div.setAttribute('title', mark.title);
          div.addEventListener('click', (e) => {
            e.stopPropagation();
            publish('video:seekTo', [e.currentTarget.nextElementSibling.getAttribute('start')]);
            window.ga('send', 'event', 'chapter', 'click', mark.title, mark.start);
          });
        }
        if (mark.type === 'caption') {
          div = document.createElement('mark-');
          div.style.flex = `${duration} ${duration} auto`;
          div.addEventListener('click', (e) => {
            e.stopPropagation();
            publish('video:seekTo', [mark.start]);
            window.ga('send', 'event', 'caption', 'click', mark.title, mark.start);
          });
        }
        div.setAttribute('type', mark.type);
        div.setAttribute('start', mark.start);
        div.setAttribute('end', mark.end);
        div.innerHTML = template(mark);
        fragment.appendChild(div);
      });

      container.appendChild(fragment);
    };
  },
};

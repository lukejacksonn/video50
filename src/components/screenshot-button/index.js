import { subscribe, publish } from 'minpubsub';
import { videoScreenshotFromUrl,
         cdnEpisodefromUrl } from '../../helpers/cdn.js';
import { isMobile } from '../../helpers/document.js';
import { Fetch, Node, Bind, Draw } from '../../helpers/xs.js';

const action = {
  request(e) {
    publish('video:getCurrentTime', [':screenshotButton']);
  },
  screenshot(time) {
    const $elem = document.querySelector('screenshot-button button');
    const episode = cdnEpisodefromUrl().split('/').pop();
    const primary = document.querySelector('main .primary');
    const mode = document.body.getAttribute('experience');
    let url;
    if (mode === 'ms') {
      const src = primary.tagName === 'VIDEO-MAIN' ? 'a' : 'b';
      url = `https://cdn.cs50.net/2016/fall/lectures/${episode}/week${episode}-${src}-720p.mp4`;
    } else url = `https://cdn.cs50.net/2016/fall/lectures/${episode}/week${episode}-720p.mp4`;
    $elem.classList.add('working');
    videoScreenshotFromUrl(url, time)
    .then(() => $elem.classList.remove('working'))
  }
}

export default () => {
  const $container = document.createElement('screenshot-button');
  const render = () => {
    if(!isMobile()) {
      Fetch([{}])
      .then(Node(() => `
        <button>
          <svg viewBox="0 0 1 1"><use xlink:href="#icon-screenshot"></use></svg>
          <svg viewBox="0 0 1 1"><use xlink:href="#icon-working"></use></svg>
        </button>
      `))
      .then(Bind('button')('click')(action.request))
      .then(Draw($container));
    }
  }

  subscribe('video:currentTime:screenshotButton', action.screenshot);
  subscribe('screenshots:fetched', render);
  return $container;
}

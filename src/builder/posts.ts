import fs from 'fs-extra';
import Parser from 'rss-parser';
import { author } from '../../authors';

export default {};

const parser = new Parser();

async function fetchFeedItems(url: string) {
  const feed = await parser.parseURL(url);
  let sourceType;
  if (url.indexOf('zenn') !== -1) {
    sourceType = 'zenn';
  } else if (url.indexOf('qiita') !== -1) {
    sourceType = 'qiita';
  }

  if (!feed?.items?.length) return [];

  // return item which has title and link
  return feed.items
    .map(({ title, contentSnippet, link, isoDate }) => {
      return {
        title,
        contentSnippet: contentSnippet?.replace(/\n/g, ''),
        link,
        isoDate,
        dateMiliSeconds: isoDate ? new Date(isoDate).getTime() : 0,
        sourceType,
      };
    })
    .filter(({ title, link }) => title && link);
}

async function getFeedItemsFromSources(sources: undefined | string[]) {
  if (!sources?.length) return [];
  let feedItems = [];
  try {
    for (const url of sources) {
      const items = await fetchFeedItems(url);
      if (items) feedItems = [...feedItems, ...items];
    }
    // console.log(feedItems);
    return feedItems;
  } catch (error) {
    return;
  }
}

(async function () {
  const items = (await getFeedItemsFromSources(author.sources)) ?? [];
  items.sort((a, b) => b.dateMiliSeconds - a.dateMiliSeconds);
  fs.ensureDirSync('.contents');
  fs.writeJsonSync('.contents/posts.json', items);
})();

require('dotenv').config();
const { ApifyClient } = require('apify-client');

const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

async function run() {
    const input = {
        "searchQueries": ["impressão 3D"],
        "resultsPerPage": 2
    };

    const runInfo = await client.actor("clockworks/tiktok-scraper").call(input);
    const { items } = await client.dataset(runInfo.defaultDatasetId).listItems();
    
    if (items.length > 0) {
        const item = items[0];
        console.log("Raw Item keys:", Object.keys(item));
        console.log("videoMeta keys:", item.videoMeta ? Object.keys(item.videoMeta) : 'undefined');
        console.log("video keys:", item.video ? Object.keys(item.video) : 'undefined');
        console.log("Raw downloadUrl candidates:");
        console.log(" - item.videoMeta?.downloadAddr:", item.videoMeta?.downloadAddr);
        console.log(" - item.video?.playAddr:", item.video?.playAddr);
        console.log(" - item.playUrl:", item.playUrl);
        console.log(" - item.videoUrl:", item.videoUrl);
        console.log(" - item.webVideoUrl:", item.webVideoUrl);
    }
}
run();

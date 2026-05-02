export const getYoutubeEmbedUrl = (url) => {
try {
if (!url) return null;
if (url.includes('youtu.be')) {
const videoId = url.split('youtu.be/')[1].split(/[?&#]/)[0];
return `https://www.youtube-nocookie.com/embed/${videoId}`;
}
const parsed = new URL(url);
let videoId = parsed.searchParams.get('v');
if (!videoId && parsed.pathname.includes('/shorts/')) {
videoId = parsed.pathname.split('/shorts/')[1];
}
if (videoId) {
return `https://www.youtube-nocookie.com/embed/${videoId.split(/[?&#]/)[0]}`;
}
} catch {
return null;
}
return null;
};
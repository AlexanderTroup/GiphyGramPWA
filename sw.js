const version = '1.1'

const appAssets = [
  'index.html',
  'main.js',
  'images/flame.png',
  'images/logo.png',
  'images/sync.png',
  'vendor/bootstrap.min.css',
  'vendor/jquery.min.js'
];
const staticCacheName = `static-${version}`
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(staticCacheName)
      .then(cache => cache.addAll(appAssets))
  )
})

self.addEventListener('activate', e => {
  let cleaned = caches.keys().then(keys => {
    keys.forEach(key => {
      if (key !== staticCacheName && key.match('static-')) {
        return caches.delete(key)
      }
    })
  })
  e.waitUntil(cleaned)
})

//Static cache strategy - Cache with network fallback
const staticCache = (req, cacheName = staticCacheName) => {
  return caches.match(req).then(cachedRes => {
    if (cachedRes) return cachedRes

    return fetch(req).then(networkRes => {
      //update cache with new response
      caches.open(cacheName)
        .then(cache => cache.put(req, networkRes))

      return networkRes.clone()
    })

  })
}
//Network with Cache Fallback
const fallbackCache = async (req) => {
  try {
    const networkRes = await fetch(req);
    //check res is okay, else go to cache
    if (!networkRes.ok)
      throw 'Fetch Error';
    caches.open(staticCacheName)
      .then(cache => cache.put(req, networkRes));
    //return clone of the network response
    return networkRes.clone();
  }
  catch (err) {
    return await caches.match(req);
  }
}

// Clean old giphys from the 'giphy' cache
const cleanGiphyCache = giphys => {
  caches.open('giphy').then(cache => {
    //get all cache entries
    cache.keys().then(keys => {
      keys.forEach(key => {
        if(!giphys.includes(key.url)) cache.delete(key)
      })
    })
  })
}

//sw fetch
self.addEventListener('fetch', e => {

  // App Shell
  if (e.request.url.match(location.origin)){
    e.respondWith(staticCache(e.request))
  // Giphy API
  } else if (e.request.url.match('https://api.giphy.com/v1/gifs/trending')) {
    e.respondWith(fallbackCache(e.request))

    //Giphy Media
  } else if (e.request.url.match('giphy.com/media')){
    e.respondWith(staticCache(e.request, 'giphy'))
  }
})

//Listen for message from client
self.addEventListener('message', e => {
  if (e.data.action = 'cleanGiphyCache') cleanGiphyCache(e.data.giphys)
})
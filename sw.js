const version = '1.0'

const appAssets = [
  'index.html',
  'main.js',
  'images/flame.png',
  'images/logo.png',
  'images/sync.png',
  'vendor/bootstrap.min.css',
  'vendor/jquery.min.css'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(`static=${version}`)
      .then(cache => cache.addAll(appAssets))
  )
})

self.addEventListener('activate', e => {
  let cleaned = caches.keys().then(keys => {
    keys.forEach(key => {
      if (key !== `static-${version}` && key.match('static-')) {
        return caches.delete(key)
      }
    })
  })
  e.waitUntil(cleaned)
})

//Static cache strategy - Cache with network fallback
const staticCache = (req) => {
  return caches.match(req).then(cachedRes => {
    if (cachedRes) return cachedRes

    return fetch(req).then(networkRes => {
      //update cache with new response
      caches.open(`static-${version}`)
        .then(cache => cache.put(req, networkRes))

      return networkRes.clone()
    })

  })
}

//sw fetch
self.addEventListener('fetch', e => {
  if (e.request.url.match(location.origin)){
    e.respondWith(staticCache(e.request))
  }
})
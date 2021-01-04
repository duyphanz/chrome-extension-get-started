## Bookmark note
### How to start

https://developer.chrome.com/docs/extensions/mv3/getstarted/#manifest

### Storage structure

+ Label format: [name]|[color]

```
app {
  labels: {
    label: [{ url, title, dir }, ...]
  },
  urls: {
    url: "label"
  }, 
  boardSelectedLabels: [label, ...]
}
```
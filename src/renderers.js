const {ipcRenderer} = require('electron')
const assert = require('assert')
const isPlainObj = require('is-plain-obj')

// might browserify this?
//   + maybe use `unassertify` in non-DEBUG mode
//
// pass component list as arguments?

const components = {
  'plotly-graph': require('./components/plotly-graph/')
}

Object.keys(components).forEach((k) => {
  const specs = components[k]
  const name = specs.name
  
  const send = (info) => {
    assert.ok(isPlainObj(info))

    info.component = name
    ipcRenderer.send('asynchronous-message', info)
  }

  ipcRenderer.on(name, (event, info) => {
    specs.render(event, info, send)
  })
})

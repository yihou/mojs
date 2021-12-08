import mojs from '../mojs'

declare global {
  type mojs = typeof mojs

  // noinspection JSUnusedGlobalSymbols
  interface Window {
    mojs: mojs

  }

  interface Document {
    mozHidden?: any
    msHidden?: any
    webkitHidden?: any
  }
}

// Utils methods and map objects

import cloneWith from 'lodash.clonewith'

import mojs from './mojs'
import {BaseDelta, ColorObject, PossibleUnit} from './types'

interface ColorDelta extends BaseDelta {
  type: 'color',
  name: string,
  start: ColorObject,
  end: ColorObject,
  delta: ColorObject,
}

interface ArrayDelta extends BaseDelta {
  type: 'array',
  start: PossibleUnit[],
  end: PossibleUnit[],
  delta: PossibleUnit[],
}

interface UnitDelta extends BaseDelta {
  type: 'unit',
  start: PossibleUnit,
  end: PossibleUnit,
  delta: number,
}

interface NumberDelta extends BaseDelta {
  type: 'number',
  start: number,
  end: number,
  delta: number,
}

type Delta = ColorDelta | ArrayDelta | UnitDelta | NumberDelta

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Utils methods and map objects
//
// @class Helpers
export class Helpers {
  // ---

  // SVG namespace
  //
  // @property   NS
  // @type       {string}
  NS = 'http://www.w3.org/2000/svg'
  // ---

  // CSS styles for console.log/warn/error ::mojs:: badge styling
  //
  // @property   logBadgeCss
  // @type       {string}
  logBadgeCss = `background:#3A0839;color:#FF512F;border-radius:5px;
  padding: 1px 5px 2px; border: 1px solid #FF512F;`
  // ---

  // Shortcut map for the 16 standart web colors
  // used to coerce literal name to rgb
  //
  // @property   shortColors
  // @type       {object}
  // REMOVE WHEN ALL MODULES WILL USE DELTAS CLASS
  shortColors = {
    transparent: 'rgba(0,0,0,0)',
    none: 'rgba(0,0,0,0)',
    aqua: 'rgb(0,255,255)',
    black: 'rgb(0,0,0)',
    blue: 'rgb(0,0,255)',
    fuchsia: 'rgb(255,0,255)',
    gray: 'rgb(128,128,128)',
    green: 'rgb(0,128,0)',
    lime: 'rgb(0,255,0)',
    maroon: 'rgb(128,0,0)',
    navy: 'rgb(0,0,128)',
    olive: 'rgb(128,128,0)',
    purple: 'rgb(128,0,128)',
    red: 'rgb(255,0,0)',
    silver: 'rgb(192,192,192)',
    teal: 'rgb(0,128,128)',
    white: 'rgb(255,255,255)',
    yellow: 'rgb(255,255,0)',
    orange: 'rgb(255,128,0)',
  }
  // ---
  // none-tweenable props
  chainOptionMap = {} // callbacksContext: 1
  callbacksMap = {
    onRefresh: 1,
    onStart: 1,
    onComplete: 1,
    onFirstUpdate: 1,
    onUpdate: 1,
    onProgress: 1,
    onRepeatStart: 1,
    onRepeatComplete: 1,
    onPlaybackStart: 1,
    onPlaybackPause: 1,
    onPlaybackStop: 1,
    onPlaybackComplete: 1,
  }
  tweenOptionMap = {
    duration: 1,
    delay: 1,
    speed: 1,
    repeat: 1,
    easing: 1,
    backwardEasing: 1,
    isYoyo: 1,
    shiftTime: 1,
    isReversed: 1,
    callbacksContext: 1,
  }
  unitOptionMap = {
    left: 1,
    top: 1,
    x: 1,
    y: 1,
    rx: 1,
    ry: 1,
  }
  // strokeDashPropsMap:
  //   strokeDasharray:  1
  //   # strokeDashoffset: 1
  RAD_TO_DEG = 180 / Math.PI
  // DEG_TO_RAD: Math.PI/180

  prefix
  isFF
  isIE
  isOldOpera
  isSafari
  isChrome
  isOpera
  is3d
  uniqIDs
  div = document.createElement('div')
  defaultStyles
  remBase

  constructor() {
    this.vars()

    document.body.appendChild(this.div)

    this.defaultStyles = this.computedStyle(this.div)
  }

  vars() {
    this.prefix = this.getPrefix()
    this.getRemBase()
    this.isFF = this.prefix.lowercase === 'moz'
    this.isIE = this.prefix.lowercase === 'ms'
    const ua = navigator.userAgent
    this.isOldOpera = ua.match(/presto/gim)
    this.isSafari = ua.indexOf('Safari') > -1
    this.isChrome = ua.indexOf('Chrome') > -1
    this.isOpera = ua.toLowerCase().indexOf('op') > -1
    this.isChrome && this.isSafari && (this.isSafari = false);
    (ua.match(/PhantomJS/gim)) && (this.isSafari = false)
    this.isChrome && this.isOpera && (this.isChrome = false)
    this.is3d = this.checkIf3d()

    this.uniqIDs = -1
  }

  /**
   * Clones object by iterating thru object properties
   *
   * @method cloneObj
   * @param {object} obj to clone
   * @param {object} exclude with key names that will be excluded
   *                 from the new object, key value should
   *                 be truthy
   * @example
   *   h.cloneObj({ foo: 'bar', baz: 'bar' }, { baz: 1 })
   *   // result: { foo: 'bar' }
   * @return {object} new object
   */
  cloneObj<T extends Record<string, any>>(obj: T, exclude?) {
    const excludeKeys = Object.keys(exclude || {});

    return cloneWith(obj, function (value, key: string) {
      const shouldExclude = !excludeKeys.some(excludeKey => excludeKey == key)
      if (shouldExclude) {
        return undefined
      }

      return value
    })
  }

  /**
   * Copies keys and values from the second object to the first if
   * key was not defined on the first object
   *
   * @method extend
   *
   * @param {object} objTo copy values to
   * @param {object} objFrom copy values from
   *
   * @example
   *   var objA = { foo: 'bar' }, objB = { baz: 'bax' };
   *   h.extend(objA, objB)
   *   // result: objA{ foo: 'bar', baz: 'bax' }
   *
   * @return {object} the first modified object
   */
  extend(objTo, objFrom) {
    return {
      ...objFrom,
      ...objTo,
    }
  }

  getRemBase() {
    const html = document.querySelector('html') as HTMLElement
    const style = getComputedStyle(html)
    this.remBase = parseFloat(style.fontSize)
  }

  clamp(value: number | any, min: number | any, max: number | any) {
    if (typeof value !== 'number' || typeof min !== 'number' || typeof max !== 'number') {
      return value
    }

    if (value < min) {
      return min
    } else if (value > max) {
      return max
    }

    return value
  }

  setPrefixedStyle(el: HTMLElement, name: string, value: string) {
    if (name === 'transform' && el.style[`${this.prefix.css}${name}`] === value) {
      el.style[name] = value
    }
  }

  /**
   * Sets styles on element with prefix(if needed) on el
   *
   * @method style
   * @param {HTMLElement} element to set the styles on
   * @param {string, Partial<CSSStyleDeclaration>} style name or style: value object
   * @param {string} value
   * @example
   *   h.style(el, 'width', '20px')
   * @example
   *   h.style(el, { width: '20px', height: '10px' })
   */
  style(element: HTMLElement, style: string | Partial<CSSStyleDeclaration>, value: any) {
    if (typeof style === 'object') {
      const keys = Object.keys(style);
      let len = keys.length

      while (len--) {
        const key = keys[len];
        const value = style[key]

        this.setPrefixedStyle(element, key, value)
      }
    } else {
      this.setPrefixedStyle(element, style, value)
    }
  }

  prepareForLog(args) {
    args = Array.prototype.slice.apply(args)
    args.unshift('::')
    args.unshift(this.logBadgeCss)
    args.unshift('%cmo·js%c')
    return args
  }

  log(...args) {
    // if (mojs.isDebug === false) {
    //   return
    // }
    return console.log(...this.prepareForLog(args))
  }

  warn(...args) {
    // if (mojs.isDebug === false) {
    //   return
    // }
    return console.warn(...this.prepareForLog(args))
  }

  error(...args) {
    // if (mojs.isDebug === false) {
    //   return
    // }
    return console.error(...this.prepareForLog(args))
  }

  parseUnit(value: number | string | undefined): PossibleUnit {
    let returnVal: PossibleUnit = value
    if (typeof value === 'number') {
      returnVal = {
        unit: 'px',
        isStrict: false,
        value,
        string: value === 0 ? `${value}` : `${value}px`,
      }
    } else if (typeof value === 'string') {
      const regex = /px|%|rem|em|ex|cm|ch|mm|in|pt|pc|vh|vw|vmin|deg/gim
      let unit = value.match(regex)?.[0]
      let isStrict = true
      // if a plain number was passed set isStrict to false and add px
      if (!unit) {
        unit = 'px'
        isStrict = false
      }
      const amount = parseFloat(value)
      returnVal = {
        unit,
        isStrict,
        value: amount,
        string: amount === 0 ? `${amount}` : `${amount}${unit}`,
      }
    }

    return returnVal
  }

  bind(func, context) {
    console.warn('@deprecating bind to use native function bind?')
    return func.bind(context)
  }

  getRadialPoint(o: Partial<{ radiusX: number, radiusY: number, radius: number, rotate?: number, center: { x: number, y: number } }> = {}) {
    // return if !o.radius? or !o.rotate? or !o.center?
    const radAngle = ((o.rotate || 0) - 90) * 0.017453292519943295 // Math.PI/180
    const radiusX = o.radiusX || o.radius || 0
    const radiusY = o.radiusY || o.radius || 0
    const center = o.center || {x: 0, y: 0}

    return {
      x: center.x + (Math.cos(radAngle) * radiusX),
      y: center.y + (Math.sin(radAngle) * radiusY)
    }
  }

  getPrefix() {
    const styles = window.getComputedStyle(document.documentElement, '')
    const v = Array.prototype.slice.call(styles).join('').match(/-(moz|webkit|ms)-/)
    let pre = v[1]

    if (!v && styles['OLink']) {
      pre = 'o'
    }

    const domMatch = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))
    return {
      dom: domMatch ? domMatch[1] : undefined,
      lowercase: pre,
      css: `-${pre}-`,
      js: pre[0].toUpperCase() + pre.substr(1)
    }
  }

  strToArr(string): PossibleUnit[] {
    const arr: any[] = []
    // plain number
    if ((typeof string === 'number') && !isNaN(string)) {
      arr.push(this.parseUnit(string))
      return arr
    }
    // string array
    string.trim().split(/\s+/gim).forEach(str => {
      return arr.push(this.parseUnit(this.parseIfRand(str)))
    })
    return arr
  }

  calcArrDelta(arr1, arr2): PossibleUnit[] {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
      throw new Error('Two arrays should be passed')
    }

    const delta: PossibleUnit[] = []
    for (let i = 0; i < arr1.length; i++) {
      delta[i] = this.parseUnit(`${arr2[i].value - arr1[i].value}${arr2[i].unit}`)
    }
    return delta
  }

  isArray(variable) {
    console.warn('@deprecating isArray to use native isArray')
    return Array.isArray(variable)
  }

  normDashArrays(arr1, arr2) {
    // if !arr1? or !arr2? then throw Error 'Two arrays should be passed'
    let currItem, i, lenDiff, startI
    const arr1Len = arr1.length
    const arr2Len = arr2.length
    if (arr1Len > arr2Len) {
      let asc
      let end
      lenDiff = arr1Len - arr2Len
      startI = arr2.length
      for (i = 0, end = lenDiff, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
        currItem = i + startI
        arr2.push(this.parseUnit(`0${arr1[currItem].unit}`))
      }
    } else if (arr2Len > arr1Len) {
      let asc1, end1
      lenDiff = arr2Len - arr1Len
      startI = arr1.length
      for (i = 0, end1 = lenDiff, asc1 = 0 <= end1; asc1 ? i < end1 : i > end1; asc1 ? i++ : i--) {
        currItem = i + startI
        arr1.push(this.parseUnit(`0${arr2[currItem].unit}`))
      }
    }
    return [arr1, arr2]
  }

  makeColorObj(color) {
    // HEX
    let b, colorObj, g, r, result
    if (color[0] === '#') {
      result = /^#?([a-f\d]{1,2})([a-f\d]{1,2})([a-f\d]{1,2})$/i.exec(color)
      colorObj = {}
      if (result) {
        r = result[1].length === 2 ? result[1] : result[1] + result[1]
        g = result[2].length === 2 ? result[2] : result[2] + result[2]
        b = result[3].length === 2 ? result[3] : result[3] + result[3]
        colorObj = {
          r: parseInt(r, 16),
          g: parseInt(g, 16),
          b: parseInt(b, 16),
          a: 1,
        }
      }
    }

    // not HEX
    // shorthand color and rgb()
    if (color[0] !== '#') {
      let rgbColor
      const isRgb = (color[0] === 'r') && (color[1] === 'g') && (color[2] === 'b')
      // rgb color
      if (isRgb) {
        rgbColor = color
      }
      // shorthand color name
      if (!isRgb) {
        rgbColor = (() => {
          if (!this.shortColors[color]) {
            this.div.style.color = color
            return this.computedStyle(this.div).color
          } else {
            return this.shortColors[color]
          }
        })()
      }

      const regexString1 = '^rgba?\\((\\d{1,3}),\\s?(\\d{1,3}),'
      const regexString2 = '\\s?(\\d{1,3}),?\\s?(\\d{1}|0?\\.\\d{1,})?\\)$'
      result = new RegExp(regexString1 + regexString2, 'gi').exec(rgbColor)
      colorObj = {}
      const alpha = parseFloat(result[4] || 1)
      if (result) {
        colorObj = {
          r: parseInt(result[1], 10),
          g: parseInt(result[2], 10),
          b: parseInt(result[3], 10),
          a: (alpha != null) && !isNaN(alpha) ? alpha : 1,
        }
      }
    }

    return colorObj
  }

  computedStyle(el) {
    return getComputedStyle(el)
  }

  capitalize(str) {
    if (typeof str !== 'string') {
      throw Error('String expected - nothing to capitalize')
    }
    return str.charAt(0).toUpperCase() + str.substring(1)
  }

  parseRand(string) {
    const randArr = string.split(/rand\(|,|\)/)
    const units = this.parseUnit(randArr[2])
    const rand = this.rand(parseFloat(randArr[1]), parseFloat(randArr[2]))

    if (typeof units === 'string' || typeof units === 'number') {
      return rand
    }

    // if it's unit
    if (units && units.unit && randArr[2].match(units.unit)) {
      return rand + units.unit
    }

    return rand
  }

  parseStagger(string: string, index: number) {
    let base
    let value = string.split(/stagger\(|\)$/)[1].toLowerCase()
    // split the value in case it contains base
    // the regex splits 0,0 0,1 1,0 1,1 combos
    // if num taken as 1, rand() taken as 0
    const splittedValue = value.split(/(rand\(.*?\)|[^(,\s]+)(?=\s*,|\s*$)/gim)
    // if contains the base value
    value = (() => {
      if (splittedValue.length > 3) {
        base = this.parseUnit(this.parseIfRand(splittedValue[1]))
        return splittedValue[3]
        // if just a plain value
      } else {
        base = this.parseUnit(0)
        return splittedValue[1]
      }
    })()

    value = this.parseIfRand(value)

    // parse with units
    const unitValue = this.parseUnit(value)

    let unit = ''
    if (base.isStrict) {
      unit = base.unit
    } else {
      if (unitValue && typeof unitValue !== 'number' && typeof unitValue !== 'string') {
        unit = unitValue.isStrict ? unitValue.unit : ''
      }
    }

    let number = 0
    // add units only if option had a unit before
    if (typeof unitValue === 'object') {
      if (typeof unitValue.value === 'number') {
        number = (index * unitValue.value) + base.valueunitValue.value
      } else if (typeof unitValue.value === 'string') {
        number = (index * parseFloat(unitValue.value)) + base.valueunitValue.value
      }
    }


    if (unit) {
      return `${number}${unit}`
    } else {
      return number
    }
  }

  // ---

  // Method to parse stagger or return the passed value if
  // it has no stagger expression in it.
  parseIfStagger(value, i) {
    if (!((typeof value === 'string') && value.match(/stagger/g))) {
      return value
    } else {
      return this.parseStagger(value, i)
    }
  }


  // if passed string has rand function then get the rand value
  parseIfRand(str) {
    if ((typeof str === 'string') && str.match(/rand\(/)) {
      return this.parseRand(str)
    } else {
      return str
    }
  }

  // if delta object was passed: like { 20: 75 }
  parseDelta(key, value, index) {
    // clone the delta object before proceed
    value = this.cloneObj(value)
    // parse delta easing
    let {
      easing,
    } = value
    if (easing != null) {
      easing = mojs.easing.parseEasing(easing)
    }
    delete value.easing
    // parse delta curve
    let {
      curve,
    } = value
    if (curve != null) {
      curve = mojs.easing.parseEasing(curve)
    }
    delete value.curve

    let start: any = Object.keys(value)[0]
    let end = value[start]
    let delta: Delta = {start} as any
    // color values
    if (isNaN(parseFloat(start)) && !start.match(/rand\(/) && !start.match(/stagger\(/)) {
      if (key === 'strokeLinecap') {
        this.warn(`Sorry, stroke-linecap property is not animatable yet, using the start(${start}) value instead`, value)
        // @props[key] = start;
        return delta
      }
      const startColorObj = this.makeColorObj(start)
      const endColorObj = this.makeColorObj(end)
      delta = {
        type: 'color',
        name: key,
        start: startColorObj,
        end: endColorObj,
        easing,
        curve,
        delta: {
          r: endColorObj.r - startColorObj.r,
          g: endColorObj.g - startColorObj.g,
          b: endColorObj.b - startColorObj.b,
          a: endColorObj.a - startColorObj.a,
        },
      }
      // color strokeDasharray/strokeDashoffset
    } else if ((key === 'strokeDasharray') || (key === 'strokeDashoffset') || (key === 'origin')) {
      const startArr = this.strToArr(start)
      const endArr = this.strToArr(end)
      this.normDashArrays(startArr, endArr)

      for (let i = 0; i < startArr.length; i++) {
        start = startArr[i]
        end = endArr[i]
        this.mergeUnits(start, end, key)
      }

      delta = {
        type: 'array',
        name: key,
        start: startArr,
        end: endArr,
        delta: this.calcArrDelta(startArr, endArr),
        easing,
        curve,
      }
      //# plain numeric value ##
    } else {
      //# filter tween-related properties
      // defined in helpers.chainOptionMap
      // because tween-related props shouldn't
      //# have deltas
      if (!this.callbacksMap[key] && !this.tweenOptionMap[key]) {
        // position values defined in unitOptionMap
        if (this.unitOptionMap[key]) {
          end = this.parseUnit(this.parseStringOption(end, index))
          start = this.parseUnit(this.parseStringOption(start, index))
          this.mergeUnits(start, end, key)
          delta = {
            type: 'unit',
            name: key,
            start,
            end,
            delta: end.value - (start.value as number),
            easing,
            curve,
          }
        } else {
          // not position but numeric values
          end = parseFloat(this.parseStringOption(end, index))
          start = parseFloat(this.parseStringOption(start, index))
          delta = {
            type: 'number',
            name: key,
            start,
            end,
            delta: end - start,
            easing,
            curve,
          }
        }
      }
    }
    return delta
  }

  mergeUnits(start, end, key) {
    if (!end.isStrict && start.isStrict) {
      end.unit = start.unit
      return end.string = `${end.value}${end.unit}`
    } else if (end.isStrict && !start.isStrict) {
      start.unit = end.unit
      return start.string = `${start.value}${start.unit}`
    } else if (end.isStrict && start.isStrict) {
      if (end.unit !== start.unit) {
        start.unit = end.unit
        start.string = `${start.value}${start.unit}`
        return this.warn(`Two different units were specified on \"${key}\" delta \
property, mo · js will fallback to end \"${end.unit}\" unit `,
        )
      }
    }
  }

  rand(min, max) {
    return (Math.random() * ((max) - min)) + min
  }

  isDOM(o) {
    if ((o == null)) {
      return false
    }
    // if typeof Node is 'function' then o instanceof Node
    const isNode = (typeof o.nodeType === 'number') && (typeof o.nodeName === 'string')
    return (typeof o === 'object') && isNode
  }

  getChildElements(element) {
    const {
      childNodes,
    } = element
    const children: HTMLElement[] = []
    let i = childNodes.length
    while (i--) {
      if (childNodes[i].nodeType === 1) {
        children.unshift(childNodes[i])
      }
    }
    return children
  }

  delta(start, end) {
    const type1 = typeof start
    const type2 = typeof end
    const isType1 = (type1 === 'string') || ((type1 === 'number') && !isNaN(start))
    const isType2 = (type2 === 'string') || ((type2 === 'number') && !isNaN(end))
    if (!isType1 || !isType2) {
      this.error(`delta method expects Strings or Numbers at input \
but got - ${start}, ${end}`,
      )
      return
    }
    const obj = {}
    obj[start] = end
    return obj
  }

  // ---

  // Returns uniq id
  //
  // @method getUniqID
  // @return {number}
  getUniqID() {
    return ++this.uniqIDs
  }

  // ---

  // Returns an uniq id
  //
  // @method parsePath
  // @return {SVGPath}
  parsePath(path) {
    if (typeof path === 'string') {
      if (path.charAt(0).toLowerCase() === 'm') {
        const domPath = document.createElementNS(this.NS, 'path')
        domPath.setAttributeNS(null, 'd', path)
        return domPath
      } else {
        return document.querySelector(path)
      }
    }
    if (path.style) {
      return path
    }
  }

  // ---

  // Returns uniq id
  //
  // @method parsePath
  // @return {SVGPath}
  closeEnough(num1, num2, eps) {
    return Math.abs(num1 - num2) < eps
  }

  // ---

  // Method to check if 3d transform are supported
  checkIf3d() {
    const div = document.createElement('div')
    this.style(div, 'transform', 'translateZ(0)')
    const {
      style,
    } = div
    const prefixed = `${this.prefix.css}transform`
    const tr = (style[prefixed] != null) ? style[prefixed] : style.transform
    return tr !== ''
  }

  /*
    Method to check if variable holds pointer to an object.
    @param {Any} Variable to test
    @returns {boolean} If variable is object.
  */
  isObject(variable) {
    return (variable !== null) && (typeof variable === 'object')
  }

  /*
    Method to get first value of the object.
    Used to get end value on ∆s.
    @param {object} Object to get the value of.
    @returns {Any} The value of the first object' property.
  */
  getDeltaEnd(obj) {
    const key = Object.keys(obj)[0]
    return obj[key]
  }

  /*
    Method to get first key of the object.
    Used to get start value on ∆s.
    @param {object} Object to get the value of.
    @returns {string} The key of the first object' property.
  */
  getDeltaStart(obj) {
    return Object.keys(obj)[0]
  }

  /*
    Method to check if propery exists in callbacksMap or tweenOptionMap.
    @param {string} Property name to check for
    @returns {boolean} If property is tween property.
  */
  isTweenProp(keyName) {
    return this.tweenOptionMap[keyName] || this.callbacksMap[keyName]
  }

  /*
    Method to parse string property value
    which can include both `rand` and `stagger `
    value in various positions.
    @param {string} Property name to check for.
    @param {number} Optional index for stagger.
    @returns {number} Parsed option value.
  */
  parseStringOption(value, index) {
    if (index == null) {
      index = 0
    }
    if (typeof value === 'string') {
      value = this.parseIfStagger(value, index)
      value = this.parseIfRand(value)
    }
    return value
  }

  /**
    Method to get the last item of array.
    @private
    @param {Array} arr to get the last item in.
    @returns {any} The last item of array.
  */
  getLastItem<T = any>(arr): T {
    return arr[arr.length - 1]
  }

  /**
   * Method parse HTMLElement.
   * @private
   * @param {String, Object} el Selector string or HTMLElement.
   * @returns {object} HTMLElement.
   */
  parseEl(el) {
    if (h.isDOM(el)) {
      return el
    } else if (typeof el === 'string') {
      el = document.querySelector(el)
    }

    if (el === null) {
      h.error('Can\'t parse HTML element: ', el)
    }
    return el
  }

  /*
    Method force compositor layer on HTMLElement.
    @private
    @param {object} HTMLElement.
    @returns {object} HTMLElement.
  */
  force3d(el) {
    this.setPrefixedStyle(el, 'backface-visibility', 'hidden')
    return el
  }

  /*
    Method to check if value is delta.
    @private
    @param {Any} Property to check.
    @returns {boolean} If value is delta.
  */
  isDelta(optionsValue) {
    let isObject = this.isObject(optionsValue)
    isObject = isObject && !optionsValue.unit
    return !(!isObject || Array.isArray(optionsValue) || this.isDOM(optionsValue))
  }
}

export const h = new Helpers
export default h

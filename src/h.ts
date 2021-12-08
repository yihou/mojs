// Utils methods and map objects

import cloneWith from 'lodash.clonewith'
import get from 'lodash.get'

import mojs from './mojs'
import {
  Callbacks,
  Color,
  DeltaType,
  PossibleUnit,
  PossiblyNullOrUndefined,
  Prefix,
  TweenOptions,
  Unit,
  UnitOptions
} from './types'

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

  // Shortcut map for the 16 standard web colors
  // used to coerce literal name to rgb
  //
  // @property   shortColors
  // @type       {object}
  // REMOVE WHEN ALL MODULES WILL USE DELTAS CLASS
  static shortColors = {
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
    orange: 'rgb(255,128,0)'
  }
  // ---
  // none-tweenable props
  chainOptionMap = {} // callbacksContext: 1
  callbacksMap: Callbacks = {
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
    onPlaybackComplete: 1
  }
  tweenOptionMap: TweenOptions = {
    duration: 1,
    delay: 1,
    speed: 1,
    repeat: 1,
    easing: 1,
    backwardEasing: 1,
    isYoyo: 1,
    shiftTime: 1,
    isReversed: 1,
    callbacksContext: 1
  }
  unitOptionMap: UnitOptions = {
    left: 1,
    top: 1,
    x: 1,
    y: 1,
    rx: 1,
    ry: 1
  }

  // strokeDashPropsMap:
  //   strokeDasharray:  1
  //   # strokeDashoffset: 1
  RAD_TO_DEG = 180 / Math.PI
  // DEG_TO_RAD: Math.PI/180

  prefix = Helpers.getPrefix()
  isFF = false
  isIE = false
  isOldOpera = false
  isSafari = false
  isChrome = false
  isOpera = false
  is3d = false
  uniqIDs = 0
  div = document.createElement('div')
  defaultStyles
  remBase?: number

  constructor() {
    this.vars()

    document.body.appendChild(this.div)

    this.defaultStyles = this.computedStyle(this.div)
  }

  vars() {
    this.getRemBase()
    this.isFF = this.prefix.lowercase === 'moz'
    this.isIE = this.prefix.lowercase === 'ms'
    const ua = navigator.userAgent
    this.isOldOpera = !!ua.match(/presto/gim)
    this.isSafari = ua.indexOf('Safari') > -1
    this.isChrome = ua.indexOf('Chrome') > -1
    this.isOpera = ua.toLowerCase().indexOf('op') > -1
    this.isChrome && this.isSafari && (this.isSafari = false)
    ua.match(/PhantomJS/gim) && (this.isSafari = false)
    this.isChrome && this.isOpera && (this.isChrome = false)
    this.is3d = this.checkIf3d()

    this.uniqIDs = -1
  }

  /**
   * Clones object by iterating through object properties
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
  cloneObj<T extends Record<string, any>>(obj: T, exclude?: Record<keyof T, any>) {
    const excludeKeys = Object.keys(exclude || {})

    return cloneWith<T, T | Partial<T> | undefined>(obj, (value: any, key: any) => {
      const shouldExclude = !excludeKeys.some((excludeKey) => excludeKey == key)
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
  extend(objTo: Record<any, any>, objFrom: Record<any, any>) {
    return {
      ...objFrom,
      ...objTo
    }
  }

  getRemBase() {
    const html = document.querySelector('html') as HTMLElement
    const style = getComputedStyle(html)
    this.remBase = parseFloat(style.fontSize)
  }

  clamp(value: number | any, min: number | any, max: number | any) {
    if (
      typeof value !== 'number' ||
      typeof min !== 'number' ||
      typeof max !== 'number'
    ) {
      return value
    }

    if (value < min) {
      return min
    } else if (value > max) {
      return max
    }

    return value
  }

  setPrefixedStyle(el: HTMLElement | SVGGeometryElement, name: string, value: string) {
    if (
      name === 'transform' &&
      el.style[`${this.prefix.css}${name}` as keyof CSSStyleDeclaration] === value
    ) {
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
  style(
    element: HTMLElement,
    style: string | Partial<CSSStyleDeclaration>,
    value: any
  ) {
    if (typeof style === 'object') {
      const keys = Object.keys(style)
      let len = keys.length

      while (len--) {
        const key = keys[len]
        const value = style[key as keyof CSSStyleDeclaration] as string

        this.setPrefixedStyle(element, key, value)
      }
    } else {
      this.setPrefixedStyle(element, style, value)
    }
  }

  prepareForLog(args: any[]) {
    args = Array.prototype.slice.apply(args)
    args.unshift('::')
    args.unshift(this.logBadgeCss)
    args.unshift('%cmo·js%c')
    return args
  }

  log(...args: any) {
    // if (mojs.isDebug === false) {
    //   return
    // }
    return console.log(...this.prepareForLog(args))
  }

  warn(...args: any) {
    // if (mojs.isDebug === false) {
    //   return
    // }
    return console.warn(...this.prepareForLog(args))
  }

  error(...args: any) {
    // if (mojs.isDebug === false) {
    //   return
    // }
    return console.error(...this.prepareForLog(args))
  }

  parseUnit(value: PossibleUnit): Unit {
    let returnVal: PossibleUnit = value
    if (typeof value === 'number') {
      returnVal = {
        unit: 'px',
        isStrict: false,
        value,
        string: value === 0 ? `${value}` : `${value}px`
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
        string: amount === 0 ? `${amount}` : `${amount}${unit}`
      }
    }

    return returnVal as Unit
  }

  getRadialPoint(
    o: Partial<{
      radiusX: number
      radiusY: number
      radius: number
      rotate?: number
      center: { x: number; y: number }
    }> = {}
  ) {
    // return if !o.radius? or !o.rotate? or !o.center?
    const radAngle = ((o.rotate || 0) - 90) * 0.017453292519943295 // Math.PI/180
    const radiusX = o.radiusX || o.radius || 0
    const radiusY = o.radiusY || o.radius || 0
    const center = o.center || { x: 0, y: 0 }

    return {
      x: center.x + Math.cos(radAngle) * radiusX,
      y: center.y + Math.sin(radAngle) * radiusY
    }
  }

  static getPrefix(): Prefix {
    const styles: CSSStyleDeclaration = window.getComputedStyle(document.documentElement, '')
    const v = Array.prototype.slice
      .call(styles)
      .join('')
      .match(/-(moz|webkit|ms)-/) as string[]
    let pre = v[1] as Prefix['lowercase']

    if (!v && (styles as any)['OLink']) {
      pre = 'o'
    }

    const domMatch = 'WebKit|Moz|MS|O'.match(new RegExp('(' + pre + ')', 'i'))
    return {
      dom: domMatch ? domMatch[1] : undefined,
      lowercase: pre,
      css: `-${pre}-`,
      js: pre[0].toUpperCase() + pre.substring(1)
    }
  }

  strToArr(string: string | number): PossibleUnit[] {
    const arr: PossibleUnit[] = []
    // plain number
    if (typeof string === 'number' && !isNaN(string)) {
      arr.push(this.parseUnit(string))
      return arr
    }
    // string array
    (string as string)
      .trim()
      .split(/\s+/gim)
      .forEach((str) => {
        return arr.push(this.parseUnit(this.parseIfRand(str)))
      })
    return arr
  }

  calcArrDelta(arr1: PossibleUnit[], arr2: PossibleUnit[]): PossibleUnit[] {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
      throw new Error('Two arrays should be passed')
    }

    const delta: PossibleUnit[] = []
    for (let i = 0; i < arr1.length; i++) {
      const arr1Item = arr1[i] as Unit
      const arr2Item = arr2[i] as Unit
      delta[i] = this.parseUnit(
        `${(arr2Item?.value as number) - (arr1Item?.value as number)}${arr2Item.unit}`
      )
    }
    return delta
  }

  normDashArrays(arr1: PossibleUnit[], arr2: PossibleUnit[]): [PossibleUnit[], PossibleUnit[]] {
    // if !arr1? or !arr2? then throw Error 'Two arrays should be passed'
    let currItem, i, lenDiff, startI
    const arr1Len = arr1.length
    const arr2Len = arr2.length
    if (arr1Len > arr2Len) {
      let asc
      let end
      lenDiff = arr1Len - arr2Len
      startI = arr2.length
      for (
        i = 0, end = lenDiff, asc = 0 <= end;
        asc ? i < end : i > end;
        asc ? i++ : i--
      ) {
        currItem = i + startI
        arr2.push(this.parseUnit(`0${(arr1[currItem] as Unit).unit}`))
      }
    } else if (arr2Len > arr1Len) {
      let asc1, end1
      lenDiff = arr2Len - arr1Len
      startI = arr1.length
      for (
        i = 0, end1 = lenDiff, asc1 = 0 <= end1;
        asc1 ? i < end1 : i > end1;
        asc1 ? i++ : i--
      ) {
        currItem = i + startI
        arr1.push(this.parseUnit(`0${(arr2[currItem] as Unit).unit}`))
      }
    }
    return [arr1, arr2]
  }

  makeColorObj(color: string): Partial<Color> {
    // HEX
    let b
    let colorObj: Partial<Color> = {}
    let g
    let r
    let result
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
          a: 1
        }
      }
    }

    // not HEX
    // shorthand color and rgb()
    if (color[0] !== '#') {
      let rgbColor
      const isRgb = color[0] === 'r' && color[1] === 'g' && color[2] === 'b'
      // rgb color
      if (isRgb) {
        rgbColor = color
      }
      // shorthand color name
      if (!isRgb) {
        rgbColor = (() => {
          if (!Helpers.shortColors[color as keyof typeof Helpers.shortColors]) {
            this.div.style.color = color
            return this.computedStyle(this.div).color
          } else {
            return Helpers.shortColors[color as keyof typeof Helpers.shortColors]
          }
        })()
      }

      const regexString1 = '^rgba?\\((\\d{1,3}),\\s?(\\d{1,3}),'
      const regexString2 = '\\s?(\\d{1,3}),?\\s?(\\d{1}|0?\\.\\d{1,})?\\)$'
      result = new RegExp(regexString1 + regexString2, 'gi').exec(rgbColor as string) as RegExpExecArray
      colorObj = {}
      const alpha = result[4] ? parseFloat(result[4]) : 1
      if (result) {
        colorObj = {
          r: parseInt(result[1], 10),
          g: parseInt(result[2], 10),
          b: parseInt(result[3], 10),
          a: alpha != null && !isNaN(alpha) ? alpha : 1
        }
      }
    }

    return colorObj
  }

  computedStyle(el: Element) {
    return getComputedStyle(el)
  }

  capitalize(str: unknown) {
    if (typeof str !== 'string') {
      throw Error('String expected - nothing to capitalize')
    }
    return str.charAt(0).toUpperCase() + str.substring(1)
  }

  parseRand(string: string) {
    const randArr = string.split(/rand\(|,|\)/)
    const units = this.parseUnit(randArr[2]) as any
    const rand = this.rand(parseFloat(randArr[1]), parseFloat(randArr[2]))

    if (typeof units === 'string' || typeof units === 'number') {
      return rand
    }

    // if it's unit
    if (units && (units as Unit).unit && randArr[2].match((units as Unit).unit)) {
      return rand + (units as Unit).unit
    }

    return rand
  }

  parseStagger(string: string, index: number) {
    let base
    let value: PossibleUnit = string.split(/stagger\(|\)$/)[1].toLowerCase()
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
    if ((base as Unit).isStrict) {
      unit = (base as Unit).unit
    } else {
      // noinspection SuspiciousTypeOfGuard
      if (
        unitValue &&
        typeof unitValue !== 'number' &&
        typeof unitValue !== 'string'
      ) {
        unit = (unitValue as Unit).isStrict ? (unitValue as Unit).unit : ''
      }
    }

    let number = 0
    // add units only if option had a unit before
    if (typeof unitValue === 'object') {
      if (typeof get(unitValue, 'value') === 'number') {
        const baseValue = (base as Unit).value as number
        const value = unitValue.value as number
        number = index * value + baseValue
      } else if (typeof unitValue.value === 'string') {
        const baseValue = (base as Unit).value as number
        number = index * parseFloat(unitValue.value) + baseValue
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
  parseIfStagger(value: PossibleUnit, i: number) {
    if (!(typeof value === 'string' && value.match(/stagger/g))) {
      return value
    } else {
      return this.parseStagger(value, i)
    }
  }

  // if passed string has rand function then get the rand value
  parseIfRand(str: PossibleUnit): PossibleUnit {
    if (typeof str === 'string' && str.match(/rand\(/)) {
      return this.parseRand(str)
    } else {
      return str
    }
  }

  // if delta object was passed: like { 20: 75 }
  parseDelta(key: string, value: any, index: number) {
    // clone the delta object before proceed
    value = this.cloneObj(value)
    // parse delta easing
    let { easing } = value
    if (easing != null) {
      easing = mojs.easing.parseEasing(easing)
    }
    delete value.easing
    // parse delta curve
    let { curve } = value
    if (curve != null) {
      curve = mojs.easing.parseEasing(curve)
    }
    delete value.curve

    let start: PossibleUnit = Object.keys(value)[0]
    let end = value[start]
    let delta: DeltaType = { start } as any
    // color values
    if (
      isNaN(parseFloat(start)) &&
      !start.match(/rand\(/) &&
      !start.match(/stagger\(/)
    ) {
      if (key === 'strokeLinecap') {
        this.warn(
          `Sorry, stroke-linecap property is not animatable yet, using the start(${start}) value instead`,
          value
        )
        // @props[key] = start;
        return delta
      }
      const startColorObj = this.makeColorObj(start)
      const endColorObj = this.makeColorObj(end)
      if (
        typeof startColorObj.r !== 'number' ||
        typeof startColorObj.g !== 'number' ||
        typeof startColorObj.b !== 'number' ||
        typeof startColorObj.a !== 'number'
      ) {
        throw new Error(`"start" color is not a valid color`)
      }
         if (
        typeof endColorObj.r !== 'number' ||
        typeof endColorObj.g !== 'number' ||
        typeof endColorObj.b !== 'number' ||
        typeof endColorObj.a !== 'number'
      ) {
        throw new Error(`"end" color is not a valid color`)
      }


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
          a: endColorObj.a - startColorObj.a
        }
      }
      // color strokeDasharray/strokeDashoffset
    } else if (
      key === 'strokeDasharray' ||
      key === 'strokeDashoffset' ||
      key === 'origin'
    ) {
      const startArr = this.strToArr(start)
      const endArr = this.strToArr(end)
      this.normDashArrays(startArr, endArr)

      for (let i = 0; i < startArr.length; i++) {
        start = startArr[i] as PossibleUnit
        end = endArr[i]
        this.mergeUnits(start as Unit, end, key)
      }

      delta = {
        type: 'array',
        name: key,
        start: startArr,
        end: endArr,
        delta: this.calcArrDelta(startArr, endArr),
        easing,
        curve
      }
      //# plain numeric value ##
    } else {
      //# filter tween-related properties
      // defined in helpers.chainOptionMap
      // because tween-related props shouldn't
      //# have deltas
      if (!this.callbacksMap[key as keyof Callbacks] && !this.tweenOptionMap[key as keyof TweenOptions]) {
        // position values defined in unitOptionMap
        if (this.unitOptionMap[key as keyof UnitOptions]) {
          end = this.parseUnit(this.parseStringOption(end, index))
          start = this.parseUnit(this.parseStringOption(start, index)) as Unit
          this.mergeUnits(start, end, key)
          delta = {
            type: 'unit',
            name: key,
            start,
            end,
            delta: end.value - (start.value as number),
            easing,
            curve
          }
        } else {
          // not position but numeric values
          end = parseFloat(this.parseStringOption(end, index) as string)
          start = parseFloat(this.parseStringOption(start, index) as string)
          delta = {
            type: 'number',
            name: key,
            start,
            end,
            delta: end - start,
            easing,
            curve
          }
        }
      }
    }
    return delta
  }

  mergeUnits(start: Unit, end: Unit, key: string) {
    if (typeof start !== 'object') {
      throw new Error(`"start" is not a unit`)
    }

    if (typeof end !== 'object') {
      throw new Error(`"end" is not a unit`)
    }

    if (!end.isStrict && start.isStrict) {
      end.unit = start.unit
      return (end.string = `${end.value}${end.unit}`)
    } else if (end.isStrict && !start.isStrict) {
      start.unit = end.unit
      return (start.string = `${start.value}${start.unit}`)
    } else if (end.isStrict && start.isStrict) {
      if (end.unit !== start.unit) {
        start.unit = end.unit
        start.string = `${start.value}${start.unit}`
        return this
          .warn(`Two different units were specified on "${key}" delta property, mo · js will fallback to end "${end.unit}" unit `)
      }
    }
  }

  rand(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  isDOM(o: unknown) {
    if (o == null) {
      return false
    }
    // if typeof Node is 'function' then o instanceof Node
    const isNode = typeof o === 'object' && typeof get(o, 'nodeType') === 'number' && typeof get(o, 'nodeName') === 'string'
    return typeof o === 'object' && isNode
  }

  getChildElements(element: HTMLElement) {
    const { childNodes } = element
    const children: ChildNode[] = []
    let i = childNodes.length
    while (i--) {
      if (childNodes[i].nodeType === 1) {
        children.unshift(childNodes[i])
      }
    }
    return children
  }

  delta(start: PossibleUnit, end: PossibleUnit) {
    const isType1 = typeof start === 'string' || (typeof start === 'number' && !isNaN(start))
    const isType2 = typeof end === 'string' || (typeof end === 'number' && !isNaN(end))
    if (!isType1 || !isType2) {
      this.error(`delta method expects Strings or Numbers at input but got - ${start}, ${end}`)
      return undefined
    }
    const obj: Record<string, string | number> = {}
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
  parsePath(path: string | SVGPathElement): PossiblyNullOrUndefined<SVGGeometryElement> {
    if (typeof path === 'string') {
      if (path.charAt(0).toLowerCase() === 'm') {
        const domPath = document.createElementNS(this.NS, 'path') as SVGPathElement
        domPath.setAttributeNS(null, 'd', path)
        return domPath
      } else {
        return document.querySelector<SVGPathElement>(path)
      }
    }
    if (path.style) {
      return path
    }

    return undefined
  }

  // ---

  // Returns uniq id
  //
  // @method parsePath
  // @return {SVGPath}
  closeEnough(num1: number, num2: number, eps: number) {
    return Math.abs(num1 - num2) < eps
  }

  // ---

  // Method to check if 3d transform are supported
  checkIf3d() {
    const div = document.createElement('div')
    this.style(div, 'transform', 'translateZ(0)')
    const { style } = div
    const prefixed = `${this.prefix.css}transform` as keyof CSSStyleDeclaration
    const tr = style[prefixed] != null ? style[prefixed] : style.transform
    return tr !== ''
  }

  /*
    Method to check if a variable holds pointer to an object.
    @param {Any} Variable to test
    @returns {boolean} If variable is object.
  */
  isObject(variable: unknown) {
    return variable !== null && typeof variable === 'object'
  }

  /*
    Method to get first value of the object.
    Used to get end value on ∆s.
    @param {object} Object to get the value of.
    @returns {Any} The value of the first object' property.
  */
  getDeltaEnd(obj: any) {
    const key = Object.keys(obj)[0]
    return obj[key]
  }

  /*
    Method to get first key of the object.
    Used to get start value on ∆s.
    @param {object} Object to get the value of.
    @returns {string} The key of the first object' property.
  */
  getDeltaStart(obj: any) {
    return Object.keys(obj)[0]
  }

  /*
    Method to check if property exists in callbacksMap or tweenOptionMap.
    @param {string} Property name to check for
    @returns {boolean} If property is tween property.
  */
  isTweenProp(keyName: string) {
    return this.tweenOptionMap[keyName as keyof TweenOptions] || this.callbacksMap[keyName as keyof Callbacks]
  }

  /**
    * Method to parse string property value
    * which can include both `rand` and `stagger `
    * value in various positions.
    * @param {string} value Property name to check for.
    * @param {number} index Optional index for stagger.
    * @returns {number} Parsed option value.
  */
  parseStringOption(value: PossibleUnit, index = 0): PossibleUnit {
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
  getLastItem<T = any>(arr: T[]): T {
    return arr[arr.length - 1]
  }

  /**
   * Method parse HTMLElement.
   * @private
   * @param {String, Object} el Selector string or HTMLElement.
   * @returns {object} HTMLElement.
   */
  parseEl(el: string | HTMLElement) {
    let returnEl
    if (h.isDOM(el)) {
      return el
    } else if (typeof el === 'string') {
      returnEl = document.querySelector(el)
    }

    if (returnEl === null) {
      h.error("Can't parse HTML element: ", el)
    }
    return returnEl
  }

  /*
    Method force compositor layer on HTMLElement.
    @private
    @param {object} HTMLElement.
    @returns {object} HTMLElement.
  */
  force3d(el: HTMLElement) {
    this.setPrefixedStyle(el, 'backface-visibility', 'hidden')
    return el
  }

  /*
    Method to check if value is delta.
    @private
    @param {Any} Property to check.
    @returns {boolean} If value is delta.
  */
  isDelta(optionsValue: unknown) {
    let isObject = this.isObject(optionsValue)
    isObject = isObject && !(optionsValue as Record<any, any>).unit
    return !(
      !isObject ||
      Array.isArray(optionsValue) ||
      this.isDOM(optionsValue)
    )
  }
}

export const h = new Helpers()
export default h

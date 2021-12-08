import get from 'lodash.get'

import h from './h'
import {
  ArrayDelta,
  ColorDelta,
  DeltaType,
  ModuleBaseObj,
  NumberDelta,
  PossibleUnit,
  PropertyMap,
  SkipPropsDelta,
  Unit,
  UnitDelta,
  UnitOptions
} from './types'

/*
  Base class for module. Extends and parses defaults.
*/
export class Module<T, D = T> {
  _o: Partial<T & Partial<ModuleBaseObj>>
  _index = 0

  // map of props that should be
  // parsed to array of values
  _arrayPropertyMap: PropertyMap = {
    strokeDashoffset: 1,
    strokeDasharray: 1,
    origin: 1
  }
  _skipPropsDelta: SkipPropsDelta = {
    timeline: 1,
    prevChainModule: 1,
    callbacksContext: 1
  }
  _defaults: Partial<T & ModuleBaseObj & D> = {}
  _progress: any = 0
  _strokeDasharrayBuffer = []
  _props: any
  _isShown = false
  _deltas: Record<string, DeltaType> = {}

  el?: SVGGeometryElement = undefined

  constructor(o: Partial<T> = {}) {
    // this._isIt = o.isIt;
    // delete o.isIt;
    this._o = o
    this._index = this._o.index || 0

    this._declareDefaults()
    this._extendDefaults()

    this._vars()
    this._render()
  }

  /**
   * Method to declare defaults.
   * @private
   */
  _declareDefaults() {}

  /**
   * Method to declare module's variables.
   * @private
   */
  _vars() {
    this._progress = 0
    this._strokeDasharrayBuffer = []
  }

  /**
   * Method to render on initialization.
   * @private
   */
  _render() {
  }

  /**
   * Method to set property on the module.
   * @private
   * @param {string, object} attr Name of the property to set
   * or object with properties to set.
   * @param {any} value Value for the property to set.
   * Could be undefined if the first param is object.
   */
  _setProp(attr: string | Record<any, any>, value: any) {
    if (typeof attr === 'object') {
      for (const key in attr) {
        this._assignProp(key, attr[key])
      }
    } else {
      this._assignProp(attr, value)
    }
  }

  /**
   * Method to assign single property's value.
   * @private
   * @param {string} key Property name.
   * @param {any}    value Property value.
   */
  _assignProp(key: string, value: any) {
    this._props[key] = value
  }

  /**
   Method to show element.
   @private
   */
  _show() {
    const p = this._props
    if (!this.el) {
      return
    }

    if (p.isSoftHide) {
      // this.el.style.opacity = p.opacity;
      this._showByTransform()
    } else {
      this.el.style.display = 'block'
    }

    this._isShown = true
  }

  /**
   Method to hide element.
   @private
   */
  _hide() {
    if (!this.el) {
      return
    }

    if (this._props.isSoftHide) {
      // this.el.style.opacity = 0;
      h.setPrefixedStyle(this.el, 'transform', 'scale(0)')
    } else {
      this.el.style.display = 'none'
    }

    this._isShown = false
  }

  /**
   Method to show element by applying transform back to normal.
   @private
   */
  _showByTransform() {
  }

  /**
   Method to parse option string.
   Searches for stagger and rand values and parses them.
   Leaves the value unattended otherwise.
   @param {any} value Option value to parse.
   @returns {number} Parsed options value.
   */
  _parseOptionString(value: any) {
    if (typeof value === 'string') {
      if (value.match(/stagger/)) {
        value = h.parseStagger(value, this._index)
      }
    }
    if (typeof value === 'string') {
      if (value.match(/rand/)) {
        value = h.parseRand(value)
      }
    }
    return value
  }

  /**
   * Method to parse position option.
   * @param {string} key Property name.
   * @param {any} value Property Value.
   * @returns {string} Parsed options value.
   */
  _parsePositionOption(key: keyof UnitOptions, value: any) {
    if (h.unitOptionMap[key]) {
      const unit = h.parseUnit(value)

      if (typeof unit === 'object' && unit.string) {
        value = unit.string
      }
    }

    return value
  }

  /**
   * Method to parse strokeDash.. option.
   * @param {string} key Property name.
   * @param {any} value Property value.
   * @returns {string} Parsed options value.
   */
  _parseStrokeDashOption(key: keyof PropertyMap, value: any) {
    let result = value

    // parse numeric/percent values for strokeDash.. properties
    if (this._arrayPropertyMap[key]) {
      result = []
      let strArray: string[]

      switch (typeof value) {
        case 'number':
          result.push(h.parseUnit(value))
          break
        case 'string':
          strArray = value.split(' ')
          for (let i = 0; i < strArray.length; i++) {
            result.push(h.parseUnit(strArray[i]))
          }
          break
      }
    }
    return result
  }

  /**
   Method to check if the property is delta property.
   @private
   @param {any} optionsValue Parameter value to check.
   @returns {boolean}
   */
  _isDelta(optionsValue: PossibleUnit) {
    let isObject = h.isObject(optionsValue)
    isObject = isObject && !(optionsValue as Unit).unit
    return !(!isObject || Array.isArray(optionsValue) || h.isDOM(optionsValue))
  }

  /**
   Method to get delta from property and set
   the property's start value to the props object.
   @private
   @param {string} key Key name to get delta for.
   @param {object} optionsValue Option value to get the delta for.
   */
  _getDelta(key: string, optionsValue: PossibleUnit) {
    if ((key === 'left' || key === 'top') && !this._o.ctx) {
      h.warn(
        `Consider to animate x/y properties instead of left/top,
        as it would be much more performant`,
        optionsValue
      )
    }

    // skip delta calculation for a property if it is listed
    // in skipPropsDelta object
    if (this._skipPropsDelta && this._skipPropsDelta[key as keyof SkipPropsDelta]) {
      return
    }

    // get delta
    const delta = h.parseDelta(key, optionsValue, this._index)

    // if successfully parsed - save it
    if (delta.type != null) {
      this._deltas[key] = delta
    }

    let deltaEnd
    if (typeof delta.end === 'object') {
      const endUnit: Unit = delta.end as Unit
      if (endUnit.value === 0) {
        deltaEnd = 0
      } else {
        deltaEnd = endUnit.string
      }
    } else {
      deltaEnd = delta.end
    }

    // set props to end value of the delta
    // 0 should be 0 regardless units
    this._props[key] = deltaEnd
  }

  /**
   Method to copy `_o` options to `_props` object
   with fallback to `_defaults`.
   @private
   */
  _extendDefaults() {
    this._props = {}
    this._deltas = {}
    for (const key in this._defaults) {
      // skip property if it is listed in _skipProps
      // if (this._skipProps && this._skipProps[key]) { continue; }
      // copy the properties to the _o object
      const value = this._o[key as keyof T] ?? this._defaults[key as keyof T]

      // parse option
      this._parseOption(key, value)
    }
  }

  /**
   * Method to tune new options to _o and _props object.
   * @private
   * @param {object} o Options object to tune to.
   */
  _tuneNewOptions(o: Partial<T>): void | undefined | number {
    // hide the module before tuning its options
    // cuz the user could see the change
    this._hide()
    for (const key in o) {
      // skip property if it is listed in _skipProps
      // if (this._skipProps && this._skipProps[key]) { continue; }
      // copy the properties to the _o object
      // delete the key from deltas
      o && delete this._deltas[key]

      // rewrite _o record
      this._o[key] = o[key]

      // save the options to _props
      this._parseOption(key, o[key])
    }
  }

  /**
   * Method to parse option value.
   * @private
   * @param {string} name Option name.
   * @param {any} value Option value.
   */
  _parseOption(name: string, value: any) {
    // if delta property
    if (this._isDelta(value) && !this._skipPropsDelta[name as keyof SkipPropsDelta]) {
      this._getDelta(name, value)
      const deltaEnd = h.getDeltaEnd(value)
      return this._assignProp(name, this._parseProperty(name as keyof UnitOptions, deltaEnd))
    }

    this._assignProp(name, this._parseProperty(name as keyof UnitOptions, value))
  }

  /**
   * Method to parse position and string props.
   * @private
   * @param {string} name Property name.
   * @param {any}    value Property value.
   * @returns {any}  Parsed property value.
   */
  _parsePreArrayProperty(name: keyof UnitOptions, value: any): string {
    // parse stagger and rand values
    value = this._parseOptionString(value)

    // parse units for position properties
    return this._parsePositionOption(name, value)
  }

  /**
   * Method to parse property value.
   * @private
   * @param {string} name Property name.
   * @param {any}    value Property value.
   * @returns {any}  Parsed property value.
   */
  _parseProperty(name: keyof UnitOptions | 'parent', value: any) {
    // parse `HTML` element in `parent` option
    if (name === 'parent') {
      return h.parseEl(value)
    }

    // parse `stagger`, `rand` and `position`
    value = this._parsePreArrayProperty(name, value)

    // parse numeric/percent values for strokeDash.. properties
    return this._parseStrokeDashOption(name as keyof PropertyMap, value)
  }

  /**
   * Method to parse values inside ∆.
   * TODO: revisit to define proper types
   * @private
   * @param {string} name Key name.
   * @param {object} delta Delta.
   * @returns {object} Delta with parsed parameters.
   */
  _parseDeltaValues(name: keyof UnitOptions, delta: DeltaType) {
    // return h.parseDelta( name, delta, this._index );

    const d: Record<string, any> = {}
    for (const key in delta) {
      const value = delta[key as keyof DeltaType]

      // delete delta[key];
      // add parsed properties
      d[this._parsePreArrayProperty(name, key)] = this._parsePreArrayProperty(
        name,
        value
      )
    }
    return d
  }

  /**
   * Method to parse delta and non-delta properties.
   * @private
   * @param {string} key Property name.
   * @param {any} value Property value.
   * @returns {any} Parsed property value.
   */
  _preparsePropValue(key: keyof UnitOptions, value: any) {
    return this._isDelta(value)
      ? this._parseDeltaValues(key, value)
      : this._parsePreArrayProperty(key, value)
  }

  /**
   * Method to calculate current progress of the deltas.
   * @private
   * @param {number} easedProgress Eased progress to calculate - [0..1].
   * @param {number} progress Progress to calculate - [0..1].
   */
  _calcCurrentProps(easedProgress: number, progress: number) {
    for (const key in this._deltas) {
      const value = this._deltas[key]

      // get eased progress from delta easing if defined and not curve
      const isCurve = !!value.curve
      const ep =
        value.easing != null && !isCurve ? (value.easing as any)(progress) : easedProgress

      if (value.type === 'array') {
        let arr

        // if prop property is array - reuse it else - create an array
        if (Array.isArray(this._props[key])) {
          arr = this._props[key]
          arr.length = 0
        } else {
          arr = []
        }

        // just optimization to prevent curve
        // calculations on every array item
        const proc = isCurve ? value.curve(progress) : null
        const arrayDelta = value.delta as ArrayDelta['delta']

        for (let i = 0; i < arrayDelta.length; i++) {
          const item = arrayDelta[i]
          let dash: number
          if (!isCurve) {
            dash = get((value.start as any[])[i], 'value') + ep * (item as any).value
          } else {
            dash = proc * ((value.start as any[])[i].value + progress * (item as any).value)
          }
          arr.push({
            string: `${dash}${(item as Unit).unit}`,
            value: dash,
            unit: (item as Unit).unit
          })
        }

        this._props[key] = arr
      } else if (value.type === 'number') {
        const numberDelta = value as NumberDelta
        if (!isCurve) {
          this._props[key] = numberDelta.start + ep * numberDelta.delta
        } else {
          this._props[key] = value.curve(progress) * (numberDelta.start + progress * numberDelta.delta)
        }
      } else if (value.type === 'unit') {
        const unitDelta = value as UnitDelta
        let currentValue: any
        if (!isCurve) {
          currentValue = ((unitDelta.start as Unit).value as number) + ep * (value.delta as number)
        } else {
          currentValue = value.curve(progress) * (((value.start as Unit).value as number) + progress * (value.delta as number))
        }

        this._props[key] = `${currentValue}${(value.end as Unit).unit}`
      } else if (value.type === 'color') {
        let r, g, b, a
        const colorDelta = value as ColorDelta

        if (
          typeof colorDelta.start.r !== 'number' ||
          typeof colorDelta.start.g !== 'number' ||
          typeof colorDelta.start.b !== 'number' ||
          typeof colorDelta.start.a !== 'number'
        ) {
          throw new Error(`"colorDelta.start" color is not a valid color`)
        }

        if (!isCurve) {
          r = parseInt((colorDelta.start.r + ep * colorDelta.delta.r) as any, 10)
          g = parseInt((colorDelta.start.g + ep * colorDelta.delta.g) as any, 10)
          b = parseInt((colorDelta.start.b + ep * colorDelta.delta.b) as any, 10)
          a = parseFloat((colorDelta.start.a + ep * colorDelta.delta.a) as any)
        } else {
          const cp = value.curve(progress)
          const colorDelta = value as ColorDelta

          if (
            typeof colorDelta.start.r !== 'number' ||
            typeof colorDelta.start.g !== 'number' ||
            typeof colorDelta.start.b !== 'number' ||
            typeof colorDelta.start.a !== 'number'
          ) {
            throw new Error(`"colorDelta.start" color is not a valid color`)
          }

          r = parseInt(
            (cp * (colorDelta.start.r + progress * colorDelta.delta.r)) as any,
            10
          )
          g = parseInt(
            (cp * (colorDelta.start.g + progress * colorDelta.delta.g)) as any,
            10
          )
          b = parseInt(
            (cp * (colorDelta.start.b + progress * colorDelta.delta.b)) as any,
            10
          )
          a = parseFloat(
            (cp * (colorDelta.start.a + progress * colorDelta.delta.a)) as any
          )
        }
        this._props[key] = `rgba(${r},${g},${b},${a})`
      }
    }
  }

  /**
   * Method to calculate current progress and probably draw it in children.
   * @private
   * @param {number} easedProgress Eased progress to set - [0..1].
   * @param {number} progress Progress to set - [0..1].
   * @param _isYoyo
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _setProgress(easedProgress: number, progress: number, _isYoyo?: boolean) {
    this._progress = easedProgress
    this._calcCurrentProps(easedProgress, progress)
  }
}

export default Module

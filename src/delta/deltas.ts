/**
  This module's target is to parse options object,
  find deltas in it and send them to `Delta` classes.
  The `Delta` class is dull - they expect actual parsed deltas
  and separated tween options, so we should parse them here.
  The timeline of the module controls the `Delta` modules' tweens.

  @param {object} props Object to set deltas result to (pass to the Delta classes).
  @param {object} options Object to parse the deltas from.
  @param {Function} onUpdate onUpdate callback.
  @param optional {object} arrayPropertyMap List of properties with truthy
                                            values which describe properties
                                            that should be parsed as arrays.
  @param optional {object} numberPropertyMap List of properties with truthy
                                            values which describe properties
                                            that should be parsed as numbers
                                            without units.
*/

// TODO:
// - colors with curves change alpha level too
// const html = new mojs.Html({
//   el: '#js-el',
//   x: { 0: 100 },
//   onUpdate () {
//     console.log(this._props.originX);
//   },
//   originX: { 'white': 'black', curve: 'M0,100 L100, 0' },
//   customProperties: {
//     originX: {
//       type: 'color',
//       default: 'cyan'
//     },
//     draw() { console.log('draw'); }
//   }
// });

import easing from '../easing/easing';
import h from '../h';
import Timeline from '../tween/timeline';
import Tween from '../tween/tween';
import {Color, Unit} from '../types'

import Delta from './delta';

// get tween properties
const obj: any = {};
Tween.prototype._declareDefaults.call(obj);
const keys = Object.keys(obj._defaults);
for (let i = 0; i < keys.length; i++) {
  obj._defaults[keys[i]] = 1;
}
obj._defaults['timeline'] = 1;
const TWEEN_PROPERTIES = obj._defaults;

class Deltas {
  _o
  _deltas: Delta[] = []
  _mainDeltas = []
  _mainTweenOptions = undefined
  _childDeltas: Delta[] = []

  _shortColors = {
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
  };

  _ignoreDeltasMap = {
    prevChainModule: 1,
    masterModule: 1
  };

  timeline

  constructor(o: any = {}) {
    this._o = o;

    this._parseDeltas(o.options);
    this._createDeltas();
    this._createTimeline(this._mainTweenOptions);
  }

  /*
    Method to call `refresh` on all child `delta` objects.
    @public
    @param {boolean} If before start time (true) or after end time (false).
  */
  refresh(isBefore) {
    for (let i = 0; i < this._deltas.length; i++) {
      this._deltas[i].refresh(isBefore);
    }
    return this;
  }

  /*
    Method to call `restore` on all child `delta` objects.
    @public
  */
  restore() {
    for (let i = 0; i < this._deltas.length; i++) {
      this._deltas[i].restore();
    }
    return this;
  }

  /**
   * Method to create Timeline.
   * @private
   * @param {object} obj Timeline options.
   */
  _createTimeline(obj) {

    // const o = this._o;
    // opts.timeline = opts.timeline || {};
    // opts.timeline.callbackOverrides = {
    //   onUpdate:   o.onUpdate,
    //   onRefresh:  o.onUpdate
    // }
    // send callbacksContext to timeline if set
    // o.callbacksContext && (opts.timeline.callbacksContext = o.callbacksContext);
    // opts.timeline
    this.timeline = new Timeline;
    this.timeline.add(this._deltas);
  }

  /*
    Method to create Deltas from parsed options.
    @private
  */
  _createDeltas() {
    this._deltas = [];

    // create main delta object
    this._deltas.push(
      this._createDelta(this._mainDeltas, this._mainTweenOptions),
    );

    // create child delta object
    for (let i = 0; i < this._childDeltas.length; i++) {
      const delta = this._childDeltas[i];
      this._deltas.push(
        this._createDelta([delta.delta], delta.tweenOptions),
      );
    }
  }

  /*
    Method to create Delta object with passed options.
    @private
    @param {Array} Array of deltas.
    @param {object} Tween properties.
    @returns {object} Delta object
  */
  _createDelta(deltas, tweenOptions) {
    const o = this._o;
    return new Delta({
      deltas,
      tweenOptions,
      props: o.props,
      isChained: o.isChained,
      callbacksContext: o.callbacksContext,
    });
  }

  /*
    Method to parse delta objects from options.
    @private
    @param {object} Options object to parse the deltas from.
  */
  _parseDeltas(obj) {

    // spilt main animation properties and main tween properties
    const mainSplit = this._splitTweenOptions(obj);

    // main animation properties
    const opts = mainSplit.delta;

    // main tween properties
    this._mainTweenOptions = mainSplit.tweenOptions;

    this._mainDeltas = [];
    this._childDeltas = [];
    const keys = Object.keys(opts);

    // loop thru all properties without tween ones
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      // is property is delta - parse it
      if (this._isDelta(opts[key]) && !this._ignoreDeltasMap[key]) {
        const delta = this._splitAndParseDelta(key, opts[key]);

        // if parsed object has no tween values - it's delta of the main object
        if (!delta.tweenOptions) { this._mainDeltas.push(delta.delta); }

        // otherwise it is distinct delta object
        else { this._childDeltas.push(delta); }
      }
    }
  }

  /*
    Method to split tween values and parse single delta record.
    @private
    @param {string} Property name.
    @param {object} Raw delta object.
    @returns {object} Split object.
                @param {object} tweenOptions Tween properties.
                @param {object} delta Parsed delta.
  */
  _splitAndParseDelta(name, object) {
    const split = this._splitTweenOptions(object);

    // parse delta in the object
    split.delta = this._parseDelta(name, split.delta);
    return split;
  }

  /*
    Method to parse delta by delegating the variables to _parse*Delta methods.
    @private
    @param {string} Property name.
    @param {object} Raw delta object.
    @param {number} Module index.
  */
  _parseDelta(name, object, index?) {

    // if name is in _o.customProps - parse it regarding the type
    return (this._o.customProps && (this._o.customProps[name] != null))
      ? this._parseDeltaByCustom(name, object, index)
      : this._parseDeltaByGuess(name, object, index);
  }

  /**
    Method to parse delta by taking the type from the customProps object.
    @private
    @param {string} name Property name.
    @param {object} object Raw delta object.
    @param {number} index Module index.
  */
  _parseDeltaByCustom(name, object, index) {
    return this._parsenumberDelta(name, object, index);

    // const customRecord = this._o.customProps[name];
    // switch ( customRecord.type.toLowerCase() ) {
    //   case 'color':  { return this._parseColorDelta( name, object ); }
    //   case 'array':  { return this._parseArrayDelta( name, object ); }
    //   case 'number': { return this._parsenumberDelta( name, object, index ); }
    //   case 'unit':   { return this._parseUnitDelta( name, object, index ); }
    // }
  }

  /**
    Method to parse delta by reasoning about it's value.
    @private
    @param {string} name Property name.
    @param {object} object Raw delta object.
    @param {number} index Module index.
  */
  _parseDeltaByGuess(name, object, index) {
    const { start } = this._preparseDelta(object);
    const o = this._o;

    // color values
    if (isNaN(parseFloat(start)) && !start.match(/rand\(/) && !start.match(/stagger\(/)) {
      return this._parseColorDelta(name, object);

    // array values
    } else if (o.arrayPropertyMap && o.arrayPropertyMap[name]) {
      return this._parseArrayDelta(name, object);

    // unit or number values
    } else {
      if (o.numberPropertyMap && o.numberPropertyMap[name]) {
        return this._parsenumberDelta(name, object, index);
      } else {
        return this._parseUnitDelta(name, object, index);
      }
    }
  }

  /*
    Method to separate tween options from delta properties.
    @param {object} Object for separation.
    @returns {object} Object that contains 2 objects
                        - one delta options
                        - one tween options ( could be empty if no tween opts )
  */
  _splitTweenOptions(delta) {
    delta = { ...delta };

    const keys = Object.keys(delta)
    const tweenOptions = {}
    let isTween = false

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (TWEEN_PROPERTIES[key]) {
        if (delta[key] != null) {
          tweenOptions[key] = delta[key];
          isTween = true;
        }
        delete delta[key];
      }
    }
    return {
      delta,
      tweenOptions: (isTween) ? tweenOptions : undefined,
    };
  }

  /*
    Method to check if the property is delta property.
    @private
    @param {any} Parameter value to check.
    @returns {boolean}
  */
  _isDelta(optionsValue) {
    let isObject = h.isObject(optionsValue);
    isObject = isObject && !optionsValue.unit;
    return !(!isObject || Array.isArray(optionsValue) || h.isDOM(optionsValue));
  }

  /*
    Method to parse color delta values.
    @private
    @param {string} Name of the property.
    @param {any} Property value.
    @returns {object} Parsed delta.
  */
  _parseColorDelta(key, value) {
    if (key === 'strokeLinecap') {
      h.warn('Sorry, stroke-linecap property is not animatable yet, using the start(#{start}) value instead', value);
      return {};
    }
    const preParse = this._preparseDelta(value);

    const startColorObj = this._makeColorObj(preParse.start) as Color
    const endColorObj = this._makeColorObj(preParse.end) as Color

    const delta = {
      type: 'color',
      name: key,
      start: startColorObj,
      end: endColorObj,
      curve: preParse.curve,
      delta: {
        r: endColorObj.r - startColorObj.r,
        g: endColorObj.g - startColorObj.g,
        b: endColorObj.b - startColorObj.b,
        a: endColorObj.a - startColorObj.a,
      } as Color,
    };
    return delta;
  }

  /*
    Method to parse array delta values.
    @private
    @param {string} Name of the property.
    @param {any} Property value.
    @returns {object} Parsed delta.
  */
  _parseArrayDelta(key, value) {
    const preParse = this._preparseDelta(value);

    const startArr = this._strToArr(preParse.start),
      endArr = this._strToArr(preParse.end);

    h.normDashArrays(startArr, endArr);

    for (let i = 0; i < startArr.length; i++) {
      const end = endArr[i];
      h.mergeUnits(startArr[i], end, key);
    }

    const delta = {
      type: 'array',
      name: key,
      start: startArr,
      end: endArr,
      delta: h.calcArrDelta(startArr, endArr),
      curve: preParse.curve,
    };

    return delta;
  }

  /**
   * Method to parse numeric delta values with units.
   * @private
   * @param {string} key Name of the property.
   * @param {any} value Property value.
   * @param {number} index Index of the module.
   * @returns {object} Parsed delta.
   */
  _parseUnitDelta(key: string, value: Delta, index: number) {
    const preParse = this._preparseDelta(value);

    const end = h.parseUnit(h.parseStringOption(preParse.end, index)) as Unit
    const start = h.parseUnit(h.parseStringOption(preParse.start, index)) as Unit

    h.mergeUnits(start, end, key);

    const delta = {
      type: 'unit',
      name: key,
      start: start,
      end: end,
      delta: end.value - start.value,
      curve: preParse.curve,
    };
    return delta;
  }

  /**
   * Method to parse numeric delta values without units.
   * @private
   * @param {string} key Name of the property.
   * @param {any} value Property value.
   * @param {number} index Index of the module.
   * @returns {object} Parsed delta.
   */
  _parsenumberDelta(key, value, index) {
    const preParse = this._preparseDelta(value);

    const end = parseFloat(h.parseStringOption(preParse.end, index)),
      start = parseFloat(h.parseStringOption(preParse.start, index));

    return {
      type: 'number',
      name: key,
      start: start,
      end: end,
      delta: end - start,
      curve: preParse.curve,
    };
  }

  /*
    Method to extract `curve` and `start`/`end` values.
    @private
    @param {object} Delta object.
    @returns {object} Preparsed delta.
              @property {string} Start value.
              @property {string, number} End value.
  */
  _preparseDelta(value) {

    // clone value object
    value = { ...value };

    // parse curve if exist
    let curve = value.curve;
    if (curve != null) {
      curve = easing.parseEasing(curve);
      curve._parent = this;
    }
    delete value.curve;

    // parse start and end values
    const start = Object.keys(value)[0],
      end = value[start];

    return { start,
      end,
      curve };
  }

  /*
    Method to parse color into usable object.
    @private
    @param {string} Color string.
    @returns {object} Parsed color value.
  */
  _makeColorObj(color): Partial<Color> {

    // HEX
    let colorObj = {};
    if (color[0] === '#') {
      const result = /^#?([a-f\d]{1,2})([a-f\d]{1,2})([a-f\d]{1,2})$/i.exec(color);
      if (result) {
        const r = (result[1].length === 2) ? result[1] : result[1] + result[1],
          g = (result[2].length === 2) ? result[2] : result[2] + result[2],
          b = (result[3].length === 2) ? result[3] : result[3] + result[3];

        colorObj = {
          r: parseInt(r, 16),
          g: parseInt(g, 16),
          b: parseInt(b, 16),
          a: 1,
        };
      }
    }

    // not HEX
    // shorthand color and rgb()
    if (color[0] !== '#') {
      const isRgb = color[0] === 'r' && color[1] === 'g' && color[2] === 'b';
      let rgbColor;

      // rgb color
      if (isRgb) { rgbColor = color; }

      // shorthand color name
      if (!isRgb) {
        if (!this._shortColors[color]) {
          h.div.style.color = color;
          rgbColor = h.computedStyle(h.div).color;
        } else { rgbColor = this._shortColors[color]; }
      }

      const regexString1 = '^rgba?\\((\\d{1,3}),\\s?(\\d{1,3}),'
      const regexString2 = '\\s?(\\d{1,3}),?\\s?(\\d{1}|0?\\.\\d{1,})?\\)$'
      const result = new RegExp(regexString1 + regexString2, 'gi').exec(rgbColor)
      const alphaValue = result && result[4] ? result[4] : 1
      const alpha = parseFloat(`${alphaValue}`)

      if (result) {
        colorObj = {
          r: parseInt(result[1], 10),
          g: parseInt(result[2], 10),
          b: parseInt(result[3], 10),
          a: ((alpha != null) && !isNaN(alpha)) ? alpha : 1,
        };
      }
    }

    return colorObj;
  }

  /*
    Method to parse string into array.
    @private
    @param {string, number} String or number to parse.
    @returns {Array} Parsed array.
  */
  _strToArr(string) {
    const arr: any[] = [];

    // plain number
    if (typeof string === 'number' && !isNaN(string)) {
      arr.push(h.parseUnit(string));
      return arr;
    }

    // string array
    string.trim().split(/\s+/gim).forEach((str) => {
      arr.push(h.parseUnit(h.parseIfRand(str)));
    });
    return arr;
  }

}

export default Deltas;

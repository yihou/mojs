import Tween from '../tween/tween'
import {Unit} from '../types'

interface DeltaParam {
  tweenOptions: any
  isChained: boolean
  deltas: any[]
  props: any
  callbacksContext: any
}

class Delta {
  _o: Partial<DeltaParam> = {}
  _previousValues: Partial<DeltaParam> | any[] = {}
  tween: any

  constructor(o: Partial<DeltaParam> = {}) {
    this._o = o
    this._createTween(o ? o.tweenOptions : undefined)

    // initial properties render
    !this._o.isChained && this.refresh(true)
  }

  /*
    Method to call `_refresh` method on `tween`.
    Use switch between `0` and `1` progress for delta value.
    @public
    @param {boolean} If refresh before start time or after.
    @returns this.
  */
  refresh(isBefore: boolean) {
    this._previousValues = []

    const deltas = this._o.deltas || []
    for (let i = 0; i < deltas.length; i++) {
      const name = deltas[i].name
      this._previousValues.push({
        name,
        value: this._o.props[name]
      })
    }

    this.tween._refresh(isBefore)
    return this
  }

  /*
    Method to restore all saved properties from `_previousValues` array.
    @public
    @returns this.
  */
  restore() {
    const prev = (this._previousValues as any[]) || []
    for (let i = 0; i < prev.length; i++) {
      const record = prev[i]
      this._o.props[record.name] = record.value
    }
    return this
  }

  /**
   * Method to create tween of the delta.
   * @private
   * @param {object} o Options object.
   */
  _createTween(o: any = {}) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const it = this
    o.callbackOverrides = {
      onUpdate(ep: any, p: any) {
        it._calcCurrentProps(ep, p)
      }
    }

    // if not chained - add the onRefresh callback
    // to refresh the tween when needed
    if (!this._o.isChained) {
      o.callbackOverrides.onRefresh = function (
        _isBefore: any,
        ep: any,
        p: any
      ) {
        it._calcCurrentProps(ep, p)
      }
    }

    o.callbacksContext = this._o.callbacksContext
    this.tween = new Tween(o)
  }

  /*
    Method to calculate current progress of the deltas.
    @private
    @param {number} Eased progress to calculate - [0..1].
    @param {number} Progress to calculate - [0..1].
  */
  _calcCurrentProps(easedProgress: any, p: any) {
    const deltas = this._o.deltas || []
    for (let i = 0; i < deltas.length; i++) {
      const type = deltas[i].type
      this[`_calcCurrent_${type}`](deltas[i], easedProgress, p)
    }
  }

  /*
    Method to calc the current color delta value.
    @param {object} Delta
    @param {number} Eased progress [0..1].
    @param {number} Plain progress [0..1].
  */
  _calcCurrent_color(
    delta: {
      start: any
      delta: any
      curve: (arg0: any) => any
      name: string | number
    },
    ep: number,
    p: number
  ) {
    let r: any
    let g: any
    let b: any
    let a: any
    const start = delta.start
    const d = delta.delta
    if (!delta.curve) {
      r = parseInt(start.r + ep * d.r, 10)
      g = parseInt(start.g + ep * d.g, 10)
      b = parseInt(start.b + ep * d.b, 10)
      a = parseFloat(start.a + ep * d.a)
    } else {
      const cp = delta.curve(p)
      r = parseInt((cp * (start.r + p * d.r)) as any as string, 10)
      g = parseInt((cp * (start.g + p * d.g)) as any as string, 10)
      b = parseInt((cp * (start.b + p * d.b)) as any as string, 10)
      a = parseFloat((cp * (start.a + p * d.a)) as any as string)
    }
    this._o.props[delta.name] = `rgba(${r},${g},${b},${a})`
  }

  /*
    Method to calc the current number delta value.
    @param {object} Delta
    @param {number} Eased progress [0..1].
    @param {number} Plain progress [0..1].
  */
  _calcCurrent_number(
    delta: {
      name: string | number
      curve: (arg0: any) => number
      start: number
      delta: number
    },
    ep: number,
    p: number
  ) {
    this._o.props[delta.name] = !delta.curve
      ? delta.start + ep * delta.delta
      : delta.curve(p) * (delta.start + p * delta.delta)
  }

  /*
    Method to calc the current number with units delta value.
    @param {object} Delta
    @param {number} Eased progress [0..1].
    @param {number} Plain progress [0..1].
  */
  _calcCurrent_unit(
    delta: {
      curve: (arg0: any) => number
      start: { value: number }
      delta: number
      name: string | number
      end: { unit: any }
    },
    ep: number,
    p: number
  ) {
    let currentValue: number
    if (!delta.curve) {
      currentValue = delta.start.value + ep * delta.delta
    } else {
      currentValue = delta.curve(p) * (delta.start.value + p * delta.delta)
    }

    this._o.props[delta.name] = `${currentValue}${delta.end.unit}`
  }

  /*
    Method to calc the current array delta value.
    @param {object} Delta
    @param {number} Eased progress [0..1].
    @param {number} Plain progress [0..1].
  */
  _calcCurrent_array(
    delta: {
      name: any
      curve: (arg0: any) => any
      delta: { length?: any }
      start: Partial<Unit>
    },
    ep: number,
    p: number
  ) {
    // var arr,
    const name = delta.name
    const props = this._o.props
    let string = ''

    // to prevent GC bothering with arrays garbage
    // if ( Array.isArray( props[name] ) ) {
    //   arr = props[name];
    //   arr.length = 0;
    // } else { arr = []; }

    // just optimization to prevent curve
    // calculations on every array item
    const proc = delta.curve ? delta.curve(p) : null

    for (let i = 0; i < delta.delta.length; i++) {
      const item = delta.delta[i],
        dash = !delta.curve
          ? delta.start[i].value + ep * item.value
          : proc * (delta.start[i].value + p * item.value)

      string += `${dash}${item.unit} `

      // arr.push({
      //   string: `${dash}${item.unit}`,
      //   value:  dash,
      //   unit:   item.unit,
      // });
    }
    props[name] = string
  }
}

export default Delta

import Tween from '../tween/tween'
import {
  ArrayDelta,
  ColorDelta,
  DeltaWithoutTweenOpts,
  NumberDelta,
  Unit,
  UnitDelta
} from '../types'

interface DeltaParam {
  tweenOptions: any
  isChained: boolean
  deltas: DeltaWithoutTweenOpts[]
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
  _calcCurrentProps(easedProgress: number, progress: number) {
    const deltas = this._o.deltas || []
    for (let i = 0; i < deltas.length; i++) {
      const delta: DeltaWithoutTweenOpts = deltas[i]
      const type = delta.type
      const methodKey: keyof Delta = `_calcCurrent_${type}`
      this[methodKey](delta as any, easedProgress, progress)
    }
  }

  /*
    Method to calc the current color delta value.
    @param {object} Delta
    @param {number} Eased progress [0..1].
    @param {number} Plain progress [0..1].
  */
  _calcCurrent_color(
    delta: DeltaWithoutTweenOpts<ColorDelta>,
    easedProgress: number,
    progress: number
  ) {
    let r: any
    let g: any
    let b: any
    let a: any
    const start = delta.start
    const d = delta.delta

    if (
      typeof start.r !== 'number' ||
      typeof start.g !== 'number' ||
      typeof start.b !== 'number' ||
      typeof start.a !== 'number'
    ) {
      throw new Error(`"start" color is not a valid color`)
    }

    if (!delta.curve) {
      r = parseInt(start.r + easedProgress * d.r as any as string, 10)
      g = parseInt(start.g + easedProgress * d.g as any as string, 10)
      b = parseInt(start.b + easedProgress * d.b as any as string, 10)
      a = parseFloat(start.a + easedProgress * d.a as any as string)
    } else {
      const cp = delta.curve(progress)
      r = parseInt((cp * (start.r + progress * d.r)) as any as string, 10)
      g = parseInt((cp * (start.g + progress * d.g)) as any as string, 10)
      b = parseInt((cp * (start.b + progress * d.b)) as any as string, 10)
      a = parseFloat((cp * (start.a + progress * d.a)) as any as string)
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
    delta: DeltaWithoutTweenOpts<NumberDelta>,
    easedProgress: number,
    progress: number
  ) {
    this._o.props[delta.name] = !delta.curve
      ? delta.start + easedProgress * delta.delta
      : delta.curve(progress) * (delta.start + progress * delta.delta)
  }

  /*
    Method to calc the current number with units delta value.
    @param {object} Delta
    @param {number} Eased progress [0..1].
    @param {number} Plain progress [0..1].
  */
  _calcCurrent_unit(
    delta: DeltaWithoutTweenOpts<UnitDelta>,
    easedProgress: number,
    progress: number
  ) {
    let currentValue: number
    const startValue = (delta.start as Unit).value as number
    const endUnit = delta.end as Unit

    if (!delta.curve) {
      currentValue = startValue + easedProgress * delta.delta
    } else {
      currentValue = delta.curve(progress) * (startValue + progress * delta.delta)
    }

    this._o.props[delta.name] = `${currentValue}${endUnit.unit}`
  }

  /*
    Method to calc the current array delta value.
    @param {object} Delta
    @param {number} Eased progress [0..1].
    @param {number} Plain progress [0..1].
  */
  _calcCurrent_array(
    delta: DeltaWithoutTweenOpts<ArrayDelta>,
    easedProgress: number,
    progress: number
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
    const proc = delta.curve ? delta.curve(progress) : null

    for (let i = 0; i < delta.delta.length; i++) {
      const item = delta.delta[i] as Unit
      const startValue = (delta.start[i] as Unit).value as number

      let dash: number
      if (!delta.curve) {
        dash = startValue + easedProgress * (item?.value as number)
      } else {
        dash = proc * (startValue + progress * (item?.value as number))
      }

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

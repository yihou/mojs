import h from './h'
import Thenable from './thenable'
import Timeline from './tween/timeline'
import {UnitOptions} from './types'

class Tuneable<T> extends Thenable<T> {
  /*
    Method to start the animation with optional new options.
    @public
    @param {object} New options to set on the run.
    @returns {object} this.
  */
  tune(o: Partial<T>) {
    // if options object was passed
    if (o && Object.keys(o).length) {
      this._transformHistory(o)
      this._tuneNewOptions(o)

      // restore array prop values because _props
      // contain them as parsed arrays
      // but we need the as strings to store in history
      // and merge in history chains
      this._history[0] = h.cloneObj(this._props)
      for (const key in this._arrayPropertyMap) {
        if (o[key as keyof T] != null) {
          this._history[0][key] = this._preparsePropValue(key as keyof UnitOptions, o[key as keyof T])
        }
      }

      this._tuneSubModules()
      this._resetTweens()
    }
    return this
  }

  /*
    Method to regenerate all the random properties form initial object.
    @public
    @returns this.
  */
  generate() {
    return this.tune(this._o)
  }

  // ^ PUBLIC  METHOD(S) ^
  // v PRIVATE METHOD(S) v

  /*
    Method to preparse options in object.
    @private
    @param {object} Object to preparse properties on.
    @returns {object} Passed object with preparsed props.
  */
  // _preParseOptions ( o ) {
  //   for (var key in o) {
  //     o[key] = this._preparsePropValue( key, o[key] );
  //   }
  //   return o;
  // }
  /*
    Method to transform history rewrite new options object chain on run.
    @private
    @param {object} New options to tune for.
  */
  _transformHistory(o) {
    for (const key in o) {
      const value = o[key]

      // don't transform for childOptions
      // if ( key === 'childOptions' ) { continue; }
      this._transformHistoryFor(key, this._preparsePropValue(key, value))
    }
  }

  /*
    Method to transform history chain for specific key/value.
    @param {string} Name of the property to transform history for.
    @param {Any} The new property's value.
  */
  _transformHistoryFor(key, value) {
    for (let i = 0; i < this._history.length; i++) {
      value = this._transformHistoryRecord(i, key, value)

      // break if no further history modifications needed
      if (value == null) {
        break
      }
    }
  }

  /*
    Method to transform history record with key/value.
    @param {number} Index of the history record to transform.
    @param {string} Property name to transform.
    @param {Any} Property value to transform to.
    @param {object} Optional the current history record.
    @param {object} Optional the next history record.
    @returns {boolean} Returns true if no further
                       history modifications is needed.
  */
  _transformHistoryRecord(index, key, newVal, currRecord?, nextRecord?) {
    // newVal = this._parseProperty( key, newVal );
    if (newVal == null) {
      return null
    }

    // fallback to history records, if wasn't specified
    currRecord = currRecord == null ? this._history[index] : currRecord
    nextRecord = nextRecord == null ? this._history[index + 1] : nextRecord

    const oldVal = currRecord[key]
    const nextVal = nextRecord == null ? null : nextRecord[key]

    // if index is 0 - always save the newVal
    // and return non-delta for subsequent modifications
    if (index === 0) {
      currRecord[key] = newVal

      // always return on tween properties
      if (h.isTweenProp(key) && key !== 'duration') {
        return null
      }

      // non tween properties
      const isRewriteNext = this._isRewriteNext(oldVal, nextVal),
        returnVal = this._isDelta(newVal) ? h.getDeltaEnd(newVal) : newVal
      return isRewriteNext ? returnVal : null
    } else {
      // if was delta and came none-delta - rewrite
      // the start of the delta and stop
      if (this._isDelta(oldVal)) {
        currRecord[key] = { [newVal]: h.getDeltaEnd(oldVal) }
        return null
      } else {
        // if the old value is not delta and the new one is
        currRecord[key] = newVal

        // if the next item has the same value - return the
        // item for subsequent modifications or stop
        return this._isRewriteNext(oldVal, nextVal) ? newVal : null
      }
    }
  }

  /*
    Method to check if the next item should
    be rewrite in transform history operation.
    @private
    @param {Any} Current value.
    @param {Any} Next value.
    @returns {boolean} If need to rewrite the next value.
  */
  _isRewriteNext(currVal, nextVal) {
    // return false if nothing to rewrite next
    if (nextVal == null && currVal != null) {
      return false
    }

    const isEqual = currVal === nextVal
    const isNextDelta = this._isDelta(nextVal)
    const isDelta = this._isDelta(currVal)
    let isValueDeltaChain = false
    let isDeltaChain = false

    if (isDelta && isNextDelta) {
      if (h.getDeltaEnd(currVal) == h.getDeltaStart(nextVal)) {
        isDeltaChain = true
      }
    } else if (isNextDelta) {
      isValueDeltaChain = h.getDeltaStart(nextVal) === `${currVal}`
    }

    return isEqual || isValueDeltaChain || isDeltaChain
  }

  /*
    Method to tune new history options to all the submodules.
    @private
  */
  _tuneSubModules() {
    for (let i = 1; i < this._modules.length; i++) {
      this._modules[i]._tuneNewOptions(this._history[i])
    }
  }

  /*
    Method to set new options on run.
    @param {boolean} If foreign context.
    @private
  */
  _resetTweens() {
    let shift = 0
    const tweens = this.timeline._timelines

    // if `isTimelineLess` return
    if (tweens == null) {
      return
    }

    for (let i = 0; i < tweens.length; i++) {
      const tween = tweens[i]
      const prevTween = tweens[i - 1]

      shift += prevTween ? prevTween._props.repeatTime : 0
      this._resetTween(tween, this._history[i], shift)
    }
    this.timeline._setProp(this._props.timeline)

    if (
      typeof (this.timeline as Timeline)._recalcTotalDuration === 'function'
    ) {
      ;(this.timeline as Timeline)._recalcTotalDuration()
    }
  }

  /*
    Method to reset tween with new options.
    @param {object} Tween to reset.
    @param {object} Tween's to reset tween with.
    @param {number} Optional number to shift tween start time.
  */
  _resetTween(tween, o, shift = 0) {
    o.shiftTime = shift
    tween._setProp(o)
  }
}

export default Tuneable

import h from './h'
import Timeline from './tween/timeline'
import Tweenable from './tween/tweenable'

/*
  The Thenable class adds .then public method and
  the ability to chain API calls.
*/
class Thenable extends Tweenable {
  _masterModule?: Thenable = undefined
  _modules: Thenable[] = []
  _isChained = false
  _nonMergeProps: any

  _history: any[]

  constructor(o?) {
    super(o)

    this._vars()
  }

  /*
    Method to create a then record for the module.
    @public
    @param    {object} Options for the next animation.
    @returns  {object} this.
  */
  then(o) {
    // return if nothing was passed
    if (o == null || !Object.keys(o).length) {
      return 1
    }

    // merge then options with the current ones
    const prevRecord = this._history[this._history.length - 1]
    const merged = this._mergeThenOptions(prevRecord, o)

    this._resetMergedFlags(merged)

    // create a submodule of the same type as the master module
    const module = new Thenable(merged)

    // set `this` as master module of child module
    module._masterModule = this

    // save the modules to the _modules array
    this._modules.push(module)

    // add module's tween into master timeline
    if (this.timeline instanceof Timeline) {
      this.timeline.append(module)
    }

    return this
  }

  // ^ PUBLIC  METHOD(S) ^
  // v PRIVATE METHOD(S) v

  /*
    Method to reset some flags on merged options object.
    @private
    @param   {object} Options object.
    @returns {object} Options object.
  */
  _resetMergedFlags(obj) {
    // set the submodule to be without timeline for perf reasons
    obj.isTimelineLess = true

    // reset isShowStart flag for the submodules
    obj.isShowStart = false

    // reset isRefreshState flag for the submodules
    obj.isRefreshState = false

    // set the submodule callbacks context
    obj.callbacksContext = this._props.callbacksContext || this

    // set previous module
    obj.prevChainModule = h.getLastItem(this._modules)

    // pass the `this` as master module
    obj.masterModule = this
    return obj
  }

  /*
    Method to initialize properties.
    @private
  */
  _vars() {
    if (typeof super._vars === 'function') {
      super._vars()
    }

    // save _master module
    this._masterModule = this._o.masterModule

    // set isChained flag based on prevChainModule option
    this._isChained = !!this._masterModule

    // we are expect that the _o object
    // have been already extended by defaults
    const initialRecord = h.cloneObj(this._props)
    for (const key in this._arrayPropertyMap) {
      if (this._o[key]) {
        const preParsed = this._parsePreArrayProperty(key, this._o[key])
        initialRecord[key] = preParsed
      }
    }

    this._history = [initialRecord]

    // the array holds all modules in the then chain
    this._modules = [this]

    // the props that to exclude from then merge
    this._nonMergeProps = { shape: 1 }
  }

  /*
    Method to merge two options into one. Used in .then chains.
    @private
    @param {object} Start options for the merge.
    @param {object} End options for the merge.
    @returns {object} Merged options.
  */
  _mergeThenOptions(start, end) {
    const o = {}
    this._mergeStartLoop(o, start)
    this._mergeEndLoop(o, start, end)
    this._history.push(o)
    return o
  }

  /*
    Method to pipe startValue of the delta.
    @private
    @param {string} Start property name.
    @param {Any} Start property value.
    @returns {Any} Start property value.
  */
  _checkStartValue(_name, value) {
    return value
  }

  /*
    Originally part of the _mergeThenOptions.
    Loops thru start object and copies all the props from it.
    @param {object} An object to copy in.
    @parma {object} Start options object.
  */
  _mergeStartLoop(o, start) {
    // loop thru start options object
    for (const key in start) {
      const value = start[key]
      if (start[key] == null) {
        continue
      }

      // copy all values from start if not tween prop or duration
      if (!h.isTweenProp(key) || key === 'duration') {
        // if delta - copy only the end value
        if (this._isDelta(value)) {
          o[key] = h.getDeltaEnd(value)
        } else {
          o[key] = value
        }
      }
    }
  }

  /*
    Originally part of the _mergeThenOptions.
    Loops thru start object and merges all the props from it.
    @param {object} An object to copy in.
    @parma {object} Start options object.
    @parma {object} End options object.
  */
  _mergeEndLoop(o, start, end) {
    for (const key in end) {
      // just copy parent option
      if (key == 'parent') {
        o[key] = end[key]
        continue
      }

      // get key/value of the end object
      // endKey - name of the property, endValue - value of the property
      const endValue = end[key]
      let startValue = start[key] != null ? start[key] : this._defaults[key]

      startValue = this._checkStartValue(key, startValue)
      if (endValue == null) {
        continue
      }

      // make ∆ of start -> end
      // if key name is radiusX/radiusY and
      // the startValue is not set fallback to radius value
      let isSubRadius = key === 'radiusX' || key === 'radiusY'

      if (isSubRadius && startValue == null) {
        startValue = start.radius
      }

      isSubRadius = key === 'scaleX' || key === 'scaleY'
      if (isSubRadius && startValue == null) {
        startValue = start.scale
      }

      o[key] = this._mergeThenProperty(key, startValue, endValue)
    }
  }

  /*
    Method to merge `start` and `end` for a property in then record.
    @private
    @param {string} Property name.
    @param {Any}    Start value of the property.
    @param {Any}    End value of the property.
  */
  _mergeThenProperty(key, startValue, endValue) {
    // if isnt tween property
    const isBoolean = typeof endValue === 'boolean'
    let curve
    let easing

    if (!h.isTweenProp(key) && !this._nonMergeProps[key] && !isBoolean) {
      if (h.isObject(endValue) && endValue.to != null) {
        curve = endValue.curve
        easing = endValue.easing
        endValue = endValue.to
      }

      // if end value is delta - just save it
      if (this._isDelta(endValue)) {
        return this._parseDeltaValues(key, endValue)
      } else {
        const parsedEndValue = this._parsePreArrayProperty(key, endValue)

        // if end value is not delta - merge with start value
        if (this._isDelta(startValue)) {
          // if start value is delta - take the end value
          // as start value of the new delta
          return {
            [h.getDeltaEnd(startValue)]: parsedEndValue,
            easing,
            curve
          }

          // if both start and end value are not ∆ - make ∆
        } else {
          return { [startValue]: parsedEndValue, easing, curve }
        }
      }

      // copy the tween values unattended
    } else {
      return endValue
    }
  }

  /*
    Method to retreive array's length and return -1 for
    all other types.
    @private
    @param {Array, Any} Array to get the width for.
    @returns {number} Array length or -1 if not array.
  */
  _getArrayLength(arr) {
    return Array.isArray(arr) ? arr.length : -1
  }

  /*
    Method to check if the property is delta property.
    @private
    @param {Any} Parameter value to check.
    @returns {boolean}
  */
  _isDelta(optionsValue) {
    let isObject = h.isObject(optionsValue)
    isObject = isObject && !optionsValue.unit
    return !(!isObject || Array.isArray(optionsValue) || h.isDOM(optionsValue))
  }

  /*
    Method to check if the module is first in `then` chain.
    @private
    @returns {boolean} If the module is the first in module chain.
  */
  _isFirstInChain() {
    return !this._masterModule
  }

  /*
    Method to check if the module is last in `then` chain.
    @private
    @returns {boolean} If the module is the last in module chain.
  */
  _isLastInChain() {
    const master = this._masterModule

    // if there is no master field - check the modules length
    // if module length is 1 thus there is no modules chain
    // it is the last one, otherwise it isnt
    if (!master) {
      return this._modules.length === 1
    }

    // if there is master - check if it is the last item in _modules chain
    return this === h.getLastItem(master._modules)
  }
}

export default Thenable

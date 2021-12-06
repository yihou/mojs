import h from '../h';

import Tween from './tween';

class Timeline extends Tween {

  /*
    API method to add child tweens/timelines.
    @public
    @param {Object, Array} Tween/Timeline or an array of such.
    @returns {object} Self.
  */
  add(...args) {
    this._pushTimelineArray(args);
    this._calcDimensions();
    return this;
  }

  /*
    API method to append the Tween/Timeline to the end of the
    timeline. Each argument is treated as a new append.
    Array of tweens is treated as a parallel sequence.
    @public
    @param {Object, Array} Tween/Timeline to append or array of such.
    @returns {object} Self.
  */
  append(...timeline) {
    for (const tm of timeline) {
      if (Array.isArray(tm)) { this._appendTimelineArray(tm); }
      else { this._appendTimeline(tm, this._timelines.length); }
      this._calcDimensions();
    }
    return this;
  }

  /*
    API method to stop the Tween.
    @public
    @param   {number} Progress [0..1] to set when stopped.
    @returns {object} Self.
  */
  stop(progress) {
    super.stop(progress);
    this._stopChildren(progress);
    return this;
  }

  /*
    Method to reset tween's state and properties.
    @public
    @overrides @ Tween
    @returns this.
  */
  reset() {
    super.reset();
    this._resetChildren();
    return this;
  }

  /*
    Method to call `reset` method on all children.
    @private
  */
  _resetChildren() {
    for (let i = 0; i < this._timelines.length; i++) {
      this._timelines[i].reset();
    }
  }

  /*
    Method to call `stop` method on all children.
    @private
    @param   {number} Progress [0..1] to set when stopped.
  */
  _stopChildren(progress) {
    for (let i = this._timelines.length - 1; i >= 0; i--) {
      this._timelines[i].stop(progress);
    }
  }

  /*
    Method to set tween's state to complete.
    @private
    @overrides @ Tween
    @param {number} Current time.
    @param {boolean} Is yoyo period.
  */
  // _complete ( time, isYoyo ) {
  //   // this._updateChildren( 1, time, isYoyo );
  //   // this._setProgress( 1, time, isYoyo );
  //   super._complete( time, isYoyo );
  //   // this._resetChildren();
  // }

  // ^ PUBLIC  METHOD(S) ^
  // v PRIVATE METHOD(S) v

  /*
    Method to append Tween/Timeline array or mix of such.
    @private
    @param {Array} Array of Tweens/Timelines.
  */
  _appendTimelineArray(timelineArray) {
    let i = timelineArray.length,
      time = this._props.repeatTime - this._props.delay,
      len = this._timelines.length

    while (i--) { this._appendTimeline(timelineArray[i], len, time); }
  }

  /*
    Method to append a single timeline to the Timeline.
    @private
    @param {object} Tween/Timeline to append.
    @param {number} Index of the append.
    @param {number} Shift time.
  */
  _appendTimeline(timeline, index, time?) {

    // if timeline is a module with timeline property then extract it
    if (timeline.timeline instanceof Timeline) { timeline = timeline.timeline; }
    if (timeline.tween instanceof Tween) { timeline = timeline.tween; }

    let shift = (time != null) ? time : this._props.duration
    shift += timeline._props.shiftTime || 0;
    timeline.index = index; this._pushTimeline(timeline, shift);
  }

  /*
    PrivateMethod to push Tween/Timeline array.
    @private
    @param {Array} Array of Tweens/Timelines.
  */
  _pushTimelineArray(array) {
    for (let i = 0; i < array.length; i++) {
      const tm = array[i]

      // recursive push to handle arrays of arrays
      if (Array.isArray(tm)) {
        this._pushTimelineArray(tm);
      } else { this._pushTimeline(tm); }
    }
  }

  /*
    Method to push a single Tween/Timeline.
    @private
    @param {object} Tween or Timeline to push.
    @param {number} Number of milliseconds to shift the start time
                    of the Tween/Timeline.
  */
  _pushTimeline(timeline, shift?) {

    // if timeline is a module with timeline property then extract it
    if (timeline.timeline instanceof Timeline) { timeline = timeline.timeline; }
    if (timeline.tween instanceof Tween) { timeline = timeline.tween; }

    // add self delay to the timeline
    (shift != null) && timeline._setProp({ 'shiftTime': shift });
    this._timelines.push(timeline);
    this._recalcDuration(timeline);
  }

  /**
   * Method set progress on self and child Tweens/Timelines.
   * @private
   * @param {number} p Progress to set.
   * @param {number} time Current update time.
   * @param {boolean} isYoyo
   */
  _setProgress(p, time, isYoyo) {

    // we need to pass self previous time to children
    // to prevent initial _wasUnknownUpdate nested waterfall
    // if not yoyo option set, pass the previous time
    // otherwise, pass previous or next time regarding yoyo period.

    // COVER CURRENT SWAPPED ORDER
    this._updateChildren(p, time, isYoyo);

    Tween.prototype._setProgress.call(this, p, time);
  }

  _updateChildren(p, time, isYoyo) {
    let coef = (time > this._prevTime) ? -1 : 1
    if (this._props.isYoyo && isYoyo) { coef *= -1; }
    const timeToTimelines = this._props.startTime + p * (this._props.duration),
      prevTimeToTimelines = timeToTimelines + coef,
      len = this._timelines.length

    for (let i = 0; i < len; i++) {

      // specify the children's array update loop direction
      // if time > prevTime go from 0->length else from length->0
      // var j = ( time > this._prevTime ) ? i : (len-1) - i ;
      const j = (timeToTimelines > prevTimeToTimelines) ? i : (len - 1) - i
      this._timelines[j]._update(
        timeToTimelines,
        prevTimeToTimelines,
        this._prevYoyo,
        this._onEdge,
      );
    }
    this._prevYoyo = isYoyo;
  }

  /*
    Method calculate self duration based on timeline's duration.
    @private
    @param {object} Tween or Timeline to calculate.
  */
  _recalcDuration(timeline) {
    const p = timeline._props
    const timelineTime = p.repeatTime / p.speed + (p.shiftTime || 0) + timeline._negativeShift

    this._props.duration = Math.max(timelineTime, this._props.duration);
  }

  /*
    Method calculate self duration from scratch.
    @private
  */
  _recalcTotalDuration() {
    let i = this._timelines.length
    this._props.duration = 0;
    while (i--) {
      const tm = this._timelines[i]

      // recalc total duration on child timelines
      tm._recalcTotalDuration && tm._recalcTotalDuration();

      // add the timeline's duration to self duration
      this._recalcDuration(tm);
    }
    this._calcDimensions();
  }

  /**
   * Method set start and end times.
   * @private
   * @param {number, Null} time Time to start with.
   * @param {boolean} isReset
   */
  _setStartTime(time, isReset = true) {
    super._setStartTime(time);
    this._startTimelines(this._props.startTime, isReset);
  }

  /*
    Method calculate self duration based on timeline's duration.
    @private
    @param {number, Null} Time to start with.
  */
  _startTimelines(time, isReset = true) {
    const isStop = this._state === 'stop'

    if (time == null) {
      time = this._props.startTime
    }

    for (let i = 0; i < this._timelines.length; i++) {
      const tm = this._timelines[i]
      tm._setStartTime(time, isReset);

      // if from `_subPlay` and `_prevTime` is set and state is `stop`
      // prevTime normalizing is for play/pause functionality, so no
      // need to normalize if the timeline is in `stop` state.
      if (!isReset && tm._prevTime != null && !isStop) {
        tm._prevTime = tm._normPrevTimeForward();
      }
    }
  }

  /*
    Method to launch onRefresh callback.
    @method _refresh
    @private
    @overrides @ Tween
    @param {boolean} If refresh even before start time.
  */
  _refresh(isBefore) {
    const len = this._timelines.length;
    for (let i = 0; i < len; i++) {
      this._timelines[i]._refresh(isBefore);
    }
    super._refresh(isBefore);
  }

  /*
    Method do declare defaults by this._defaults object
    @private
  */
  _declareDefaults() {

    // if duration was passed on initialization stage, warn user and reset it.
    if (this._o.duration != null) {
      h.error(`Duration can not be declared on Timeline, but "${this._o.duration}" is. You probably want to use Tween instead.`);
      this._o.duration = 0;
    }
    super._declareDefaults();

    // remove default
    this._defaults.duration = 0;
    this._defaults.easing = 'Linear.None';
    this._defaults.backwardEasing = 'Linear.None';
    this._defaults.nameBase = 'Timeline';
  }

  constructor(o = {}) { super(o); }

  /*
    Method to declare some vars.
    @private
  */
  _vars() {
    this._timelines = [];
    super._vars();
  }
}

export default Timeline;

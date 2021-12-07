import Module from '../module'

import Timeline from './timeline'
import Tween from './tween'

/*
  Class to define a module ancestor
  with timeline and tween options and functionality.
  All runnable modules should inherit from this class.

  @class Tweenable
*/
class Tweenable extends Module {
  timeline: Timeline | Tween
  _isTimeline: boolean
  tween: Tween

  /*
    `play` method for the timeline.
    @public
    @param {number} Time shift.
    @returns this.
  */
  play(shift?) {
    this.timeline.play(shift)
    return this
  }

  /*
    `playBackward` method for the timeline.
    @public
    @param {number} Time shift.
    @returns this.
  */
  playBackward(shift?) {
    this.timeline.playBackward(shift)
    return this
  }

  /*
    `pause` method for the timeline.
    @public
    @returns this.
  */
  pause() {
    this.timeline.pause()
    return this
  }

  /*
    `stop` method for the timeline.
    @public
    @param {number} [0...1] Progress to set on stop.
                            *Default* is `0` if `play`
                            and `1` if `playBackward`.
    @returns this.
  */
  stop(progress) {
    this.timeline.stop(progress)
    return this
  }

  /*
    `reset` method for the timeline.
    @public
    @returns this.
  */
  reset() {
    this.timeline.reset()
    return this
  }

  /*
    `replay` method for the timeline.
    @public
    @returns this.
  */
  replay(shift?) {
    this.timeline.replay(shift)
    return this
  }

  /*
    `replay` method for the timeline.
    @public
    @returns this.
  */
  replayBackward(shift?) {
    this.timeline.replayBackward(shift)
    return this
  }

  /*
    `resume` method for the timeline.
    @public
    @param {number} Time shift.
    @returns this.
  */
  resume(shift?) {
    this.timeline.resume(shift)
    return this
  }

  /*
    `setProgress` method for the timeline.
    @public
    @param {number} [0...1] Progress value.
    @returns this.
  */
  setProgress(progress: number) {
    this.timeline.setProgress(progress)
    return this
  }

  /*
    setSpeed method for the timeline.
    @param {number} Speed value.
    @returns this.
  */
  setSpeed(speed) {
    this.timeline.setSpeed(speed)
    return this
  }

  // ^ PUBLIC  METHOD(S) ^
  // v PRIVATE METHOD(S) v

  constructor(o = {}) {
    // super of Module
    super(o)

    // pipe function for _o object
    // before creating tween/timeline
    this._transformTweenOptions()

    // make tween only if isTweenLess option is not set
    !this._o.isTweenLess && this._makeTween()

    // make timeline only if isTimelineLess option is not set
    !this._o.isTimelineLess && this._makeTimeline()
  }

  /*
    Placeholder method that should be overridden
    and will be called before tween/timeline creation.
    @private
  */
  _transformTweenOptions() {}

  /*
    Method to create tween.
    @private
  */
  _makeTween() {
    // pass callbacks context
    this._o.callbacksContext = this._o.callbacksContext || this
    this.tween = new Tween(this._o)

    // make timeline property point to tween one is "no timeline" mode
    this._o.isTimelineLess && (this.timeline = this.tween)
  }

  /*
    Method to create timeline.
    @private
    @param {object} Timeline's options.
                    An object which contains "timeline" property with
                    timeline options.
  */
  _makeTimeline() {
    // pass callbacks context
    this._o.timeline = this._o.timeline || {}
    this._o.timeline.callbacksContext = this._o.callbacksContext || this
    this.timeline = new Timeline(this._o.timeline)

    // set the flag to indicate that real timeline is present
    this._isTimeline = true

    // if tween exist - add it to the timeline there is some
    // modules like burst and stagger that have no tween
    if (this.tween && this.timeline) {
      ;(this.timeline as Timeline).add(this.tween)
    }
  }
}

export default Tweenable

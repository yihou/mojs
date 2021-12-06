import easing from '../easing/easing'
import Module from '../module'

import tweener from './tweener'

interface TweenDefaults {
  duration: number
  delay: number
  repeat: number
  speed: number
  isYoyo: boolean
  easing: string
  backwardEasing: any | null
  name: null | string
  nameBase: string
  onProgress: (() => void) | null
  onStart: (() => void) | null
  onRefresh: (() => void) | null
  onComplete: (() => void) | null
  onRepeatStart: (() => void) | null
  onRepeatComplete: (() => void) | null
  onFirstUpdate: (() => void) | null
  onUpdate: (() => void) | null
  isChained: boolean
  onPlaybackStart: (() => void) | null
  onPlaybackPause: (() => void) | null
  onPlaybackStop: (() => void) | null
  onPlaybackComplete: (() => void) | null
  callbacksContext: any | null
}

class Tween extends Module {
  /*
    Method do declare defaults with this._defaults object.
    @private
  */
  _declareDefaults() {
    // DEFAULTS
    this._defaults = {
      /* duration of the tween [0..∞] */
      duration: 350,

      /* delay of the tween [-∞..∞] */
      delay: 0,

      /* repeat of the tween [0..∞], means how much to
         repeat the tween regardless first run,
         for instance repeat 2 will make the tween run 3 times */
      repeat: 0,

      /* speed of playback [0..∞], speed that is less then 1
         will slowdown playback, for instance .5 will make tween
         run 2x slower. Speed of 2 will speedup the tween to 2x. */
      speed: 1,

      /*  flip onUpdate's progress on each even period.
          note that callbacks order won't flip at least
          for now (under consideration). */
      isYoyo: false,

      /* easing for the tween, could be any easing type [link to easing-types.md] */
      easing: 'Sin.Out',

      /*
        Easing for backward direction of the tween the tween,
        if `null` - fallbacks to `easing` property.
        forward direction in `yoyo` period is treated as backward for the easing.
      */
      backwardEasing: null,

      /* custom tween's name */
      name: null,

      /* custom tween's base name */
      nameBase: 'Tween',

      /*
        onProgress callback runs before any other callback.
        @param {number}   The entire, not eased, progress
                          of the tween regarding repeat option.
        @param {boolean}  The direction of the tween.
                          `true` for forward direction.
                          `false` for backward direction(tween runs in reverse).
      */
      onProgress: null,

      /*
        onStart callback runs on very start of the tween just after onProgress
        one. Runs on very end of the tween if tween is reversed.
        @param {boolean}  Direction of the tween.
                          `true` for forward direction.
                          `false` for backward direction(tween runs in reverse).
      */
      onStart: null,
      onRefresh: null,
      onComplete: null,
      onRepeatStart: null,
      onRepeatComplete: null,
      onFirstUpdate: null,
      onUpdate: null,
      isChained: false,

      // playback callbacks
      onPlaybackStart: null,
      onPlaybackPause: null,
      onPlaybackStop: null,
      onPlaybackComplete: null,

      // context which all callbacks will be called with
      callbacksContext: null
    } as TweenDefaults
  }

  _state: 'pause' | 'play' | 'reverse' | 'stop' | undefined
  _isRunning = false
  _wasUknownUpdate: any | undefined
  _playTime: any | undefined
  _prevState: any | undefined
  _prevTime: any | undefined
  _progressTime: any | undefined
  _isCompleted: any | undefined
  _isStarted: any | undefined
  _isFirstUpdate: any | undefined
  _prevYoyo: any | undefined
  _resumeTime: any | undefined
  _negativeShift: any | undefined
  _timelines: any | undefined
  _callbackOverrides: any | undefined
  _isRepeatCompleted: any | undefined
  _isInActiveArea: any | undefined
  _isRefreshed: any | undefined
  _isRepeatStart: any | undefined
  _delayT: any | undefined
  _onEdge: any | undefined

  progress: any
  easedProgress: any

  /*
    API method to play the Tween.
    @public
    @param  {number} Shift time in milliseconds.
    @return {object} Self.
  */
  play(shift = 0) {
    if (this._state === 'play' && this._isRunning) {
      return this
    }
    this._props.isReversed = false
    this._subPlay(shift, 'play')
    this._setPlaybackState('play')
    return this
  }

  /*
    API method to play the Tween in reverse.
    @public
    @param  {number} Shift time in milliseconds.
    @return {object} Self.
  */
  playBackward(shift = 0) {
    if (this._state === 'reverse' && this._isRunning) {
      return this
    }
    this._props.isReversed = true
    this._subPlay(shift, 'reverse')
    this._setPlaybackState('reverse')
    return this
  }

  /*
    API method to pause Tween.
    @public
    @returns {object} Self.
  */
  pause() {
    if (this._state === 'pause' || this._state === 'stop') {
      return this
    }
    this._removeFromTweener()
    this._setPlaybackState('pause')
    return this
  }

  /**
    API method to stop the Tween.
    @public
    @param   {number} progress Progress [0..1] to set when stopped.
    @returns {object} Self.
  */
  stop(progress: number) {
    if (this._state === 'stop') {
      return this
    }

    this._wasUknownUpdate = undefined

    const stopProc =
      progress != null
        ? progress
        : /* if no progress passed - set 1 if tween
         is playingBackward, otherwise set to 0 */
        this._state === 'reverse'
        ? 1
        : 0

    this.setProgress(stopProc)

    this.reset()
    return this
  }

  /*
    API method to replay(restart) the Tween.
    @public
    @param   {number} Shift time in milliseconds.
    @returns {object} Self.
  */
  replay(shift = 0) {
    this.reset()
    this.play(shift)
    return this
  }

  /*
    API method to replay(restart) backward the Tween.
    @public
    @param   {number} Shift time in milliseconds.
    @returns {object} Self.
  */
  replayBackward(shift = 0) {
    this.reset()
    this.playBackward(shift)
    return this
  }

  /*
    API method to resume the Tween.
    @public
    @param  {number} Shift time in milliseconds.
    @return {object} Self.
  */
  resume(shift = 0) {
    if (this._state !== 'pause') {
      return this
    }

    switch (this._prevState) {
      case 'play':
        this.play(shift)
        break
      case 'reverse':
        this.playBackward(shift)
        break
    }

    return this
  }

  /*
    API method to set progress on tween.
    @public
    @param {number} Progress to set.
    @returns {object} Self.
  */
  setProgress(progress) {
    const p = this._props

    // set start time if there is no one yet.
    !p.startTime && this._setStartTime()

    // reset play time
    this._playTime = null

    // progress should be in range of [0..1]
    progress < 0 && (progress = 0)
    progress > 1 && (progress = 1)

    // update self with calculated time
    this._update(p.startTime - p.delay + progress * p.repeatTime)
    return this
  }

  /*
    Method to set tween's speed.
    @public
    @param {number} Speed value.
    @returns this.
  */
  setSpeed(speed) {
    this._props.speed = speed

    // if playing - normalize _startTime and _prevTime to the current point.
    if (this._state === 'play' || this._state === 'reverse') {
      this._setResumeTime(this._state)
    }
    return this
  }

  /*
    Method to reset tween's state and properties.
    @public
    @returns this.
  */
  reset() {
    this._removeFromTweener()
    this._setPlaybackState('stop')
    this._progressTime = 0
    this._isCompleted = false
    this._isStarted = false
    this._isFirstUpdate = false
    this._wasUknownUpdate = undefined
    this._prevTime = undefined
    this._prevYoyo = undefined

    // this._props.startTime  = undefined;
    this._props.isReversed = false
    return this
  }

  // ^ PUBLIC  METHOD(S) ^
  // v PRIVATE METHOD(S) v

  /*
    Method to launch play. Used as launch
    method for both play and reverse methods.
    @private
    @param  {number} Shift time in milliseconds.
    @param  {string} Play or reverse state.
    @return {object} Self.
  */
  _subPlay(shift = 0, state) {
    const p = this._props,
      // check if direction of playback changes,
      // if so, the _progressTime needs to be flipped
      _state = this._state,
      _prevState = this._prevState,
      isPause = _state === 'pause',
      wasPlay = _state === 'play' || (isPause && _prevState === 'play'),
      wasReverse =
        _state === 'reverse' || (isPause && _prevState === 'reverse'),
      isFlip =
        (wasPlay && state === 'reverse') || (wasReverse && state === 'play')

    // if tween was ended, set progress to 0 if not, set to elapsed progress
    this._progressTime =
      this._progressTime >= p.repeatTime ? 0 : this._progressTime

    // flip the _progressTime if playback direction changed
    if (isFlip) {
      this._progressTime = p.repeatTime - this._progressTime
    }

    // set resume time and normalize prev/start times
    this._setResumeTime(state, shift)

    // add self to tweener = play
    tweener.add(this)
    return this
  }

  /*
    Method to set _resumeTime, _startTime and _prevTime.
    @private
    @param {string} Current state. [play, reverse]
    @param {number} Time shift. *Default* is 0.
  */
  _setResumeTime(state, shift = 0) {
    // get current moment as resume time
    this._resumeTime = performance.now()

    // set start time regarding passed `shift` and `procTime`
    const startTime = this._resumeTime - Math.abs(shift) - this._progressTime
    this._setStartTime(startTime, false)

    // if we have prevTime - we need to normalize
    // it for the current resume time
    if (this._prevTime != null) {
      this._prevTime =
        state === 'play'
          ? this._normPrevTimeForward()
          : this._props.endTime - this._progressTime
    }
  }

  /*
    Method recalculate _prevTime for forward direction.
    @private
    @return {number} Normalized prev time.
  */
  _normPrevTimeForward() {
    const p = this._props
    return p.startTime + this._progressTime - p.delay
  }

  /*
    Constructor of the class.
    @private
  */
  constructor(o = {}) {
    super(o)
    this._props.name == null && this._setSelfName()
    return this
  }

  /*
    Method to set self name to generic one.
    @private
  */
  _setSelfName() {
    const globalName = `_${this._props.nameBase}s`

    // track amount of tweens globally
    tweener[globalName] =
      tweener[globalName] == null ? 1 : ++tweener[globalName]

    // and set generic tween's name  || Tween # ||
    this._props.name = `${this._props.nameBase} ${tweener[globalName]}`
  }

  /*
    Method set playback state string.
    @private
    @param {string} State name
  */
  _setPlaybackState(state) {
    // save previous state
    this._prevState = this._state
    this._state = state

    // callbacks
    const wasPause = this._prevState === 'pause',
      wasStop = this._prevState === 'stop',
      wasPlay = this._prevState === 'play',
      wasReverse = this._prevState === 'reverse',
      wasPlaying = wasPlay || wasReverse,
      wasStill = wasStop || wasPause

    if ((state === 'play' || state === 'reverse') && wasStill) {
      this._playbackStart()
    }
    if (state === 'pause' && wasPlaying) {
      this._playbackPause()
    }
    if (state === 'stop' && (wasPlaying || wasPause)) {
      this._playbackStop()
    }
  }

  /*
    Method to declare some vars.
    @private
  */
  _vars() {
    this.progress = 0
    this._prevTime = undefined
    this._progressTime = 0
    this._negativeShift = 0
    this._state = 'stop'

    // if negative delay was specified,
    // save it to _negativeShift property and
    // reset it back to 0
    if (this._props.delay < 0) {
      this._negativeShift = this._props.delay
      this._props.delay = 0
    }

    return this._calcDimensions()
  }

  /*
    Method to calculate tween's dimensions.
    @private
  */
  _calcDimensions() {
    this._props.time = this._props.duration + this._props.delay
    this._props.repeatTime = this._props.time * (this._props.repeat + 1)
  }

  /*
    Method to extend defaults by options and put them in _props.
    @private
  */
  _extendDefaults() {
    // save callback overrides object with fallback to empty one
    this._callbackOverrides = this._o.callbackOverrides || {}
    delete this._o.callbackOverrides

    // call the _extendDefaults @ Module
    super._extendDefaults()

    const p = this._props
    p.easing = easing.parseEasing(p.easing)
    p.easing._parent = this

    // parse only present backward easing to prevent parsing as `linear.none`
    // because we need to fallback to `easing` in `_setProgress` method
    if (p.backwardEasing != null) {
      p.backwardEasing = easing.parseEasing(p.backwardEasing)
      p.backwardEasing._parent = this
    }
  }

  /**
   * Method for setting start and end time to props.
   * @private
   * @param {Number(Timestamp)|null} time Start time.
   * @param {boolean} isResetFlags Should reset flags.
   */
  _setStartTime(time?, isResetFlags = true) {
    const p = this._props,
      shiftTime = p.shiftTime || 0

    // reset flags
    if (isResetFlags) {
      this._isCompleted = false
      this._isRepeatCompleted = false
      this._isStarted = false
    }

    // set start time to passed time or to the current moment
    const startTime = time == null ? performance.now() : time

    // calculate bounds
    // - negativeShift is negative delay in options hash
    // - shift time is shift of the parent
    p.startTime = startTime + p.delay + this._negativeShift + shiftTime
    p.endTime = p.startTime + p.repeatTime - p.delay

    // set play time to the startTimes
    // if playback controls are used - use _resumeTime as play time,
    // else use shifted startTime -- shift is needed for timelines append chains
    this._playTime =
      this._resumeTime != null ? this._resumeTime : startTime + shiftTime
    this._resumeTime = null

    // return this;
  }

  /**
    Method to update tween's progress.
    @private
    @param {number} time Current update time.
    -- next params only present when parent Timeline calls the method.
    @param {number} timelinePrevTime Previous Timeline's update time.
    @param {boolean} wasYoyo Was parent in yoyo period.
    @param {number} onEdge [-1, 0, 1] If update is on edge.
                   -1 = edge jump in negative direction.
                    0 = no edge jump.
                    1 = edge jump in positive direction.
  */
  _update(time, timelinePrevTime?, wasYoyo?, onEdge?) {
    const p = this._props

    // if we don't the _prevTime thus the direction we are heading to,
    // but prevTime was passed thus we are child of a Timeline
    // set _prevTime to passed one and pretend that there was unknown
    // update to not to block start/complete callbacks
    if (this._prevTime == null && timelinePrevTime != null) {
      if (this._props.speed && this._playTime) {
        // play point + ( speed * delta )
        this._prevTime =
          this._playTime +
          this._props.speed * (timelinePrevTime - this._playTime)
      }

      // this._prevTime = timelinePrevTime;
      this._wasUknownUpdate = true
    }

    // var before = time;
    // cache vars
    const startPoint = p.startTime - p.delay

    // if speed param was defined - calculate
    // new time regarding speed
    if (p.speed && this._playTime) {
      // play point + ( speed * delta )
      time = this._playTime + p.speed * (time - this._playTime)
    }

    // due to javascript precision issues, after speed mapping
    // we can get very close number that was made from progress of 1
    // and in fact represents `endTime` if so, set the time to `endTime`
    if (Math.abs(p.endTime - time) < 0.00000001) {
      time = p.endTime
    }

    // if parent is onEdge but not very start nor very end
    if (onEdge && wasYoyo != null) {
      const T = this._getPeriod(time) as number
      const isYoyo = !!(p.isYoyo && this._props.repeat && T % 2 === 1)

      // for timeline
      // notify children about edge jump
      if (this._timelines) {
        for (let i = 0; i < this._timelines.length; i++) {
          this._timelines[i]._update(time, timelinePrevTime, wasYoyo, onEdge)
        }
      }

      // forward edge direction
      if (onEdge === 1) {
        // jumped from yoyo period?
        if (wasYoyo) {
          this._prevTime = time + 1
          this._repeatStart(time, isYoyo)
          this._start(time, isYoyo)
        } else {
          this._prevTime = time - 1
          this._repeatComplete(time, isYoyo)
          this._complete(time, isYoyo)
        }

        // backward edge direction
      } else if (onEdge === -1) {
        // jumped from yoyo period?
        if (wasYoyo) {
          this._prevTime = time - 1
          this._repeatComplete(time, isYoyo)
          this._complete(time, isYoyo)
        } else {
          // call _start callbacks only if prev time was in active area
          // not always true for append chains
          if (this._prevTime >= p.startTime && this._prevTime <= p.endTime) {
            this._prevTime = time + 1
            this._repeatStart(time, isYoyo)
            this._start(time, isYoyo)

            // reset isCompleted immediately to prevent onComplete cb
            this._isCompleted = true
          }
        }
      }

      // reset the _prevTime - drop one frame to understand
      // where we are heading
      this._prevTime = undefined
    }

    // if in active area and not ended - save progress time
    // for pause/play purposes.
    if (time > startPoint && time < p.endTime) {
      this._progressTime = time - startPoint
    }

    // else if not started or ended set progress time to 0
    else if (time <= startPoint) {
      this._progressTime = 0
    } else if (time >= p.endTime) {
      // set progress time to repeat time + tiny coefficient
      // to make it extend further than the end time
      this._progressTime = p.repeatTime + 0.00000000001
    }

    // reverse time if _props.isReversed is set
    if (p.isReversed) {
      time = p.endTime - this._progressTime
    }

    // We need to know what direction we are heading to,
    // so if we don't have the previous update value - this is very first
    // update, - skip it entirely and wait for the next value
    if (this._prevTime == null) {
      this._prevTime = time
      this._wasUknownUpdate = true
      return false
    }

    // ====== AFTER SKIPPED FRAME ======

    // handle onProgress callback
    if (time >= startPoint && time <= p.endTime) {
      this._progress((time - startPoint) / p.repeatTime, time)
    }

    /*
      if time is inside the active area of the tween.
      active area is the area from start time to end time,
      with all the repeat and delays in it
    */
    if (time >= p.startTime && time <= p.endTime) {
      this._updateInActiveArea(time)
    } else {
      // if was in active area - update in inactive area but just once -
      // right after the active area
      if (this._isInActiveArea) {
        this._updateInInactiveArea(time)
      } else if (!this._isRefreshed) {
        // onRefresh callback
        // before startTime
        if (time < p.startTime && this.progress !== 0) {
          this._refresh(true)
          this._isRefreshed = true

          // after endTime
        }

        // else if ( time > p.endTime ) { }
      }
    }

    this._prevTime = time
    return time >= p.endTime || time <= startPoint
  }

  /*
    Method to handle tween's progress in inactive area.
    @private
    @param {number} Current update time.
  */
  _updateInInactiveArea(time) {
    if (!this._isInActiveArea) {
      return
    }
    const p = this._props

    // complete if time is larger then end time
    if (time > p.endTime && !this._isCompleted) {
      this._progress(1, time)

      // get period number
      const T = this._getPeriod(p.endTime) as number
      const isYoyo = p.isYoyo && T % 2 === 0

      this._setProgress(isYoyo ? 0 : 1, time, isYoyo)
      this._repeatComplete(time, isYoyo)
      this._complete(time, isYoyo)
    }

    // if was active and went to - inactive area "-"
    if (
      time < this._prevTime &&
      time < p.startTime &&
      !this._isStarted &&
      !this._isCompleted
    ) {
      // if was in active area and didn't fire onStart callback
      this._progress(0, time)
      this._setProgress(0, time, false)
      this._isRepeatStart = false
      this._repeatStart(time, false)
      this._start(time, false)
    }
    this._isInActiveArea = false
  }

  /*
    Method to handle tween's progress in active area.
    @private
    @param {number} Current update time.
  */
  _updateInActiveArea(time) {
    const props = this._props
    const delayDuration = props.delay + props.duration
    const startPoint = props.startTime - props.delay
    const elapsed = (time - props.startTime + props.delay) % delayDuration
    const TCount = Math.round(
      (props.endTime - props.startTime + props.delay) / delayDuration
    )
    const T = this._getPeriod(time)
    const TValue = this._delayT
    const prevT = this._getPeriod(this._prevTime)
    const TPrevValue = this._delayT

    // "zero" and "one" value regarding yoyo and it's period
    let isYoyo = props.isYoyo && (T as number) % 2 === 1
    const isYoyoPrev = props.isYoyo && (prevT as number) % 2 === 1
    let yoyoZero = isYoyo ? 1 : 0

    if (time === props.endTime) {
      this._wasUknownUpdate = false

      // if `time` is equal to `endTime`, T represents the next period,
      // so we need to decrement T and calculate "one" value regarding yoyo
      isYoyo = props.isYoyo && ((T as number) - 1) % 2 === 1
      this._setProgress(isYoyo ? 0 : 1, time, isYoyo)
      if (time > this._prevTime) {
        this._isRepeatCompleted = false
      }
      this._repeatComplete(time, isYoyo)
      return this._complete(time, isYoyo)
    }

    // reset callback flags
    this._isCompleted = false
    this._isRefreshed = false

    // if time is inside the duration area of the tween
    if (startPoint + elapsed >= props.startTime) {
      this._isInActiveArea = true
      this._isRepeatCompleted = false
      this._isRepeatStart = false
      this._isStarted = false

      // active zone or larger then end
      const elapsed2 = (time - props.startTime) % delayDuration,
        proc = elapsed2 / props.duration

      // |=====|=====|=====| >>>
      //      ^1^2
      const isOnEdge = T > 0 && prevT < T

      // |=====|=====|=====| <<<
      //      ^2^1
      const isOnReverseEdge = prevT > T

      // for use in timeline
      this._onEdge = 0
      isOnEdge && (this._onEdge = 1)
      isOnReverseEdge && (this._onEdge = -1)

      if (this._wasUknownUpdate) {
        if (time > this._prevTime) {
          this._start(time, isYoyo)
          this._repeatStart(time, isYoyo)
          this._firstUpdate(time, isYoyo)
        }

        // if backward direction and
        // if ( time < this._prevTime && time !== this._props.startTime ) {
        if (time < this._prevTime) {
          this._complete(time, isYoyo)
          this._repeatComplete(time, isYoyo)
          this._firstUpdate(time, isYoyo)

          // reset isCompleted immediately
          this._isCompleted = false
        }
      }

      if (isOnEdge) {
        // if not just after delay
        // |---=====|---=====|---=====| >>>
        //            ^1 ^2
        // because we have already handled
        // 1 and onRepeatComplete in delay gap
        if (this.progress !== 1) {
          // prevT
          const isThisYoyo = props.isYoyo && ((T as number) - 1) % 2 === 1
          this._repeatComplete(time, isThisYoyo)
        }

        // if on edge but not at very start
        // |=====|=====|=====| >>>
        // ^!    ^here ^here
        if (prevT >= 0) {
          this._repeatStart(time, isYoyo)
        }
      }

      if (time > this._prevTime) {
        //  |=====|=====|=====| >>>
        // ^1  ^2
        if (!this._isStarted && this._prevTime <= props.startTime) {
          this._start(time, isYoyo)
          this._repeatStart(time, isYoyo)

          // it was zero anyways

          // restart flags immediately in case if we will
          // return to '-' inactive area on the next step
          this._isStarted = false
          this._isRepeatStart = false
        }
        this._firstUpdate(time, isYoyo)
      }

      if (isOnReverseEdge) {
        // if on edge but not at very end
        // |=====|=====|=====| <<<
        //       ^here ^here ^not here
        if (this.progress !== 0 && this.progress !== 1 && prevT != TCount) {
          this._repeatStart(time, isYoyoPrev)
        }

        // if on very end edge
        // |=====|=====|=====| <<<
        //       ^!    ^! ^2 ^1
        // we have handled the case in this._wasUknownUpdate
        // block so filter that
        if (prevT === TCount && !this._wasUknownUpdate) {
          this._complete(time, isYoyo)
          this._repeatComplete(time, isYoyo)
          this._firstUpdate(time, isYoyo)

          // reset isComplete flag call
          // cuz we returned to active area
          // this._isRepeatCompleted = false;
          this._isCompleted = false
        }
        this._repeatComplete(time, isYoyo)
      }

      if (prevT === 'delay') {
        // if just before delay gap
        // |---=====|---=====|---=====| <<<
        //               ^2    ^1
        if (T < TPrevValue) {
          this._repeatComplete(time, isYoyo)
        }

        // if just after delay gap
        // |---=====|---=====|---=====| >>>
        //            ^1  ^2
        if (T === TPrevValue && T > 0) {
          this._repeatStart(time, isYoyo)
        }
      }

      // swap progress and repeatStart based on direction
      if (time > this._prevTime) {
        // if progress is equal 0 and progress grows
        if (proc === 0) {
          this._repeatStart(time, isYoyo)
        }
        if (time !== props.endTime) {
          this._setProgress(isYoyo ? 1 - proc : proc, time, isYoyo)
        }
      } else {
        if (time !== props.endTime) {
          this._setProgress(isYoyo ? 1 - proc : proc, time, isYoyo)
        }

        // if progress is equal 0 and progress grows
        if (proc === 0) {
          this._repeatStart(time, isYoyo)
        }
      }

      if (time === props.startTime) {
        this._start(time, isYoyo)
      }

      // delay gap - react only once
    } else if (this._isInActiveArea) {
      // because T will be string of "delay" here,
      // let's normalize it be setting to TValue
      let t = T === 'delay' ? TValue : T,
        isGrows = time > this._prevTime

      // decrement period if forward direction of update
      isGrows && t--

      // calculate normalized yoyoZero value
      yoyoZero = props.isYoyo && t % 2 === 1 ? 1 : 0

      // if was in active area and previous time was larger
      // |---=====|---=====|---=====| <<<
      //   ^2 ^1    ^2 ^1    ^2 ^1
      if (time < this._prevTime) {
        this._setProgress(yoyoZero, time, yoyoZero === 1)
        this._repeatStart(time, yoyoZero === 1)
      }

      // set 1 or 0 regarding direction and yoyo
      this._setProgress(isGrows ? 1 - yoyoZero : yoyoZero, time, yoyoZero === 1)

      // if time grows
      if (time > this._prevTime) {
        // if reverse direction and in delay gap, then progress will be 0
        // if so we don't need to call the onRepeatComplete callback
        // |---=====|---=====|---=====| <<<
        //   ^0       ^0       ^0
        // OR we have flipped 0 to 1 regarding yoyo option
        if (this.progress !== 0 || yoyoZero === 1) {
          // since we repeatComplete for previous period
          // invert isYoyo option
          // is elapsed is 0 - count as previous period
          this._repeatComplete(time, yoyoZero === 1)
        }
      }

      // set flag to indicate inactive area
      this._isInActiveArea = false
    }

    // we've got the first update now
    this._wasUknownUpdate = false
  }

  /*
    Method to remove the Tween from the tweener.
    @private
    @returns {object} Self.
  */
  _removeFromTweener() {
    tweener.remove(this)
    return this
  }

  /**
   * Method to get current period number.
   * @private
   * @param {number} time Time to get the period for.
   * @returns {number} Current period number.
   */
  _getPeriod(time: number): number | 'delay' {
    let p = this._props,
      TTime = p.delay + p.duration,
      dTime = p.delay + time - p.startTime,
      T = dTime / TTime,
      // if time if equal to endTime we need to set the elapsed
      // time to 0 to fix the occasional precision js bug, which
      // causes 0 to be something like 1e-12
      elapsed = time < p.endTime ? dTime % TTime : 0

    // If the latest period, round the result, otherwise floor it.
    // Basically we always can floor the result, but because of js
    // precision issues, sometimes the result is 2.99999998 which
    // will result in 2 instead of 3 after the floor operation.
    T = time >= p.endTime ? Math.round(T) : Math.floor(T)

    // if time is larger then the end time
    if (time > p.endTime) {
      // set equal to the periods count
      T = Math.round((p.endTime - p.startTime + p.delay) / TTime)

      // if in delay gap, set _delayT to current
      // period number and return "delay"
    } else if (elapsed > 0 && elapsed < p.delay) {
      this._delayT = T
      // TODO: check why overwrite with 'delay'
      // @ts-ignore
      T = 'delay'
    }

    // if the end of period and there is a delay
    return T
  }

  /**
   * Method to set Tween's progress and call onUpdate callback.
   * @private
   * @override @ Module
   * @param {number} proc Progress to set.
   * @param {number} time Current update time.
   * @param {boolean} isYoyo Is yoyo period. Used in Timeline to pass to Tween.
   */
  // @ts-ignore
  _setProgress(proc, time, isYoyo) {
    const p = this._props
    const isYoyoChanged = p.wasYoyo !== isYoyo
    const isForward = time > this._prevTime

    this.progress = proc

    // get the current easing for `forward` direction regarding `yoyo`
    if ((isForward && !isYoyo) || (!isForward && isYoyo)) {
      this.easedProgress = p.easing(proc)

      // get the current easing for `backward` direction regarding `yoyo`
    } else if ((!isForward && !isYoyo) || (isForward && isYoyo)) {
      const easing = p.backwardEasing != null ? p.backwardEasing : p.easing

      this.easedProgress = easing(proc)
    }

    if (p.prevEasedProgress !== this.easedProgress || isYoyoChanged) {
      if (p.onUpdate != null && typeof p.onUpdate === 'function') {
        p.onUpdate.call(
          p.callbacksContext || this,
          this.easedProgress,
          this.progress,
          isForward,
          isYoyo
        )
      }
    }
    p.prevEasedProgress = this.easedProgress
    p.wasYoyo = isYoyo
  }

  /*
    Method to set tween's state to start and call onStart callback.
    @method _start
    @private
    @param {number} Progress to set.
    @param {boolean} Is yoyo period.
  */
  _start(time, isYoyo) {
    if (this._isStarted) {
      return
    }
    const p = this._props
    if (p.onStart != null && typeof p.onStart === 'function') {
      p.onStart.call(p.callbacksContext || this, time > this._prevTime, isYoyo)
    }
    this._isCompleted = false
    this._isStarted = true
    this._isFirstUpdate = false
  }

  /*
    Method to call onPlaybackStart callback
    @private
  */
  _playbackStart() {
    const p = this._props
    if (p.onPlaybackStart != null && typeof p.onPlaybackStart === 'function') {
      p.onPlaybackStart.call(p.callbacksContext || this)
    }
  }

  /*
    Method to call onPlaybackPause callback
    @private
  */
  _playbackPause() {
    const p = this._props
    if (p.onPlaybackPause != null && typeof p.onPlaybackPause === 'function') {
      p.onPlaybackPause.call(p.callbacksContext || this)
    }
  }

  /*
    Method to call onPlaybackStop callback
    @private
  */
  _playbackStop() {
    const p = this._props
    if (p.onPlaybackStop != null && typeof p.onPlaybackStop === 'function') {
      p.onPlaybackStop.call(p.callbacksContext || this)
    }
  }

  /*
    Method to call onPlaybackComplete callback
    @private
  */
  _playbackComplete() {
    const p = this._props
    if (
      p.onPlaybackComplete != null &&
      typeof p.onPlaybackComplete === 'function'
    ) {
      p.onPlaybackComplete.call(p.callbacksContext || this)
    }
  }

  /*
    Method to set tween's state to complete.
    @method _complete
    @private
    @param {number} Current time.
    @param {boolean} Is yoyo period.
  */
  _complete(time, isYoyo) {
    if (this._isCompleted) {
      return
    }
    const p = this._props
    if (p.onComplete != null && typeof p.onComplete === 'function') {
      p.onComplete.call(
        p.callbacksContext || this,
        time > this._prevTime,
        isYoyo
      )
    }

    this._isCompleted = true
    this._isStarted = false
    this._isFirstUpdate = false

    // reset _prevYoyo for timeline usage
    this._prevYoyo = undefined
  }

  /*
    Method to run onFirstUpdate callback.
    @method _firstUpdate
    @private
    @param {number} Current update time.
    @param {boolean} Is yoyo period.
  */
  _firstUpdate(time, isYoyo) {
    if (this._isFirstUpdate) {
      return
    }
    const p = this._props
    if (p.onFirstUpdate != null && typeof p.onFirstUpdate === 'function') {
      // onFirstUpdate should have tween pointer
      p.onFirstUpdate.tween = this
      p.onFirstUpdate.call(
        p.callbacksContext || this,
        time > this._prevTime,
        isYoyo
      )
    }
    this._isFirstUpdate = true
  }

  /*
    Method call onRepeatComplete callback and set flags.
    @private
    @param {number} Current update time.
    @param {boolean} Is repeat period.
  */
  _repeatComplete(time, isYoyo) {
    if (this._isRepeatCompleted) {
      return
    }
    const p = this._props
    if (
      p.onRepeatComplete != null &&
      typeof p.onRepeatComplete === 'function'
    ) {
      p.onRepeatComplete.call(
        p.callbacksContext || this,
        time > this._prevTime,
        isYoyo
      )
    }
    this._isRepeatCompleted = true

    // this._prevYoyo = null;
  }

  /*
    Method call onRepeatStart callback and set flags.
    @private
    @param {number} Current update time.
    @param {boolean} Is yoyo period.
  */
  _repeatStart(time, isYoyo) {
    if (this._isRepeatStart) {
      return
    }
    const p = this._props
    if (p.onRepeatStart != null && typeof p.onRepeatStart === 'function') {
      p.onRepeatStart.call(
        p.callbacksContext || this,
        time > this._prevTime,
        isYoyo
      )
    }
    this._isRepeatStart = true
  }

  /**
   * Method to launch onProgress callback.
   * @method _progress
   * @private
   * @param {number} progress Progress to set.
   * @param {number} time
   */
  _progress = (progress, time) => {
    const p = this._props
    if (p.onProgress != null && typeof p.onProgress === 'function') {
      p.onProgress.call(
        p.callbacksContext || this,
        progress,
        time > this._prevTime
      )
    }
  }

  /**
   * Method to launch onRefresh callback.
   * @method _refresh
   * @private
   * @param {boolean} isBefore If refresh even before start time.
   */
  _refresh(isBefore: boolean) {
    const p = this._props
    if (p.onRefresh != null) {
      const context = p.callbacksContext || this,
        progress = isBefore ? 0 : 1

      p.onRefresh.call(context, isBefore, p.easing(progress), progress)
    }
  }

  /*
    Method which is called when the tween is removed from tweener.
    @private
  */
  _onTweenerRemove() {}

  /*
    Method which is called when the tween is removed
    from tweener when finished.
    @private
  */
  _onTweenerFinish() {
    this._setPlaybackState('stop')
    this._playbackComplete()
  }

  /*
    Method to set property[s] on Tween.
    @private
    @override @ Module
    @param {Object, String} Hash object of key/value pairs, or property name.
    @param {_} Property's value to set.
  */
  _setProp(obj, value?) {
    super._setProp(obj, value)
    this._calcDimensions()
  }

  /*
    Method to set single property.
    @private
    @override @ Module
    @param {string} Name of the property.
    @param {Any} Value for the property.
  */
  _assignProp(key, value) {
    // fallback to defaults
    if (value == null) {
      value = this._defaults[key]
    }

    // parse easing
    if (key === 'easing') {
      value = easing.parseEasing(value)
      value._parent = this
    }

    // handle control callbacks overrides
    const control = this._callbackOverrides[key]
    const isntOverridden = !value || !value.isMojsCallbackOverride
    if (control && isntOverridden) {
      value = this._overrideCallback(value, control)
    }

    // call super on Module
    super._assignProp(key, value)
  }

  /**
   * Method to override callback for control purpose.
   * @private
   * @param {string}   callback Callback name.
   * @param {Function} fun Method to call
   */
  _overrideCallback(callback, fun) {
    const isCallback = callback && typeof callback === 'function',
      override = function callbackOverride() {
        // call overridden callback if it exists
        // @ts-ignore
        isCallback && callback.apply(this, arguments) // eslint-disable-line

        // call the passed cleanup function
        // @ts-ignore
        fun.apply(this, arguments) // eslint-disable-line
      }

    // add overridden flag
    override.isMojsCallbackOverride = true
    return override
  }

  // _visualizeProgress(time) {
  //   var str = '|',
  //       procStr = ' ',
  //       p = this._props,
  //       proc = p.startTime - p.delay;

  //   while ( proc < p.endTime ) {
  //     if (p.delay > 0 ) {
  //       var newProc = proc + p.delay;
  //       if ( time > proc && time < newProc ) {
  //         procStr += ' ^ ';
  //       } else {
  //         procStr += '   ';
  //       }
  //       proc = newProc;
  //       str  += '---';
  //     }
  //     var newProc = proc + p.duration;
  //     if ( time > proc && time < newProc ) {
  //       procStr += '  ^   ';
  //     } else if (time === proc) {
  //       procStr += '^     ';
  //     } else if (time === newProc) {
  //       procStr += '    ^ ';
  //     } else {
  //       procStr += '      ';
  //     }
  //     proc = newProc;
  //     str += '=====|';
  //   }

  //   console.log(str);
  //   console.log(procStr);
  // }
}

export default Tween

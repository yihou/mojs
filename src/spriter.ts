import h from './h';
import Tween from 'tween/tween';
import Timeline from 'tween/timeline';

/*
  Class for toggling opacity on bunch of elements
  @class Spriter
  @todo
    - add isForce3d option
    - add run new option merging
    - add then chains
*/
class Spriter {
  _defaults
  o
  _frames
  _props
  el
  timeline: Timeline
  _frameStep
  _tween: Tween
  _prevFrame

  /*
    Defaults/APIs
  */
  _declareDefaults() {
    this._defaults = {

      /*
        Duration
        @property duration
        @type     {number}
      */
      duration: 500,

      /*
        Delay
        @property delay
        @type     {number}
      */
      delay: 0,

      /*
        Easing. Please see the
        [timeline module parseEasing function](timeline.coffee.html#parseEasing)
        for all available options.

        @property easing
        @type     {String, Function}
      */
      easing: 'linear.none',

      /*
        Repeat times count

        @property repeat
        @type     {number}
      */
      repeat: 0,

      /*
        Yoyo option defines if animation should be altered on repeat.

        @property yoyo
        @type     {boolean}
      */
      yoyo: false,

      /*
        isRunLess option prevents animation from running immediately after
        initialization.

        @property isRunLess
        @type     {boolean}
      */
      isRunLess: false,

      /*
        isShowEnd option defines if the last frame should be shown when
        animation completed.

        @property isShowEnd
        @type     {boolean}
      */
      isShowEnd: false,

      /*
        onStart callback will be called once on animation start.

        @property onStart
        @type     {Function}
      */
      onStart: null,

      /*
        onUpdate callback will be called on every frame of the animation.
        The current progress in range **[0,1]** will be passed to the callback.

        @property onUpdate
        @type     {Function}
      */
      onUpdate: null,

      /*
        onComplete callback will be called once on animation complete.

        @property onComplete
        @type     {Function}
      */
      onComplete: null,
    };
  }


  constructor(o = { }) {
    this.o = o;
    if (!this.o.el) {
      h.error('No "el" option specified, aborting');

      return
    }
    this._vars(); this._declareDefaults(); this._extendDefaults(); this._parseFrames();
    if (this._frames.length <= 2)
      h.warn(`Spriter: only ${this._frames.length} frames found`);
    if (this._frames.length < 1)
      h.error('Spriter: there is no frames to animate, aborting');
    this._createTween();
    return this;
  }

  /*
    Method to declare some variables.

    @method run
    @param  {object} New options
    @todo   Implement new object merging
  */
  _vars() {
    this._props = h.cloneObj(this.o);
    this.el = this.o.el;
    this._frames = [];
  }

  /*
    Method to run the spriter on demand.

    @method run
    @param  {object} New options
    @todo   Implement new object merging
  */
  run() { return this.timeline.play(); }

  /*
    Method to extend _props by options(this.o)

    @method _extendDefaults
  */
  _extendDefaults() { return h.extend(this._props, this._defaults); }

  /*
    Method to parse frames as child nodes of el.

    @method _parseFrames
  */
  _parseFrames() {
    this._frames = Array.prototype.slice.call(this.el.children, 0);
    this._frames.forEach((frame) => frame.style.opacity = 0);
    this._frameStep = 1 / this._frames.length;
  }

  /*
    Method to create tween and timeline and supply callbacks.

    @method _createTween
  */
  _createTween() {
    this._tween = new Tween({
      duration: this._props.duration,
      delay: this._props.delay,
      yoyo: this._props.yoyo,
      repeat: this._props.repeat,
      easing: this._props.easing,
      onStart: () => this._props.onStart && this._props.onStart(),
      onComplete: () => this._props.onComplete && this._props.onComplete(),
      onUpdate: (p) => this._setProgress(p),
    });
    this.timeline = new Timeline(); this.timeline.add(this._tween);
    if (!this._props.isRunLess) this._startTween();
  }

  /*
    Method to start tween

    @method _startTween
  */
  _startTween() { setTimeout(() => this.timeline.play(), 1); }

  /*
    Method to set progress of the sprite

    @method _setProgress
    @param  {number} Progress in range **[0,1]**
  */
  _setProgress(p) {

    // get the frame number
    const proc = Math.floor(p / this._frameStep)

    // react only if frame changes
    if (this._prevFrame != this._frames[proc]) {

      // if previous frame isnt current one, hide it
      if (this._prevFrame) { this._prevFrame.style.opacity = 0; }

      // if end of animation and isShowEnd flag was specified
      // then show the last frame else show current frame
      const currentNum = p === 1 && this._props.isShowEnd ? proc - 1 : proc

      // show the current frame
      if (this._frames[currentNum]) { this._frames[currentNum].style.opacity = 1; }

      // set previous frame as current
      this._prevFrame = this._frames[proc];
    }
    if (this._props.onUpdate) { this._props.onUpdate(p); }
  }
}

export default Spriter;

import h from './h';
import Timeline from 'tween/timeline';
import ShapeSwirl from './shape-swirl';
import Tunable from './tunable';


class ChildSwirl extends ShapeSwirl {
  _declareDefaults() {
    super._declareDefaults();
    this._defaults.isSwirl = false;
    this._o.duration = (this._o.duration != null)
      ? this._o.duration : 700;
  }

  // disable degreeShift calculations
  _calcSwirlXY(proc) {
    const degreeShift = this._props.degreeShift;

    this._props.degreeShift = 0;
    super._calcSwirlXY(proc);
    this._props.degreeShift = degreeShift;
  }
}

class MainSwirl extends ChildSwirl {
  _declareDefaults() {
    super._declareDefaults();
    this._defaults.scale = 1;
    this._defaults.width = 0;
    this._defaults.height = 0;
    this._defaults.radius = { 25: 75 };

    // this._defaults.duration = 2000;
  }
}

class Burst extends Tunable {
  static ChildSwirl = ChildSwirl;
  static MainSwirl = MainSwirl;

  _timelineOptions
  masterSwirl: ShapeSwirl
  _swirls
  _masterSwirls
  _bufferTimeline
  /*
    Method to declare defaults.
    @override @ ShapeSwirl.
  */
  _declareDefaults() {
    this._defaults = {

      /* [number > 0] :: Quantity of Burst particles. */
      count: 5,

      /* [0 < number < 360] :: Degree of the Burst. */
      degree: 360,

      /* ∆ :: [number > 0] :: Radius of the Burst. */
      radius: { 0: 50 },

      /* ∆ :: [number > 0] :: X radius of the Burst. */
      radiusX: null,

      /* ∆ :: [number > 0] :: Y radius of the Burst. */
      radiusY: null,

      /* [number >= 0] :: width of the main swirl. */
      width: 0,

      /* [number >= 0] :: height of the main swirl. */
      height: 0,
    };
  }

  /*
    Method to create a then record for the module.
    @public
    overrides @ Thenable
    @param    {object} Options for the next animation.
    @returns  {object} this.
  */
  then(o) {

    // remove tween properties (not callbacks)
    this._removeTweenProperties(o);

    const newMaster = this._masterThen(o)
    const newSwirls = this._childThen(o)

    this._setSwirlDuration(newMaster, this._calcPackTime(newSwirls));

    (this.timeline as Timeline)._recalcTotalDuration();
    return this;
  }


  /*
    Method to start the animation with optional new options.
    @public
    @param {object} New options to set on the run.
    @returns {object} this.
  */
  tune(o) {
    if (o == null) { return this; }

    // save timeline options to _timelineOptions
    // and delete the timeline options on o
    // cuz masterSwirl should not get them
    this._saveTimelineOptions(o);

    // add new timeline properties to timeline
    this.timeline._setProp(this._timelineOptions);

    // remove tween options (not callbacks)
    this._removeTweenProperties(o);

    // tune _props
    this._tuneNewOptions(o);

    // tune master swirl
    this.masterSwirl.tune(o);

    // tune child swirls
    this._tuneSwirls(o);

    // recalc time for modules
    this._recalcModulesTime();
    return this;
  }

  // ^ PUBLIC  METHODS ^
  // v PRIVATE METHODS v

  /*
    Method to copy `_o` options to `_props` object
    with fallback to `_defaults`.
    @private
    @overrides @ Module
  */
  _extendDefaults() {

    // remove tween properties (not callbacks)
    this._removeTweenProperties(this._o);
    super._extendDefaults();
  }

  /*
    Method to remove all tween (excluding
    callbacks) props from object.
    @private
    @param {object} Object which should be cleaned
                    up from tween properties.
  */
  _removeTweenProperties(o) {
    for (const key in h.tweenOptionMap) {

      // remove all items that are not declared in _defaults
      if (this._defaults[key] == null) {
        delete o[key];
      }
    }
  }

  /*
    Method to recalc modules chain tween
    times after tuning new options.
    @private
  */
  _recalcModulesTime() {
    let modules = this.masterSwirl._modules
    const swirls = this._swirls
    let shiftTime = 0

    for (let i = 0; i < modules.length; i++) {
      const tween = modules[i].tween,
        packTime = this._calcPackTime(swirls[i])
      tween._setProp({ 'duration': packTime,
        'shiftTime': shiftTime });
      shiftTime += packTime;
    }

    (this.timeline as Timeline)._recalcTotalDuration();
  }

  /*
    Method to tune Swirls with new options.
    @private
    @param {object} New options.
  */
  _tuneSwirls(o) {

    // get swirls in first pack
    const pack0 = this._swirls[0]
    for (let i = 0; i < pack0.length; i++) {
      const swirl = pack0[i]
      // TODO: define option type
      const option: any = this._getChildOption(o || {}, i)

      // since the `degreeShift` participate in
      // children position calculations, we need to keep
      // the old `degreeShift` value if new not set
      const isDegreeShift = (option.degreeShift != null);
      if (!isDegreeShift) {
        option.degreeShift = this._swirls[0][i]._props.degreeShift;
      }

      this._addBurstProperties(option, i);

      // after burst position calculation - delete the old `degreeShift`
      // from the options, since anyways we have copied it from the swirl
      if (!isDegreeShift) { delete option.degreeShift; }

      swirl.tune(option);
      this._refreshBurstOptions(swirl._modules, i);
    }
  }

  /*
    Method to refresh burst x/y/rotate options on further chained
    swirls, because they will be overridden after `tune` call on
    very first swirl.
    @param {Array} Chained modules array
    param {number} Index of the first swirl in the chain.
  */
  _refreshBurstOptions(modules, i) {
    for (let j = 1; j < modules.length; j++) {
      const module = modules[j]
      const options = {}
      this._addBurstProperties(options, i, j);
      module._tuneNewOptions(options);
    }
  }

  /*
    Method to call then on masterSwirl.
    @param {object} Then options.
    @returns {object} New master swirl.
  */
  _masterThen(o) {
    this.masterSwirl.then(o);

    // get the latest master swirl in then chain
    const newMasterSwirl = h.getLastItem(this.masterSwirl._modules)

    // save to masterSwirls
    this._masterSwirls.push(newMasterSwirl);
    return newMasterSwirl;
  }

  /*
    Method to call then on child swirls.
    @param {object} Then options.
    @return {Array} Array of new Swirls.
  */
  _childThen(o) {
    const pack = this._swirls[0]
    const newPack = []

    for (let i = 0; i < pack.length; i++) {

      // get option by modulus
      // TODO: define options type
      const options: any = this._getChildOption(o, i)
      const swirl = pack[i];

      // add new Master Swirl as parent of new ChildSwirl
      options.parent = this.el;

      this._addBurstProperties(options, i, this._masterSwirls.length - 1);

      swirl.then(options);

      // save the new item in `then` chain
      newPack.push(h.getLastItem(swirl._modules));
    }

    // save the pack to _swirls object
    this._swirls[this._masterSwirls.length - 1] = newPack;
    return newPack;
  }

  /*
    Method to initialize properties.
    @private
    @overrides @ Thenable
  */
  _vars() {
    super._vars();

    // just buffer timeline for calculations
    this._bufferTimeline = new Timeline;
  }

  /*
    Method for initial render of the module.
  */
  _render() {
    this._o.isWithShape = false;
    this._o.isSwirl = this._props.isSwirl;
    this._o.callbacksContext = this;

    // save timeline options and remove from _o
    // cuz the master swirl should not get them
    this._saveTimelineOptions(this._o);

    this.masterSwirl = new MainSwirl(this._o);
    this._masterSwirls = [this.masterSwirl];
    this.el = this.masterSwirl.el;

    this._renderSwirls();
  }

  /*
    Method for initial render of swirls.
    @private
  */
  _renderSwirls() {
    const p = this._props
    const pack: ChildSwirl[] = []

    for (let i = 0; i < p.count; i++) {
      const option = this._getChildOption(this._o, i)
      pack.push(new ChildSwirl(this._addOptionalProps(option, i)));
    }
    this._swirls = { 0: pack };
    this._setSwirlDuration(this.masterSwirl, this._calcPackTime(pack));
  }

  /*
    Method to save timeline options to _timelineOptions
    and delete the property on the object.
    @private
    @param {object} The object to save the timeline options from.
  */
  _saveTimelineOptions(o) {
    this._timelineOptions = o.timeline;
    delete o.timeline;
  }

  /*
    Method to calculate total time of array of
    concurrent tweens.
    @param   {Array}  Pack to calculate the total time for.
    @returns {number} Total pack duration.
  */
  _calcPackTime(pack) {
    let maxTime = 0
    for (let i = 0; i < pack.length; i++) {
      const tween = pack[i].tween
      const p = tween._props

      maxTime = Math.max(p.repeatTime / p.speed, maxTime);
    }

    return maxTime;
  }

  /*
    Method to set duration for Swirl.
    @param {object} Swirl instance to set the duration to.
    @param {number} Duration to set.
  */
  _setSwirlDuration(swirl, duration) {
    swirl.tween._setProp('duration', duration);
    const isRecalc = swirl.timeline && swirl.timeline._recalcTotalDuration
    isRecalc && swirl.timeline._recalcTotalDuration();
  }

  /*
    Method to get childOption form object call by modulus.
    @private
    @param   {object} Object to look in.
    @param   {number} Index of the current Swirl.
    @returns {object} Options for the current swirl.
  */
  _getChildOption(obj, i) {
    const options = {}
    for (const key in obj.children) {
      options[key] = this._getPropByMod(key, i, obj.children);
    }
    return options;
  }

  /*
    Method to get property by modulus.
    @private
    @param {string} Name of the property.
    @param {number} Index for the modulus.
    @param {object} Source object to check in.
    @returns {Any} Property.
  */
  _getPropByMod(name, index, sourceObj = {}) {
    const prop = sourceObj[name]
    return Array.isArray(prop) ? prop[index % prop.length] : prop;
  }

  /*
    Method to add optional Swirls' properties to passed object.
    @private
    @param {object} Object to add the properties to.
    @param {number} Index of the property.
  */
  _addOptionalProps(options, index) {
    options.index = index;
    options.parent = this.masterSwirl.el;

    this._addBurstProperties(options, index);

    return options;
  }

  /*
    Method to add Burst options to object.
    @private
    @param {object} Options to add the properties to.
    @param {number} Index of the Swirl.
    @param {number} Index of the main swirl.
  */
  _addBurstProperties(options, index, i?) {

    // save index of the module
    const mainIndex = this._index

    // temporary change the index to parse index based properties like stagger
    this._index = index;

    // parse degree shift for the bit
    const degreeShift = this._parseProperty('degreeShift', options.degreeShift || 0)

    // put the index of the module back
    this._index = mainIndex;

    const p = this._props
    const degreeCnt = (p.degree % 360 === 0) ? p.count : p.count - 1 || 1
    const step = p.degree / degreeCnt
    const pointStart = this._getSidePoint('start', index * step + degreeShift, i)
    const pointEnd = this._getSidePoint('end', index * step + degreeShift, i)

    options.x = this._getDeltaFromPoints('x', pointStart, pointEnd);
    options.y = this._getDeltaFromPoints('y', pointStart, pointEnd);

    options.rotate = this._getBitRotation((options.rotate || 0), degreeShift, index);
  }

  /*
    Method to get shapes rotation in burst so
    it will follow circular shape.

     @param    {Number, Object} Base rotation.
     @param    {number}         Rotation shift for the bit
     @param    {number}         Shape's index in burst.
     @returns  {number}         Rotation in burst.
  */
  _getBitRotation(rotationProperty = 0, rotationShift = 0, i) {
    let p = this._props
    let degCnt = (p.degree % 360 === 0) ? p.count : p.count - 1 || 1
    let step = p.degree / degCnt
    let rotate = i * step + 90

    rotate += rotationShift;

    // if not delta option
    if (!this._isDelta(rotationProperty)) { rotationProperty += rotate; }
    else {
      const delta = {}
      const keys = Object.keys(rotationProperty)
      let start = keys[0]
      let end = rotationProperty[start]

      start = h.parseStringOption(start, i);
      end = h.parseStringOption(end, i);

      // new start = newEnd
      delta[parseFloat(start) + rotate] = parseFloat(end) + rotate;

      rotationProperty = delta as number;
    }
    return rotationProperty;
  }

  /**
    Method to get radial point on `start` or `end`.
    @private
    @param {string} side Name of the side - [start, end].
    @param {number} rotate Rotation of the radial point.
    @param {number} i Index of the main swirl.
    @returns radial point.
  */
  _getSidePoint(side, rotate, i) {
    const sideRadius = this._getSideRadius(side, i)

    return h.getRadialPoint({
      radius: sideRadius.radius,
      radiusX: sideRadius.radiusX,
      radiusY: sideRadius.radiusY,
      rotate: rotate,

      // center:  { x: p.center, y: p.center }
      center: { x: 0,
        y: 0 },
    });
  }

  /*
    Method to get radius of the side.
    @private
    @param {string} Name of the side - [start, end].
    @param {number} Index of the main swirl.
    @returns {object} Radius.
  */
  _getSideRadius(side, i) {
    return {
      radius: this._getRadiusByKey('radius', side, i),
      radiusX: this._getRadiusByKey('radiusX', side, i),
      radiusY: this._getRadiusByKey('radiusY', side, i),
    };
  }

  /*
    Method to get radius from ∆ or plain property.
    @private
    @param {string} Key name.
    @param {string} Side name - [start, end].
    @param {number} Index of the main swirl.
    @returns {number} Radius value.
  */
  _getRadiusByKey(key, side, i = 0) {
    const swirl = this._masterSwirls[i]
    const deltas = swirl._deltas
    const props = swirl._props

    if (deltas[key] != null) { return deltas[key][side]; }
    else if (props[key] != null) { return props[key]; }
  }

  /*
    Method to get delta from start and end position points.
    @private
    @param {string} Key name.
    @param {object} Start position point.
    @param {object} End position point.
    @returns {object} Delta of the end/start.
  */
  _getDeltaFromPoints(key, pointStart, pointEnd) {
    let delta = {}
    if (pointStart[key] === pointEnd[key]) {
      delta = pointStart[key];
    } else { delta[pointStart[key]] = pointEnd[key]; }
    return delta;
  }

  /*
    Method to create timeline.
    @private
    @override @ Tweenable
  */
  _makeTimeline() {

    // restore timeline options that were deleted in _render method
    this._o.timeline = this._timelineOptions;
    super._makeTimeline();
    (this.timeline as Timeline).add(this.masterSwirl, this._swirls[0]);
  }

  /*
    Method to make Tween for the module.
    @private
    @override @ Tweenable
  */
  _makeTween() { /* don't create any tween */ }
  /*
    Override `_hide` and `_show` methods on module
    since we don't have to hide nor show on the module.
  */
  _hide() { /* do nothing */ }
  _show() { /* do nothing */ }
}


export default Burst;

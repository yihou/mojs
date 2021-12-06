import h from './h';
import Shape from './shape';
import {Unit} from './types'

/*
  *TODO:*
  ---
  - tweak then chains
*/

class ShapeSwirl extends Shape {
  _posData

  /*
    Method to declare _defaults and other default objects.
    @private
    @override @ Shape
  */
  _declareDefaults() {
    super._declareDefaults();

    /* _DEFAULTS ARE - Shape DEFAULTS + THESE: */

    /* [boolean] :: If shape should follow sinusoidal path. */
    this._defaults.isSwirl = true;

    /* ∆ :: [number > 0] :: Degree size of the sinusoidal path. */
    this._defaults.swirlSize = 10;

    /* ∆ :: [number > 0] :: Frequency of the sinusoidal path. */
    this._defaults.swirlFrequency = 3;

    /* ∆ :: [number > 0] :: Sinusoidal path length scale. */
    this._defaults.pathScale = 1;

    /* ∆ :: [number] :: Degree shift for the sinusoidal path. */
    this._defaults.degreeShift = 0;

    /* ∆ :: [number] :: Radius of the shape. */
    this._defaults.radius = 5;

    // ∆ :: Units :: Possible values: [ number, string ]
    this._defaults.x = 0;

    // ∆ :: Units :: Possible values: [ number, string ]
    this._defaults.y = 0;

    // ∆ :: Possible values: [ number ]
    this._defaults.scale = {1: 0};

    /* [number: -1, 1] :: Direction of Swirl. */
    this._defaults.direction = 1;
  }

  // ^ PUBLIC  METHOD(S) ^
  // v PRIVATE METHOD(S) v

  /*
    Method to copy _o options to _props with
    fallback to _defaults.
    @private
    @override @ Module
  */
  _extendDefaults() {
    super._extendDefaults();
    this._calcPosData();
  }

  /*
    Method to tune new options to _o and _props object.
    @private
    @overrides @ Module
    @param {object} Options object to tune to.
  */
  _tuneNewOptions(o) {
    if (!o) {
      return undefined;
    }

    super._tuneNewOptions(o);
    if (o.x != null || o.y != null) {
      this._calcPosData();
    }
  }

  /*
    Method to calculate Swirl's position data.
    @private
  */
  _calcPosData() {
    const x = this._getPosValue('x')
    const y = this._getPosValue('y')
    const rotate = (90 + Math.atan((y.delta / x.delta) || 0) * h.RAD_TO_DEG)

    this._posData = {
      radius: Math.sqrt(x.delta * x.delta + y.delta * y.delta),
      rotate: (x.delta < 0) ? rotate + 180 : rotate,
      x,
      y,
    };

    // set the last position to _props
    // this._calcSwirlXY( 1 );
  }

  /*
    Gets `x` or `y` position value.
    @private
    @param {string} Name of the property.
  */
  _getPosValue(name) {
    const delta = this._deltas[name]
    if (delta) {

      // delete from deltas to prevent normal
      delete this._deltas[name];
      return {
        start: delta.start.value,
        end: delta.end.value,
        delta: delta.delta,
        units: delta.end.unit,
      };
    } else {
      const pos = h.parseUnit(this._props[name]) as Unit
      return {
        start: pos.value,
        end: pos.value,
        delta: 0,
        units: pos.unit
      };
    }
  }

  /*
    Method to calculate the progress of the Swirl.
    @private
    @overrides @ Shape
    @param {number} Eased progress of the Swirl in range of [0..1]
    @param {number} Progress of the Swirl in range of [0..1]
  */
  _setProgress(easedProgress, progress) {
    this._progress = easedProgress;
    this._calcCurrentProps(easedProgress, progress);
    this._calcSwirlXY(easedProgress);

    // this._calcOrigin();

    // TODO: check if requires easedProgress
    // this._draw(easedProgress);
    this._draw();
  }

  /*
    Method to calculate x/y for Swirl's progress
    @private
    @mutates _props
    @param {number} Current progress in [0...1]
  */
  _calcSwirlXY(proc) {
    const p = this._props
    const rotate = this._posData.rotate + p.degreeShift
    const point = h.getRadialPoint({
      rotate: (p.isSwirl) ? rotate + this._getSwirl(proc) : rotate,
      radius: proc * this._posData.radius * p.pathScale,
      center: {
        x: this._posData.x.start,
        y: this._posData.y.start,
      },
    })

    // if foreign svg canvas - set position without units
    let x = point.x
    let y = point.y
    const smallNumber = 0.000001

    // remove very small numbers to prevent exponential forms
    if (x > 0 && x < smallNumber) {
      x = smallNumber;
    }
    if (y > 0 && y < smallNumber) {
      y = smallNumber;
    }
    if (x < 0 && x > -smallNumber) {
      x = -smallNumber;
    }
    if (y < 0 && y > -smallNumber) {
      y = -smallNumber;
    }

    p.x = (this._o.ctx) ? x : `${x}${this._posData.x.units}`;
    p.y = (this._o.ctx) ? y : `${y}${this._posData.y.units}`;
  }

  /*
    Method to get progress of the swirl.
    @private
    @param {number} Progress of the Swirl.
    @returns {number} Progress of the swirl.
  */
  _getSwirl(proc) {
    const p = this._props
    return p.direction * p.swirlSize * Math.sin(p.swirlFrequency * proc);
  }

  /*
    Method to draw shape.
    If !isWithShape - draw self el only, but not shape.
    @private
    @overrides @ Shape.
  */
  _draw() {

    // call _draw or just _drawEl @ Shape depending if there is `shape`
    const methodName = (this._props.isWithShape) ? '_draw' : '_drawEl'
    Shape.prototype[methodName].call(this);
  }
}

export default ShapeSwirl;

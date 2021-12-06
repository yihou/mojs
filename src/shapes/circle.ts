/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// ignore coffescript sudo code

import { default as Bit } from './bit';

class Circle extends Bit {
  _declareDefaults() {
    // TODO: check if passing in arguments are required
    // super._declareDefaults(...arguments);
    super._declareDefaults();
    return this._defaults.shape = 'ellipse';
  }

  _draw() {
    const rx = (this._props.radiusX != null) ? this._props.radiusX : this._props.radius;
    const ry = (this._props.radiusY != null) ? this._props.radiusY : this._props.radius;
    this._setAttrIfChanged('rx', rx);
    this._setAttrIfChanged('ry', ry);
    this._setAttrIfChanged('cx', this._props.width/2);
    this._setAttrIfChanged('cy', this._props.height/2);
    // @_setAttrIfChanged 'cx', @_props.width/2
    // @_setAttrIfChanged 'cy', @_props.height/2
    // @setAttrsIfChanged rx: rx, ry: ry, cx: @_props.x, cy: @_props.y
    // TODO: check if passing in arguments are required
    // return super._draw(...arguments);
    return super._draw();
  }
  _getLength() {
    const radiusX = (this._props.radiusX != null) ? this._props.radiusX : this._props.radius;
    const radiusY = (this._props.radiusY != null) ? this._props.radiusY : this._props.radius;
    // Math.pow is needed for safari's 6.0.5 odd bug
    // pow = Math.pow;
    return 2*Math.PI*Math.sqrt(((radiusX*radiusX) + (radiusY*radiusY))/2);
  }
}

export default Circle;

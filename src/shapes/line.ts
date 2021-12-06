/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// ignore coffescript sudo code

import { default as Bit } from './bit';

class Line extends Bit {
  _declareDefaults() {
    // TODO: check if passing in arguments are required
    // super._declareDefaults(...arguments);
    super._declareDefaults();
    return this._defaults.tag = 'line';
  }
  _draw() {
    const radiusX = (this._props.radiusX != null) ? this._props.radiusX : this._props.radius;
    const x = this._props.width/2;
    const y = this._props.height/2;
    this._setAttrIfChanged('x1', x - radiusX);
    this._setAttrIfChanged('x2', x + radiusX);
    this._setAttrIfChanged('y1', y);
    this._setAttrIfChanged('y2', y);
    // TODO: check if passing in arguments are required
    // return super._draw(...arguments);
    return super._draw();
  }
}

export default Line;

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// ignore coffescript sudo code

import { default as Bit } from './bit';

class Zigzag extends Bit {
  _prevRadiusX
  _prevRadiusY
  _prevPoints
  _length

  _declareDefaults() {
    // TODO: check if passing in arguments are required
    // super._declareDefaults(...arguments);
    super._declareDefaults();
    this._defaults.tag    = 'path';
    return this._defaults.points = 3;
  }
    // @_defaults.ratio = 1.43;
  _draw() {
    // TODO: check if passing in arguments are required
    // super._draw(...arguments);
    super._draw();
    const p = this._props;
    if (!this._props.points) { return; }

    const radiusX = (this._props.radiusX != null) ? this._props.radiusX : this._props.radius;
    const radiusY = (this._props.radiusY != null) ? this._props.radiusY : this._props.radius;

    const isRadiusX = radiusX === this._prevRadiusX;
    const isRadiusY = radiusY === this._prevRadiusY;
    const isPoints  = p.points === this._prevPoints;
    // skip if nothing changed
    if ( isRadiusX && isRadiusY && isPoints ) { return; }

    const x = p.width/2;
    const y = p.height/2;

    let currentX = x-radiusX;
    let currentY = y;
    const stepX    = (2*radiusX) / (p.points-1);
    let yFlip    = -1;

    const delta = Math.sqrt((stepX*stepX) + (radiusY*radiusY));
    let length = -delta;

    let points = `M${currentX}, ${y} `;
    for (let i = 0, end = p.points, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
      points   += `L${currentX}, ${currentY} `;
      currentX += stepX;
      length   += delta;

      currentY = yFlip === -1 ? y-radiusY : y;
      yFlip    = -yFlip;
    }

    this._length = length;
    this.el.setAttribute('d', points);

    // save the properties
    this._prevPoints  = p.points;
    this._prevRadiusX = radiusX;
    return this._prevRadiusY = radiusY;
  }

  _getLength() { return this._length; }
}

export default Zigzag;

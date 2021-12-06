/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// ignore coffescript sudo code

import { default as Bit } from './bit'

class Equal extends Bit {
  _prevRadiusX
  _prevRadiusY
  _prevPoints

  // shape: 'path'
  // ratio: 1.43
  _declareDefaults() {
    // TODO: check if passing in arguments are required
    // super._declareDefaults(...arguments);
    super._declareDefaults()
    this._defaults.tag = 'path'
    return (this._defaults.points = 2)
  }

  _draw() {
    // TODO: check if passing in arguments are required
    // super._draw(...arguments);
    super._draw()
    const p = this._props
    if (!this._props.points) {
      return
    }

    const radiusX =
      this._props.radiusX != null ? this._props.radiusX : this._props.radius
    const radiusY =
      this._props.radiusY != null ? this._props.radiusY : this._props.radius

    const isRadiusX = radiusX === this._prevRadiusX
    const isRadiusY = radiusY === this._prevRadiusY
    const isPoints = p.points === this._prevPoints
    // skip if nothing changed
    if (isRadiusX && isRadiusY && isPoints) {
      return
    }

    const x = this._props.width / 2
    let y: number | string = this._props.height / 2
    const x1 = x - radiusX
    const x2 = x + radiusX
    let d = ''
    const yStep = (2 * radiusY) / (this._props.points - 1)
    const yStart = y - radiusY
    for (
      let i = 0, end = this._props.points, asc = 0 <= end;
      asc ? i < end : i > end;
      asc ? i++ : i--
    ) {
      y = `${i * yStep + yStart}`
      d += `M${x1}, ${y} L${x2}, ${y} `
    }

    this.el.setAttribute('d', d)

    // save the properties
    this._prevPoints = p.points
    this._prevRadiusX = radiusX
    return (this._prevRadiusY = radiusY)
  }

  _getLength() {
    return (
      2 *
      (this._props.radiusX != null ? this._props.radiusX : this._props.radius)
    )
  }
}

export default Equal

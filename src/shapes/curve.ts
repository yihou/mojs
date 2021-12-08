import Bit from './bit'

class Curve extends Bit {
  _prevRadiusX?: number
  _prevRadiusY?: number
  _prevPoints?: number[]

  /*
    Method to declare module's defaults.
    @private
    @overrides @ Bit
  */
  _declareDefaults() {
    super._declareDefaults()
    this._defaults.tag = 'path'
  }

  /*
    Method to draw the module.
    @private
    @overrides @ Bit
  */
  _draw() {
    super._draw()
    const p = this._props

    const radiusX = p.radiusX != null ? p.radiusX : p.radius
    const radiusY = p.radiusY != null ? p.radiusY : p.radius

    const isRadiusX = radiusX === this._prevRadiusX
    const isRadiusY = radiusY === this._prevRadiusY
    const isPoints = p.points === this._prevPoints

    // skip if nothing changed
    if (isRadiusX && isRadiusY && isPoints) {
      return
    }

    if (!this.el) {
      throw new Error('"this.el" is not defined.')
    }

    const x = p.width / 2
    const y = p.height / 2
    const x1 = x - radiusX
    const x2 = x + radiusX

    const d = `M${x1} ${y} Q ${x} ${y - 2 * radiusY} ${x2} ${y}`

    // set the `d` attribute and save it to `_prevD`
    this.el.setAttribute('d', d)

    // save the properties
    this._prevPoints = p.points
    this._prevRadiusX = radiusX
    this._prevRadiusY = radiusY
  }

  _getLength() {
    const p = this._props

    const radiusX = p.radiusX != null ? p.radiusX : p.radius
    const radiusY = p.radiusY != null ? p.radiusY : p.radius

    const dRadius = radiusX + radiusY
    const sqrt = Math.sqrt((3 * radiusX + radiusY) * (radiusX + 3 * radiusY))

    return 0.5 * Math.PI * (3 * dRadius - sqrt)
  }
}

export default Curve

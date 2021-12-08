import h from '../h'
import Module from '../module'
import {Nullable, Point} from '../types'

interface BitDefaults {
  ns: string
  tag: string
  parent: HTMLElement
  ratio: number
  radius: number
  stroke: string
  'stroke-dasharray': string
  'stroke-dashoffset': string
  'stroke-linecap': string
  'stroke-width': number
  'stroke-opacity': number
  'fill-opacity': number
  fill: string
  width: number
  height: number
  radiusX: Nullable<number>
  radiusY: Nullable<number>
}

class Bit<T = any> extends Module<BitDefaults & T> {
  _drawMap = [
    'stroke',
    'stroke-width',
    'stroke-opacity',
    'stroke-dasharray',
    'fill',
    'stroke-dashoffset',
    'stroke-linecap',
    'fill-opacity',
    'transform'
  ]

  _defaults: any = {
    ns: 'http://www.w3.org/2000/svg',
    tag: 'ellipse',
    parent: document.body,
    ratio: 1,
    radius: 50,
    radiusX: null,
    radiusY: null,
    stroke: 'hotpink',
    'stroke-dasharray': '',
    'stroke-dashoffset': '',
    'stroke-linecap': '',
    'stroke-width': 2,
    'stroke-opacity': 1,
    fill: 'transparent',
    'fill-opacity': 1,
    width: 0,
    height: 0
  }

  _state: Record<any, any> = {}
  _drawMapLength = 0
  _isRendered = false
  _canvas?: SVGElement

  /*
    Method to declare module's defaults.
    @private
  */
  _declareDefaults() {}

  _vars() {
    this._state = {}
    this._drawMapLength = this._drawMap.length
  }

  /*
    Method for initial render of the shape.
    @private
  */
  _render() {
    if (this._isRendered) {
      return
    }

    // set `_isRendered` hatch
    this._isRendered = true

    // create `SVG` canvas to draw in
    this._createSVGCanvas()

    // set canvas size
    this._setCanvasSize()

    // draw the initial state
    // this._draw();
    // append the canvas to the parent from props
    this._props.parent.appendChild(this._canvas)
  }

  /*
    Method to create `SVG` canvas to draw in.
    @private
  */
  _createSVGCanvas() {
    const p = this._props

    // create canvas - `svg` element to draw in
    this._canvas = document.createElementNS(p.ns, 'svg') as any as SVGElement

    // create the element shape element and add it to the canvas
    this.el = document.createElementNS(p.ns, p.tag) as any as SVGGeometryElement
    this._canvas.appendChild(this.el)
  }

  /*
    Method to set size of the _canvas.
    @private
  */
  _setCanvasSize() {
    if (!this._canvas) {
      throw new Error('"_canvas" is not defined.')
    }

    const style = this._canvas.style

    style.display = 'block'
    style.width = '100%'
    style.height = '100%'
    style.left = '0px'
    style.top = '0px'
  }

  /*
    Method to draw the shape.
    Called on every frame.
    @private
  */
  _draw() {
    this._props.length = this._getLength()

    let len = this._drawMapLength
    while (len--) {
      const name = this._drawMap[len]
      switch (name) {
        case 'stroke-dasharray':
        case 'stroke-dashoffset':
          this.castStrokeDash(name)
      }
      this._setAttrIfChanged(name, this._props[name])
    }
    this._state.radius = this._props.radius
  }

  castStrokeDash(name: string) {
    let stroke
    // # if array of values
    const p = this._props
    if (Array.isArray(p[name])) {
      stroke = ''
      for (let i = 0; i < p[name].length; i++) {
        const dash = p[name][i]
        const cast =
          dash.unit === '%' ? this.castPercent(dash.value) : dash.value
        stroke += `${cast} `
      }
      if (stroke === '0 ') {
        p[name] = ''
      } else {
        p[name] = stroke
      }

      return
    }

    // # if single value
    if (typeof p[name] === 'object') {
      stroke =
        p[name].unit === '%' ? this.castPercent(p[name].value) : p[name].value

      if (stroke === 0) {
        p[name] = ''
      } else {
        p[name] = stroke
      }
    }
  }

  castPercent(percent: number) {
    return percent * (this._props.length / 100)
  }

  /*
    Method to set props to attribute and cache the values.
    @private
  */
  _setAttrIfChanged(name: string, value: any) {
    if (!this.el) {
      throw new Error('"this.el" is not defined')
    }
    if (this._state[name] !== value) {
      // this.el.style[name] = value;
      this.el.setAttribute(name, value)
      this._state[name] = value
    }
  }

  /*
    Method to length of the shape.
    @private
    @returns {Number} Length of the shape.
  */
  _getLength() {
    if (!this.el) {
      throw new Error('"el" is not defined.')
    }

    const p = this._props
    let len: number
    const isGetLength = !!(this.el && this.el.getTotalLength)

    if (isGetLength && this.el.getAttribute('d')) {
      len = this.el.getTotalLength()
    } else {
      len = 2 * (p.radiusX != null ? p.radiusX : p.radius)
    }
    return len
  }

  /*
    Method to calculate total sum between points.
    @private
    @param {Array} Array of points.
    @returns {Number} Distance between all points.
  */
  _getPointsPerimeter(points: Point[]) {
    let sum = 0

    for (let i = 1; i < points.length; i++) {
      sum += this._pointsDelta(points[i - 1], points[i])
    }

    sum += this._pointsDelta(points[0], h.getLastItem(points))
    return sum
  }

  /*
    Method to get delta from two points.
    @private
    @param {Object} Point 1.
    @param {Object} Point 2.
    @returns {Number} Distance between the points.
  */
  _pointsDelta(point1: Point, point2: Point) {
    const dx = Math.abs(point1.x - point2.x),
      dy = Math.abs(point1.y - point2.y)
    return Math.sqrt(dx * dx + dy * dy)
  }

  /*
    Method to set module's size.
    @private
    @param {Number} Module width.
    @param {Number} Module height.
  */
  _setSize(width: number, height: number) {
    const p = this._props
    p.width = width
    p.height = height
    this._draw()
  }
}

export default Bit

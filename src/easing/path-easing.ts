/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS202: Simplify dynamic range loops
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import h from '../h'
import {Point, PossiblyNullOrUndefined} from '../types'

// ## PathEasing
// Class allows you to specify custom easing function
// by **SVG path** [line commands](https://goo.gl/LzvV6P).
// Line commands should by in range of rect 100x100.
// @param {String, DOMNode}
// @param {object} options
//   - eps  {number}  Epsilon specifies how precise we
//     should be when sampling the path. Smaller number - more
//     precise is computation, but more CPU power it takes *default: 0.001*
//   - precompute {number} Quantity of steps for sampling specified path
//     on init. It can be in *range of [100, 10000]*.
//     Larger number specified - more time it takes to init the module,
//     but less time it takes during the animation. *default: 1450*
//   - rect {number} The largest
//     number SVG path coordinates can have *default: 100*
//   - approximateMax {number} Number of loops available
//     when approximating the path value *default: 5*
class PathEasing {
  _precompute
  _step
  _rect
  _approximateMax
  _eps
  _boundsPrevProgress
  _hardSample
  _samples: any[]
  _prevBounds
  _boundsStartIndex
  o
  path: PossiblyNullOrUndefined<SVGGeometryElement>
  pathLength?: number

  // Method to create variables
  // @method _vars
  _vars() {
    // options
    this._precompute = h.clamp(this.o.precompute || 1450, 100, 10000)
    this._step = 1 / this._precompute
    this._rect = this.o.rect || 100
    this._approximateMax = this.o.approximateMax || 5
    this._eps = this.o.eps || 0.001
    // util variables
    return (this._boundsPrevProgress = -1)
  }

  // Constructor
  constructor(path: string, o?: any) {
    // the class can work as a "creator" of self instances
    // so no need to init if 'creator' passed instead of path
    if (o == null) {
      o = {}
    }
    this.o = o
    if (path === 'creator') {
      return
    }
    this.path = h.parsePath(path)
    if (this.path == null) {
      h.error('Error while parsing the path')
      return
    }

    this._vars()
    // normalize start and end x value of the path
    this.path.setAttribute(
      'd',
      this._normalizePath(this.path.getAttribute('d'))
    )

    this.pathLength = this.path.getTotalLength()
    this._hardSample = this._hardSample.bind(this)

    // console.time 'pre sample'
    this._preSample()
    // console.timeEnd 'pre sample'
  }

  /**
   * Samples the path on init
   *
   * @method _preSample
   * @sideEffect {Array} _samples - set of sampled points
   */
  _preSample() {
    this._samples = []
    return (() => {
      if (!this.path) {
        throw new Error('"path" does not exist')
      }
      const result: any[] = []
      for (
        let i = 0, end = this._precompute, asc = 0 <= end;
        asc ? i <= end : i >= end;
        asc ? i++ : i--
      ) {
        const progress = i * this._step
        const length = (this.pathLength as number) * progress
        const point = this.path.getPointAtLength(length)
        this._samples[i] = {point, length, progress}
        result.push(this._samples[i])
      }
      return result
    })()
  }

  /**
   * @method _findBounds
   * @param  {Array} array to search in
   * @param  {number} progress progress to search for
   * @return {object}
   *         - start {number}: lowest boundary
   *         - end {number}: highest boundary
   */
  _findBounds(array: any[], progress: number) {
    let direction, end, loopEnd, start
    if (progress === this._boundsPrevProgress) {
      return this._prevBounds
    }
    // get the start index in the array
    // reset the cached prev index if new progress
    // is smaller than previous one, or it is not defined
    if (this._boundsStartIndex == null) {
      this._boundsStartIndex = 0
    }

    const len = array.length
    // get start and end indexes of the loop and save the direction
    if (this._boundsPrevProgress > progress) {
      loopEnd = 0
      direction = 'reverse'
    } else {
      loopEnd = len
      direction = 'forward'
    }

    // set default start and end bounds to the
    // very first and the very last items in array
    if (direction === 'forward') {
      start = array[0]
      end = array[array.length - 1]
    } else {
      start = array[array.length - 1]
      end = array[0]
    }

    // loop thru the array from the @_boundsStartIndex
    for (
      let i = this._boundsStartIndex,
        end1 = loopEnd,
        asc = this._boundsStartIndex <= end1;
      asc ? i < end1 : i > end1;
      asc ? i++ : i--
    ) {
      const value = array[i]
      let pointX = value.point.x / this._rect
      let pointP = progress
      // if direction is reverse swap pointX and pointP
      // for if statement
      if (direction === 'reverse') {
        const buffer = pointX
        pointX = pointP
        pointP = buffer
      }
      // the next statement is nicer but it creates
      // a new object, so bothers GC
      // {pointX, pointP} = {pointX: pointP, pointP: pointX}
      // save the latest smaller value as start value
      if (pointX < pointP) {
        start = value
        this._boundsStartIndex = i
        // save the first larger value as end value
        // and break immediately
      } else {
        end = value
        break
      }
    }
    this._boundsPrevProgress = progress
    // return the first item if start wasn't found
    // start ?= array[0]
    // end   ?= array[array.length-1]

    return (this._prevBounds = {start, end})
  }

  /**
   * Loop thru path trying to find the most closer x
   * compared to current progress value
   *
   * @method sample
   * @param  {number} p easing progress in range [0,1]
   * @return {number} easing y
   */
  sample = (p: number) => {
    p = h.clamp(p, 0, 1)
    const bounds = this._findBounds(this._samples, p)
    const res = this._checkIfBoundsCloseEnough(p, bounds)
    if (res != null) {
      return res
    }
    return this._findApproximate(p, bounds.start, bounds.end)
  }

  /**
   * Check if one of bounds.start or bounds.end
   * is close enough to searched progress
   *
   * @method _checkIfBoundsCloseEnough
   * @param  {number} progress progress
   * @param  {object} bounds
   * @return {Number, Undefined} returns Y value if true, undefined if false
   */
  _checkIfBoundsCloseEnough(progress: number, bounds: any) {
    // check if start bound is close enough
    const y = this._checkIfPointCloseEnough(progress, bounds.start.point)
    if (y != null) {
      return y
    }
    // check if end bound is close enough
    return this._checkIfPointCloseEnough(progress, bounds.end.point)
  }

  /**
   * Check if bound point close enough to progress
   *
   * @method _checkIfPointCloseEnough
   * @param  {number} progress
   * @param  {object} point bound point (start or end)
   * @return {Number, Undefined} returns Y value if true, undefined if false
   */
  _checkIfPointCloseEnough(progress: number, point: Point): number | undefined {
    if (h.closeEnough(progress, point.x / this._rect, this._eps)) {
      return this._resolveY(point)
    }

    return undefined
  }

  /**
   * @method _approximate
   * @param  {object} start point object
   * @param  {object} end point object
   * @param  {number} progress progress to search
   * @return {object} approximation
   */
  _approximate(start: Point, end: Point, progress: number) {
    const deltaP = end.point.x - start.point.x
    const percentP = (progress - start.point.x / this._rect) / (deltaP / this._rect)
    return start.length + percentP * (end.length - start.length)
  }

  /**
   * @method _findApproximate
   * @param  {number} progress progress to search for
   * @param  {object} start point object
   * @param  {object} end point object
   * @param approximateMax
   * @return {number} y approximation
   */
  _findApproximate(progress: number, start: Point, end: Point, approximateMax: number = this._approximateMax): number {
    if (this.path == null) {
      throw new Error('Error while parsing the path')
    }

    if (approximateMax == null) {
      approximateMax = this._approximateMax
    }
    const approximation = this._approximate(start, end, progress)
    const point = this.path.getPointAtLength(approximation)
    const x = point.x / this._rect
    // if close enough resolve the y value
    if (h.closeEnough(progress, x, this._eps)) {
      return this._resolveY(point)
    } else {
      // if looping for a long time
      if (--approximateMax < 1) {
        return this._resolveY(point)
      }
      // not precise enough so we will call self
      // again recursively, lets find arguments for the call
      const newPoint = {point, length: approximation}
      const args =
        progress < x
          ? [progress, start, newPoint, approximateMax]
          : [progress, newPoint, end, approximateMax]
      return this._findApproximate(args[0], args[1], args[2], args[3])
    }
  }

  /**
   * @method resolveY
   * @param  {object} point SVG point
   * @return {number} normalized y
   */
  _resolveY(point: SVGPoint) {
    return 1 - point.y / this._rect
  }

  /**
   * Method to normalize path's X start and end value
   * since it must start at 0 and end at 100
   * @param  {string} path Path coordinates to normalize
   * @return {string} Normalized path coordinates
   */
  _normalizePath(path: string) {
    // SVG path commands
    const svgCommandsRegexp = /[M|LHVCSQTA]/gim
    const points = path.split(svgCommandsRegexp)
    // remove the first empty item - it is always
    // empty cuz we split by M
    points.shift()
    const commands = path.match(svgCommandsRegexp)
    // normalize the x value of the start segment to 0
    const startIndex = 0
    points[startIndex] = this._normalizeSegment(points[startIndex])
    // normalize the x value of the end segment to _rect value
    const endIndex = points.length - 1
    points[endIndex] = this._normalizeSegment(
      points[endIndex],
      this._rect || 100
    )

    const normalizedPath = this._joinNormalizedPath(commands, points)
    // form the normalized path
    return normalizedPath
  }

  /**
   * Method to form normalized path.
   * @param {any[]} commands Commands array.
   * @param {any[]} points Points array.
   * @return {string} Formed normalized path.
   */
  _joinNormalizedPath(commands: unknown[], points: Point[]): string {
    let normalizedPath = ''
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      const space = i === 0 ? '' : ' '
      normalizedPath += `${space}${command}${points[i].trim()}`
    }

    return normalizedPath
  }

  /**

   // Method to normalize SVG path segment
   // @param  {string} Segment to normalize.
   // @param  {number} Value to normalize to.
   // @return {string} Normalized Segment.
   */
  _normalizeSegment(segment, value?) {
    if (value == null) {
      value = 0
    }
    segment = segment.trim()
    const nRgx = /([-+])?((\d+(\.(\d|e([-+])?)+)?)|(\.?(\d|e|([-+]))+))/gim
    const pairs = this._getSegmentPairs(segment.match(nRgx))
    // get x value of the latest point
    const lastPoint = pairs[pairs.length - 1]
    const x = lastPoint[0]
    const parsedX = Number(x)
    // if the x point isn't the same as value, set it to the value
    if (parsedX !== value) {
      // join pairs to form segment
      segment = ''
      lastPoint[0] = value
      for (let i = 0; i < pairs.length; i++) {
        const point = pairs[i]
        const space = i === 0 ? '' : ' '
        segment += `${space}${point[0]},${point[1]}`
      }
    }
    return segment
  }

  // Method to gather array values to pairs.
  // @param  {any[]} Array to search pairs in.
  // @return {any[]} Matrix of pairs.
  _getSegmentPairs(array) {
    if (array.length % 2 !== 0) {
      h.error('Failed to parse the path - segment pairs are not even.', array)
    }
    const newArray: any[][] = []
    // loop over the array by 2
    // and save the pairs
    for (let i = 0; i < array.length; i += 2) {
      const pair = [array[i], array[i + 1]]
      newArray.push(pair)
    }
    return newArray
  }

  /**
   * Create new instance of PathEasing with specified parameters
   * *Please see the docs for PathEasing for more details on params.*
   *
   * @method create
   * @param  {string, HTMLDocument} path
   * @param {object} o
   * @return {object} easing y
   */
  create(path, o?) {
    const handler = new PathEasing(path, o)
    ;(handler.sample as any).path = handler.path
    return handler.sample
  }
}

export default PathEasing

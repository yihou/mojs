/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import h from '../h'

import { default as Bit } from './bit'
import Circle from './circle'
import Cross from './cross'
import { default as Curve } from './curve'
import { default as Custom } from './custom'
import Equal from './equal'
import Line from './line'
import Polygon from './polygon'
import Rect from './rect'
import Zigzag from './zigzag'

class ShapesMap {
  bit = Bit
  custom = Custom
  circle = Circle
  line = Line
  zigzag = Zigzag
  rect = Rect
  polygon = Polygon
  cross = Cross
  equal = Equal
  curve = Curve

  constructor() {
    this.addShape = h.bind(this.addShape, this)
  }

  getShape(name) {
    return (
      this[name] ||
      h.error(`no ${name} shape available yet, please choose from this list:`, [
        'circle',
        'line',
        'zigzag',
        'rect',
        'polygon',
        'cross',
        'equal',
        'curve'
      ])
    )
  }

  /**
    Method to add shape to the map.
    @public
    @param {String} name Name of the shape module.
    @param {Object} Module Shape module class.
  */
  addShape(name, Module) {
    return (this[name] = Module)
  }
}

const shapesMap = new ShapesMap()

export default shapesMap

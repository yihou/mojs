import Burst from './burst'
import Delta from './delta/delta'
import Deltas from './delta/deltas'
import easing from './easing/easing'
import h from './h'
import Html from './html'
import Module from './module'
import MotionPath from './motion-path'
import Shape from './shape'
import ShapeSwirl from './shape-swirl'
import shapesMap from './shapes/shapesMap'
import Spriter from './spriter'
import stagger from './stagger'
import Thenable from './thenable'
import Tunable from './tunable'
import Timeline from './tween/timeline'
import Tween from './tween/tween'
import Tweenable from './tween/tweenable'
import tweener from './tween/tweener'

const mojs = {
  // TODO: grab envs from package.json
  revision: process.env.revision,
  isDebug: process.env.NODE_ENV !== 'production',
  helpers: h,
  Shape,
  ShapeSwirl,
  Burst,
  Html,
  stagger,
  Spriter,
  MotionPath,
  Tween,
  Timeline,
  Tweenable,
  Thenable,
  Tunable,
  Module,
  // tweener,
  easing,
  // shapesMap,
  _pool: {
    Delta,
    Deltas
  },
  h,
  delta: h.delta,
  addShape: shapesMap.addShape,
  CustomShape: shapesMap.custom,
  Transit: Shape,
  Swirl: ShapeSwirl
}

if (typeof window !== 'undefined') {
  window.mojs = mojs
}

export default mojs

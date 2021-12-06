/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// ## MotionPath
// Class for moving object along path or curve
//
// @class MotionPath
import h from './h';

import resize from 'any-resize-event';
import {default as Tween} from 'tween/tween';
import {default as Timeline} from 'tween/timeline';

interface ContainerSize {
  width: number
  height: number
}

interface Scale {
  x: number
  y: number
}

interface MotionPathThenOptions {
  onUpdate
  onStart
  onComplete
  onFirstUpdate
  isChained
  index
}

class MotionPath {
  defaults = {
    // Defines motion path or arc to animate **el's** position.
    //
    // Can be defined
    //   - by **String**:
    //     - **CSS selector** e.g. '#js-path', '.path' etc
    //     - **SVG path** [line commands](https://goo.gl/LzvV6P)
    //       e.g 'M0,0 L100, 300'
    //   - by **SVGPathElement** e.g document.getElementById('#js-path')
    //   - by **Arc shift** e.g { x: 200, y: 100 }. If motion path was defined by
    //     arc shift, [curvature option](#property-curvature)
    //     defines arc curvature.
    //
    // @property   path
    // @type       {String, SVGPathElement, Object}
    //
    // @codepen CSS selector:      https://codepen.io/sol0mka/pen/emqbLN/
    // @codepen SVG line commands: https://codepen.io/sol0mka/pen/dPxaMm/
    // @codepen SVGPathElement:    https://codepen.io/sol0mka/pen/xbvMyj/
    // @codepen Arc shift:         https://codepen.io/sol0mka/pen/QweYKW/
    path: null,
    // ---

    // Defines curve size for path defined by arc shift.
    // Curvature amount can be defined by number representing *px*
    // or percents(string) representing amount relative to shift length.
    // @example
    //   { x: 200, y: 100 } or { x: '50%', y: '20%' } or mix
    // @example
    //   // will fallback to defaults for omitted axes
    //   { x: 200 }   // fallbacks to { x: 200, y: '50%' }
    //   { y: '25%' } // fallbacks to { x: '75%', y: '25%' }
    //
    // @property   curvature
    // @type       {object}
    //
    // @codepen https://codepen.io/sol0mka/pen/vEobbM/
    curvature: {
      x: '75%', y: '50%'
    },
    // ---

    // Defines if composite layer should be forced on el to prevent
    // paint during animation.
    // @type       {boolean}
    isCompositeLayer: true,
    // ---

    // Delay before animation starts, *ms*
    // @property   delay
    // @type       {number}
    //
    // @codepen https://codepen.io/sol0mka/pen/wBVNLM/
    delay: 0,
    // ---

    // Duration of animation, *ms*
    // @property   duration
    // @type       {number}
    duration: 1000,
    // ---

    // Easing. The option will be passed to tween.parseEasing method.
    // Please see the [tween module](tween.coffee.html#parseEasing) for
    // all available options.
    //
    // @property   easing
    // @type       {String, Function, Array}
    //
    // @codepen String:              https://codepen.io/sol0mka/pen/GgVeKR/
    // @codepen Bezier cubic curve:  https://codepen.io/sol0mka/pen/WbVmeo/
    // @codepen Custom function:     https://codepen.io/sol0mka/pen/XJvGrE/
    easing: null,
    // ---

    // Animation repeat count
    // @property   repeat
    // @type       {Integer}
    //
    // @codepen https://codepen.io/sol0mka/pen/emqbLN/
    repeat: 0,
    // ---

    // Defines if animation should be alternated on repeat.
    //
    // @property   yoyo
    // @type       {boolean}
    //
    // @codepen https://codepen.io/sol0mka/pen/gbVEbb/
    yoyo: false,
    // ---

    // Callback **onStart** fires once if animation was started.
    //
    // @property   onStart
    // @type       {Function}
    //
    // @codepen https://codepen.io/sol0mka/pen/VYoRRe/
    onStart: null,
    // ---

    // Callback **onComplete** fires once if animation was completed.
    //
    // @property   onComplete
    // @type       {Function}
    //
    // @codepen https://codepen.io/sol0mka/pen/ZYgPPm/
    onComplete: null,
    // ---

    // Callback **onUpdate** fires every raf frame on motion
    // path update. Receives **progress** of type **Number**
    // in range *[0,1]* as argument.
    //
    // @property   onUpdate
    // @type       {Function}
    //
    // @codepen https://codepen.io/sol0mka/pen/YPmgMq/
    onUpdate: null,
    // ---

    // Defines additional horizontal offset from center of path, *px*
    // @property   offsetX
    // @type       {number}
    //
    // @codepen https://codepen.io/sol0mka/pen/gbVEbb/
    offsetX: 0,
    // ---

    // Defines additional vertical offset from center of path, *px*
    // @property   offsetY
    // @type       {number}
    //
    // @codepen https://codepen.io/sol0mka/pen/OPKqNN/
    offsetY: 0,
    // ---

    // Defines rotation offset for path curves
    // @property   rotationOffset
    // @type       {Number, Function}
    // @example
    //   // function
    //   new MotionPath({
    //     //...
    //     rotationOffset: function(currentRotation) {
    //       return if (currentRotation < 0) { 90 } else {-90}
    //     }
    //   });
    //
    // @codepen Number:    https://codepen.io/sol0mka/pen/JogzXw
    // @codepen Function:  https://codepen.io/sol0mka/pen/MYNxer
    rotationOffset: null,
    // ---

    // Defines lower bound for path coordinates in range *[0,1]*
    // So specifying pathStart of .5 will start animation
    // form the 50% progress of your path.
    // @property   pathStart
    // @type       {number}
    // @example
    //   // function
    //   new MotionPath({
    //     //...
    //     pathStart: .5
    //   });
    //
    // @codepen https://codepen.io/sol0mka/pen/azeMBQ/
    pathStart: 0,
    // ---

    // Defines upper bound for path coordinates in range *[0,1]*
    // So specifying pathEnd of .5 will end animation
    // at the 50% progress of your path.
    // @property   pathEnd
    // @type       {number}
    // @example
    //   // function
    //   new MotionPath({
    //     //...
    //     pathEnd: .5
    //   });
    //
    // @codepen https://codepen.io/sol0mka/pen/wBVOJo/
    pathEnd: 1,
    // ---

    // Defines motion blur on element in range of *[0,1]*
    //
    // @property   motionBlur
    // @type       {number}
    motionBlur: 0,
    // ---

    // Defines transform-origin CSS property for **el**.
    // Can be defined by **string** or **function**.
    // Function receives current rotation as argument and
    // should return transform-origin value as a string.
    //
    // @property   transformOrigin
    // @type       {String, Function}
    // @example
    //   // function
    //   new MotionPath({
    //     //...
    //     isRotation: true,
    //     transformOrigin: function (currentRotation) {
    //       return  6*currentRotation + '% 0';
    //     }
    //   });
    //
    // @codepen Function:  https://codepen.io/sol0mka/pen/pvMYwp
    transformOrigin: null,
    // ---

    // Defines if path curves rotation should be set to el.
    //
    // @property   isRotation
    // @type       {boolean}
    // @codepen https://codepen.io/sol0mka/pen/GgVexq/
    isRotation: false,
    // ---

    // Defines motion path direction.
    //
    // @property   isReverse
    // @type       {boolean}
    // @codepen https://codepen.io/sol0mka/pen/KwOERQ/
    isReverse: false,
    // ---

    // Defines if animation should not start after init.
    // Animation can be then started with calling [run]() method.
    //
    // @property   isRunLess
    // @type       {boolean}
    //
    // @codepen *Please see at codepen for proper results*:
    // https://codepen.io/sol0mka/pen/raXRKQ/
    isRunLess: false,
    // ---

    // Defines if **el's** position should be preset immediately after init.
    // If set to false **el** will remain at it's position until
    // actual animation started on delay end or [run]() method call.
    //
    // @property   isPresetPosition
    // @type       {boolean}
    //
    // @codepen https://codepen.io/sol0mka/pen/EaqMOJ/
    isPresetPosition: true
  };

  o
  props
  isMotionBlurReset
  history
  resize
  rotate: number
  speedX: number
  speedY: number
  blurX: number
  blurY: number
  prevCoords
  blurAmount: number
  onUpdate
  el
  path
  len: number
  slicedLen: number
  startLen: number
  fill: number
  container
  fillRule
  filterID: string
  filter: Element | null
  filterOffset: Element | null
  isModule: boolean
  cSize: ContainerSize
  scaler: Scale
  tween: Tween
  timeline: Timeline


  // ---
  // ### Class body docs
  // ---
  constructor(o) {
    this.calcHeight = this.calcHeight.bind(this);
    if (o == null) {
      o = {};
    }
    this.o = o;
    if (this.vars()) {
      return;
    }
    this.createTween();
  }

  vars() {
    this.getScaler = h.bind(this.getScaler, this);
    this.resize = resize;
    this.props = h.cloneObj(this.defaults);
    this.extendOptions(this.o);
    // reset motionBlur for safari and IE
    this.isMotionBlurReset = h.isSafari || h.isIE;
    this.isMotionBlurReset && (this.props.motionBlur = 0);
    this.history = [h.cloneObj(this.props)];
    return this.postVars();
  }

  // ---

  // Method to transform coordinates and curvature
  // to svg path
  //
  // @method curveToPath
  //
  // @param {object} coordinates of end point **x** and **y**
  // @param {object} coordinates of the control point
  //                 of the quadratic bezier curve, relative to
  //                 start and end coordinates **x** and **y**
  //
  // @return {SVGElement} svg path
  curveToPath(o) {
    const path = document.createElementNS(h.NS, 'path');
    const {start, curvature} = o;
    const endPoint = {
      x: start.x + o.shift.x,
      y: start.x + o.shift.y
    };

    const dX = o.shift.x;
    const dY = o.shift.y;
    const radius = Math.sqrt((dX * dX) + (dY * dY));
    const percent = radius / 100;
    let rotation = (Math.atan(dY / dX) * (180 / Math.PI)) + 90;
    if (o.shift.x < 0) {
      rotation = rotation + 180;
    }

    // get point on line between start end end
    let curvatureX = h.parseUnit(curvature.x);
    if (typeof curvatureX === 'object') {
      curvatureX = curvatureX.unit === '%' ? curvatureX.value * percent
        : curvatureX.value;
    }

    const curveXPoint = h.getRadialPoint({
      center: {
        x: start.x, y: start.y
      },
      radius: curvatureX as number,
      // TODO: check rotate wasn't declared
      // rotate
    });
    // get control point with center in curveXPoint
    let curvatureY = h.parseUnit(curvature.y);

    if (typeof curvatureY === 'object') {
      curvatureY = curvatureY.unit === '%' ? curvatureY.value * percent
        : curvatureY.value;
    }

    const curvePoint = h.getRadialPoint({
      center: {
        x: curveXPoint.x, y: curveXPoint.y
      },
      radius: curvatureY as number,
      rotate: rotation + 90
    });

    path.setAttribute('d', `M${start.x},${start.y} \
Q${curvePoint.x},${curvePoint.y} \
${endPoint.x},${endPoint.y}`
    );

    return path;
  }

  postVars() {
    this.props.pathStart = h.clamp(this.props.pathStart, 0, 1);
    this.props.pathEnd = h.clamp(this.props.pathEnd, this.props.pathStart, 1);
    this.rotate = 0;
    this.speedX = 0;
    this.speedY = 0;
    this.blurX = 0;
    this.blurY = 0;
    this.prevCoords = {};
    this.blurAmount = 20;
    // clamp motionBlur in range of [0,1]
    this.props.motionBlur = h.clamp(this.props.motionBlur, 0, 1);

    this.onUpdate = this.props.onUpdate;
    if (!this.o.el) {
      h.error(`Missed "el" option. It could be a selector, \
DOMNode or another module.`
      );
      return true;
    }

    this.el = this.parseEl(this.props.el);
    (this.props.motionBlur > 0) && this.createFilter();

    this.path = this.getPath();
    if (!this.path.getAttribute('d')) {
      h.error('Path has no coordinates to work with, aborting');
      return true;
    }
    this.len = this.path.getTotalLength();
    this.slicedLen = this.len * (this.props.pathEnd - this.props.pathStart);
    this.startLen = this.props.pathStart * this.len;
    this.fill = this.props.fill;
    if (this.fill != null) {
      this.container = this.parseEl(this.props.fill.container);
      this.fillRule = this.props.fill.fillRule || 'all';
      this.getScaler();
      if (this.container != null) {
        this.removeEvent(this.container, 'onresize', this.getScaler);
        return this.addEvent(this.container, 'onresize', this.getScaler);
      }
    }
  }

  addEvent(el, type, handler) {
    return el.addEventListener(type, handler, false);
  }

  removeEvent(el, type, handler) {
    return el.removeEventListener(type, handler, false);
  }

  createFilter() {
    const div = document.createElement('div');
    this.filterID = `filter-${h.getUniqID()}`;
    div.innerHTML = `<svg id="svg-${this.filterID}"
    style="visibility:hidden; width:0; height:0">
  <filter id="${this.filterID}" y="-20" x="-20" width="40" height="40">
    <feOffset
      id="blur-offset" in="SourceGraphic"
      dx="0" dy="0" result="offset2"></feOffset>
    <feGaussianblur
      id="blur" in="offset2"
      stdDeviation="0,0" result="blur2"></feGaussianblur>
    <feMerge>
      <feMergeNode in="SourceGraphic"></feMergeNode>
      <feMergeNode in="blur2"></feMergeNode>
    </feMerge>
  </filter>
</svg>`;

    const svg = div.querySelector(`#svg-${this.filterID}`) as SVGElement;
    this.filter = svg.querySelector('#blur');
    this.filterOffset = svg.querySelector('#blur-offset');
    document.body.insertBefore(svg, document.body.firstChild);
    this.el.style['filter'] = `url(#${this.filterID})`;
    return this.el.style[`${h.prefix.css}filter`] = `url(#${this.filterID})`;
  }

  parseEl(el) {
    if (typeof el === 'string') {
      return document.querySelector(el);
    }
    if (el instanceof HTMLElement) {
      return el;
    }
    if (el._setProp != null) {
      this.isModule = true;
      return el;
    }
  }

  getPath() {
    const path = h.parsePath(this.props.path);
    if (path) {
      return path;
    }

    if (this.props.path.x || this.props.path.y) {
      return this.curveToPath({
        start: {
          x: 0, y: 0
        },
        shift: {x: (this.props.path.x || 0), y: (this.props.path.y || 0)},
        curvature: {
          x: this.props.curvature.x || this.defaults.curvature.x,
          y: this.props.curvature.y || this.defaults.curvature.y
        }
      });
    }
  }

  getScaler() {
    this.cSize = {
      width: this.container.offsetWidth || 0,
      height: this.container.offsetHeight || 0
    };
    const start = this.path.getPointAtLength(0);
    const end = this.path.getPointAtLength(this.len);

    this.scaler = {
      x: 0,
      y: 0,
    };
    const size: ContainerSize = {
      width: end.x >= start.x ? end.x - start.x : start.x - end.x,
      height: end.y >= start.y ? end.y - start.y : start.y - end.y
    }

    switch (this.fillRule) {
      case 'all':
        this.calcWidth(size);
        return this.calcHeight(size);
      case 'width':
        this.calcWidth(size);
        // noinspection JSSuspiciousNameCombination
        return this.scaler.y = this.scaler.x;
      case 'height':
        this.calcHeight(size);
        // noinspection JSSuspiciousNameCombination
        return this.scaler.x = this.scaler.y;
    }
  }

  // else @calcBoth(size)

  calcWidth(size) {
    this.scaler.x = this.cSize.width / size.width;
    return !isFinite(this.scaler.x) && (this.scaler.x = 1);
  }

  calcHeight(size) {
    this.scaler.y = this.cSize.height / size.height;
    return !isFinite(this.scaler.y) && (this.scaler.y = 1);
  }

  run(o) {
    if (o) {
      for (let key in o) {
        const value = o[key];
        if (h.callbacksMap[key] || h.tweenOptionMap[key]) {
          h.warn(`the property "${key}" property can not be overridden on run yet`
          );
          delete o[key];
        } else {
          this.history[0][key] = value;
        }
      }
      this.tuneOptions(o);
    }
    return this.startTween();
  }


  createTween() {
    this.tween = new Tween({
      duration: this.props.duration,
      delay: this.props.delay,
      yoyo: this.props.yoyo,
      repeat: this.props.repeat,
      easing: this.props.easing,
      onStart: () => this.props.onStart?.apply(this),
      onComplete: () => {
        this.props.motionBlur && this.setBlur({
          blur: {x: 0, y: 0}, offset: {x: 0, y: 0}
        });
        return this.props.onComplete?.apply(this);
      },
      onUpdate: p => this.setProgress(p),
      onFirstUpdate: (isForward) => {
        if (!isForward) {
          return (this.history.length > 1) && this.tuneOptions(this.history[0]);
        }
      }
    });
    this.timeline = new Timeline;// onUpdate:(p)=> @o.onChainUpdate?(p)
    this.timeline.add(this.tween);
    !this.props.isRunLess && this.startTween();
    return this.props.isPresetPosition && this.setProgress(0, true);
  }

  startTween() {
    return setTimeout((() => this.timeline?.play()), 1);
  }


  setProgress(p, isInit: boolean = false) {
    const len = this.startLen + (!this.props.isReverse ? p * this.slicedLen : (1 - p) * this.slicedLen);
    const point = this.path.getPointAtLength(len);
    // get x and y coordinates
    const x = point.x + this.props.offsetX;
    const y = point.y + this.props.offsetY;
    this._getCurrentRotation(point, len, p);
    this._setTransformOrigin(p);
    this._setTransform(x, y, p, isInit);
    return this.props.motionBlur && this.makeMotionBlur(x, y);
  }

  setElPosition(x, y) {
    const rotate = this.rotate !== 0 ? `rotate(${this.rotate}deg)` : '';
    const isComposite = this.props.isCompositeLayer && h.is3d;
    const composite = isComposite ? 'translateZ(0)' : '';
    const transform = `translate(${x}px,${y}px) ${rotate} ${composite}`;
    return h.setPrefixedStyle(this.el, 'transform', transform);
  }

  setModulePosition(x, y) {
    this.el._setProp({shiftX: `${x}px`, shiftY: `${y}px`, rotate: this.rotate});
    return this.el._draw();
  }

  _getCurrentRotation(point, len, p) {
    const isTransformFunOrigin = typeof this.props.transformOrigin === 'function';
    if (this.props.isRotation || (this.props.rotationOffset != null) || isTransformFunOrigin) {
      const prevPoint = this.path.getPointAtLength(len - 1);
      const x1 = point.y - prevPoint.y;
      const x2 = point.x - prevPoint.x;
      let atan = Math.atan(x1 / x2);
      !isFinite(atan) && (atan = 0);
      this.rotate = atan * h.RAD_TO_DEG;
      if ((typeof this.props.rotationOffset) !== 'function') {
        return this.rotate += this.props.rotationOffset || 0;
      } else {
        return this.rotate = this.props.rotationOffset.call(this, this.rotate, p);
      }
    } else {
      return this.rotate = 0;
    }
  }

  _setTransform(x, y, p, isInit) {
    // get real coordinates relative to container size
    if (this.scaler) {
      x *= this.scaler.x;
      y *= this.scaler.y;
    }
    // call onUpdate but not on the very first(0 progress) call
    let transform = null;
    if (!isInit) {
      transform = this.onUpdate?.(p, {x, y, rotate: this.rotate});
    }
    // set position and rotation
    // 1: if motion path is for module
    if (this.isModule) {
      return this.setModulePosition(x, y);
      // 2: if motion path is for DOM node
    } else {
      // if string was returned from the onUpdate call
      // then set this string to the @el
      if (typeof transform !== 'string') {
        return this.setElPosition(x, y);
      } else {
        return h.setPrefixedStyle(this.el, 'transform', transform);
      }
    }
  }

  _setTransformOrigin(p) {
    if (this.props.transformOrigin) {
      const isTransformFunOrigin = typeof this.props.transformOrigin === 'function';
      // transform origin could be a function
      const tOrigin = !isTransformFunOrigin ? this.props.transformOrigin
        : this.props.transformOrigin(this.rotate, p);
      return h.setPrefixedStyle(this.el, 'transform-origin', tOrigin);
    }
  }

  makeMotionBlur(x, y) {
    // if previous coords are not defined yet -- set speed to 0
    let tailRotation = 0;
    let signX = 1;
    let signY = 1;
    if ((this.prevCoords.x == null) || (this.prevCoords.y == null)) {
      this.speedX = 0;
      this.speedY = 0;
      // else calculate speed based on the largest axes delta
    } else {
      const dX = x - this.prevCoords.x;
      const dY = y - this.prevCoords.y;
      if (dX > 0) {
        signX = -1;
      }
      if (signX < 0) {
        signY = -1;
      }
      this.speedX = Math.abs(dX);
      this.speedY = Math.abs(dY);
      tailRotation = (Math.atan(dY / dX) * (180 / Math.PI)) + 90;
    }
    const absoluteRotation = tailRotation - this.rotate;
    const coords = this.rotToCoords(absoluteRotation);
    // get blur based on speed where 1px per 1ms is very fast
    // and motionBlur coefficient
    this.blurX = h.clamp((this.speedX / 16) * this.props.motionBlur, 0, 1);
    this.blurY = h.clamp((this.speedY / 16) * this.props.motionBlur, 0, 1);
    this.setBlur({
      blur: {
        x: 3 * this.blurX * this.blurAmount * Math.abs(coords.x),
        y: 3 * this.blurY * this.blurAmount * Math.abs(coords.y)
      },
      offset: {
        x: 3 * signX * this.blurX * coords.x * this.blurAmount,
        y: 3 * signY * this.blurY * coords.y * this.blurAmount
      }
    });
    // save previous coords
    this.prevCoords.x = x;
    return this.prevCoords.y = y;
  }

  setBlur(o) {
    if (!this.isMotionBlurReset) {
      if (this.filter) {
        this.filter.setAttribute('stdDeviation', `${o.blur.x},${o.blur.y}`);
      } else {
        console.warn('this.filter does not exist')
      }

      if (this.filterOffset) {
        this.filterOffset.setAttribute('dx', o.offset.x);
        this.filterOffset.setAttribute('dy', o.offset.y);
      } else {
        console.warn('this.filterOffset does not exist')
      }
    }
  }

  extendDefaults(o) {
    return (() => {
      const result = [];
      for (let key in o) {
        const value = o[key];
        // @ts-ignore
        result.push(this[key] = value);
      }
      return result;
    })();
  }

  extendOptions(o) {
    return (() => {
      const result = [];
      for (let key in o) {
        const value = o[key];
        // @ts-ignore
        result.push(this.props[key] = value);
      }
      return result;
    })();
  }

  then(o) {

    const prevOptions = this.history[this.history.length - 1];
    // TODO: double check if the options defined are correct
    const opts: Partial<MotionPathThenOptions> = {};
    for (let key in prevOptions) {
      // don't copy callbacks and tween options(only duration)
      // get prev options if not defined
      const value = prevOptions[key];
      if ((!h.callbacksMap[key] && !h.tweenOptionMap[key]) || (key === 'duration')) {
        if (o[key] == null) {
          o[key] = value;
        }
        // if property is callback and not defined in then options -
        // define it as undefined :) to override old callback,
        // because we are inside the prevOptions hash and it means
        // the callback was previously defined
      } else {
        if (o[key] == null) {
          o[key] = undefined;
        }
      }
      // get animation timing values to feed the tween
      if (h.tweenOptionMap[key]) {
        // copy all props, if prop is duration - fallback to previous value
        opts[key] = key !== 'duration' ? o[key]
          : (o[key] != null) ? o[key] : prevOptions[key];
      }
    }
    this.history.push(o);
    const it = this;
    opts.onUpdate = p => this.setProgress(p);
    opts.onStart = () => this.props.onStart?.apply(this);
    opts.onComplete = () => this.props.onComplete?.apply(this);
    opts.onFirstUpdate = function () {
      return it.tuneOptions(it.history[this.index]);
    };
    opts.isChained = !o.delay;
    this.timeline.append(new Tween(opts));
    return this;
  }

  tuneOptions(o) {
    this.extendOptions(o);
    return this.postVars();
  }

  rotToCoords(rotation) {
    rotation = rotation % 360;
    const radRotation = ((rotation - 90) * Math.PI) / 180;
    let x = Math.cos(radRotation);
    let y = Math.sin(radRotation);
    x = x < 0 ? Math.max(x, -0.7) : Math.min(x, .7);
    y = y < 0 ? Math.max(y, -0.7) : Math.min(y, .7);
    return {
      x: x * 1.428571429,
      y: y * 1.428571429
    };
  }
}

// x: Math.cos(radRotation), y: Math.sin(radRotation)

export default MotionPath;

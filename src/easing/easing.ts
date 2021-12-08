/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import h from '../h'
import {EasingValue} from '../types'

import { approximateSample } from './approximate'
import bezier from './bezier-easing'
import mix from './mix'
import PathEasing from './path-easing'

const { PI } = Math

const linear = {
  none(k: string) {
    return k
  }
}
const ease = {
  in: bezier(0.42, 0, 1, 1),
  out: bezier(0, 0, 0.58, 1),
  inout: bezier(0.42, 0, 0.58, 1)
}
const sin = {
  in(k: number) {
    return 1 - Math.cos((k * PI) / 2)
  },
  out(k: number) {
    return Math.sin((k * PI) / 2)
  },
  inout(k: number) {
    return 0.5 * (1 - Math.cos(PI * k))
  }
}
const quad = {
  in(k: number) {
    return k * k
  },
  out(k: number) {
    return k * (2 - k)
  },
  inout(k: number) {
    if ((k *= 2) < 1) {
      return 0.5 * k * k
    }
    return -0.5 * (--k * (k - 2) - 1)
  }
}
const cubic = {
  in(k: number) {
    return k * k * k
  },
  out(k: number) {
    return --k * k * k + 1
  },
  inout(k: number) {
    if ((k *= 2) < 1) {
      return 0.5 * k * k * k
    }
    return 0.5 * ((k -= 2) * k * k + 2)
  }
}
const quart = {
  in(k: number) {
    return k * k * k * k
  },
  out(k: number) {
    return 1 - --k * k * k * k
  },
  inout(k: number) {
    if ((k *= 2) < 1) {
      return 0.5 * k * k * k * k
    }
    return -0.5 * ((k -= 2) * k * k * k - 2)
  }
}
const quint = {
  in(k: number) {
    return k * k * k * k * k
  },
  out(k: number) {
    return --k * k * k * k * k + 1
  },
  inout(k: number) {
    if ((k *= 2) < 1) {
      return 0.5 * k * k * k * k * k
    }
    return 0.5 * ((k -= 2) * k * k * k * k + 2)
  }
}
const expo = {
  in(k: number) {
    if (k === 0) {
      return 0
    } else {
      return Math.pow(1024, k - 1)
    }
  },
  out(k: number) {
    if (k === 1) {
      return 1
    } else {
      return 1 - Math.pow(2, -10 * k)
    }
  },
  inout(k: number) {
    if (k === 0) {
      return 0
    }
    if (k === 1) {
      return 1
    }
    if ((k *= 2) < 1) {
      return 0.5 * Math.pow(1024, k - 1)
    }
    return 0.5 * (-Math.pow(2, -10 * (k - 1)) + 2)
  }
}
const circ = {
  in(k: number) {
    return 1 - Math.sqrt(1 - k * k)
  },
  out(k: number) {
    return Math.sqrt(1 - --k * k)
  },
  inout(k: number) {
    if ((k *= 2) < 1) {
      return -0.5 * (Math.sqrt(1 - k * k) - 1)
    }
    return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1)
  }
}
const back = {
  in(k: number) {
    const s = 1.70158
    return k * k * ((s + 1) * k - s)
  },
  out(k: number) {
    const s = 1.70158
    return --k * k * ((s + 1) * k + s) + 1
  },
  inout(k: number) {
    const s = 1.70158 * 1.525
    if ((k *= 2) < 1) {
      return 0.5 * (k * k * ((s + 1) * k - s))
    }
    return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2)
  }
}
const elastic = {
  in(k: number) {
    let s: number | undefined = undefined
    // a = 0.1
    const p = 0.4
    if (k === 0) {
      return 0
    }
    if (k === 1) {
      return 1
    }
    // if a < 1
    const a = 1
    s = p / 4
    // else
    //   s = p * Math.asin(1 / a) / (2 * Math.PI)
    return -(
      a *
      Math.pow(2, 10 * (k -= 1)) *
      Math.sin(((k - s) * (2 * Math.PI)) / p)
    )
  },
  out(k: number) {
    let s: number | undefined = undefined
    // a = 0.1
    const p = 0.4
    if (k === 0) {
      return 0
    }
    if (k === 1) {
      return 1
    }
    // if not a or a < 1
    const a = 1
    s = p / 4
    // else
    //   s = p * Math.asin(1 / a) / (2 * Math.PI)
    return (
      a * Math.pow(2, -10 * k) * Math.sin(((k - s) * (2 * Math.PI)) / p) + 1
    )
  },
  inout(k: number) {
    let s: number | undefined = undefined
    // a = 0.1
    const p = 0.4
    if (k === 0) {
      return 0
    }
    if (k === 1) {
      return 1
    }
    // if not a or a < 1
    const a = 1
    s = p / 4
    // else
    //   s = p * Math.asin(1 / a) / (2 * Math.PI)
    if ((k *= 2) < 1) {
      return (
        -0.5 *
        (a *
          Math.pow(2, 10 * (k -= 1)) *
          Math.sin(((k - s) * (2 * Math.PI)) / p))
      )
    }
    return (
      a *
        Math.pow(2, -10 * (k -= 1)) *
        Math.sin(((k - s) * (2 * Math.PI)) / p) *
        0.5 +
      1
    )
  }
}
const bounce = {
  in(k: number) {
    return 1 - bounce.out(1 - k)
  },
  out(k: number) {
    if (k < 1 / 2.75) {
      return 7.5625 * k * k
    } else if (k < 2 / 2.75) {
      return 7.5625 * (k -= 1.5 / 2.75) * k + 0.75
    } else if (k < 2.5 / 2.75) {
      return 7.5625 * (k -= 2.25 / 2.75) * k + 0.9375
    } else {
      return 7.5625 * (k -= 2.625 / 2.75) * k + 0.984375
    }
  },
  inout(k: number) {
    if (k < 0.5) {
      return easing.bounce.in(k * 2) * 0.5
    }
    return easing.bounce.out(k * 2 - 1) * 0.5 + 0.5
  }
}

export class Easing {
  static mix = mix(new Easing())

  bezier = bezier
  PathEasing = PathEasing
  path = new PathEasing('creator').create
  approximate = approximateSample
  linear = linear
  ease = ease
  sin = sin
  quad = quad
  cubic = cubic
  quart = quart
  quint = quint
  expo = expo
  circ = circ
  back = back
  elastic = elastic
  bounce = bounce

  // ---

  // Method to inverse the easing value
  // @param {number} Value to inverse
  // @return {number} Inverse value
  inverse(p: number) {
    return 1 - p
  }

  // ---

  /**
   * Method to parse easing
   * @method parseEasing
   *
   * @param {String, Function, Array} easing
   *   - *String*: Easing name delimited by dot e.g "cubic.in" or "elastic.out"
   *     all available options you can find at
   *     [easing module](easing.coffee.html) page.
   *   - *String*: SVG path coordinates in rectangle of 100x100
   *   - *Function*: function that receive current time and returns modified one
   *     e.g. *function (k) { return k*k; }*. The function can be created by
   *     calling mojs.easing.bezier(0.55,0.085,0.68,0.53) or
   *     mojs.easing.path('M0,0 ...') function.
   *
   * @return {Function}
   */
  parseEasing(easing: EasingValue) {
    if (easing == null) {
      easing = 'linear.none'
    }

    if (typeof easing === 'string') {
      if (easing.charAt(0).toLowerCase() === 'm') {
        return this.path(easing)
      } else {
        easing = this._splitEasing(easing) as any[]
        const easingParent = (this as any)[easing[0]]
        if (!easingParent) {
          h.error(
            `Easing with name "${easing[0]}" was not found, fallback to "linear.none" instead`
          )
          return this['linear']['none']
        }
        return easingParent[easing[1]]
      }
    }
    if (Array.isArray(easing)) {
      return this.bezier(easing[0], easing[1], easing[2], easing[3])
    }
    if (typeof easing === 'function') {
      return easing
    }
  }

  // ---

  // Method to parse easing name string
  // @method splitEasing
  //
  // @param {string} easing name. All easing names can be found
  //                 at [easing module](easing.coffee.html) page.
  // @return {Array}
  _splitEasing(string: string | (() => string[]) | number): string[] | unknown {
    if (typeof string === 'function') {
      return string
    }
    if (typeof string === 'string' && string.length) {
      const split = string.split('.')
      const firstPart = split[0].toLowerCase() || 'linear'
      const secondPart = split[1].toLowerCase() || 'none'
      return [firstPart, secondPart]
    } else {
      return ['linear', 'none']
    }
  }
}

const easing = new Easing()

export default easing

import h from './h'
import Tunable from './tunable'
import Timeline from './tween/timeline'

interface StaggerOption {
  isRunLess: boolean
  quantifier: any
  index: number
}

class Stagger extends Tunable {
  _modules: Tunable[] = []

  constructor(options, Module) {
    super()
    return this._init(options, Module)
  }

  /*
    Method to create then chain on child modules.
    @param {object} Then options.
    @return {object} this.
  */
  then(o) {
    if (o == null) {
      return this
    }
    for (let i = 0; i < this._modules.length; i++) {
      // get child module's option and pass to the child `then`
      this._modules[i].then(this._getOptionByIndex(i, o))
    }
    ;(this.timeline as Timeline)._recalcTotalDuration()
    return this
  }

  /*
    Method to tune child modules.
    @param {object} Tune options.
    @return {object} this.
  */
  tune(o) {
    if (o == null) {
      return this
    }
    for (let i = 0; i < this._modules.length; i++) {
      // get child module's option and pass to the child `then`
      this._modules[i].tune(this._getOptionByIndex(i, o))
    }
    ;(this.timeline as Timeline)._recalcTotalDuration()
    return this
  }

  /*
    Method to generate child modules.
    @return {object} this.
  */
  generate() {
    for (let i = 0; i < this._modules.length; i++) {
      // get child module's option and pass to the child `then`
      this._modules[i].generate()
    }
    ;(this.timeline as Timeline)._recalcTotalDuration()
    return this
  }

  /*
    Method to get an option by modulo and name.
    @param {string} Name of the property to get.
    @param {number} Index for the modulo calculation.
    @param {object} Options hash to look in.
    @return {Any} Property.
  */
  _getOptionByMod(name, i, store) {
    let props = store[name]

    // if not dom list then clone it to array
    if (
      props + '' === '[object NodeList]' ||
      props + '' === '[object HTMLCollection]'
    )
      props = Array.prototype.slice.call(props, 0)

    // get the value in array or return the value itself
    const value = Array.isArray(props) ? props[i % props.length] : props

    // check if value has the stagger expression, if so parse it
    return h.parseIfStagger(value, i)
  }

  /*
    Method to get option by modulo of index.
    @param {number} Index for modulo calculations.
    @param {object} Options hash to look in.
  */
  _getOptionByIndex(i, store): StaggerOption {
    const options = {}
    Object.keys(store).forEach(
      (key) => (options[key] = this._getOptionByMod(key, i, store))
    )
    return options as StaggerOption
  }

  /*
    Method to get total child modules quantity.
    @param  {string} Name of quantifier in options hash.
    @param  {object} Options hash object.
    @return {number} Number of child object that should be defined.
  */
  _getChildQuantity(name, store) {
    // if number was set
    if (typeof name === 'number') {
      return name
    }

    const quantifier = store[name]
    if (Array.isArray(quantifier)) {
      return quantifier.length
    } else if (quantifier + '' === '[object NodeList]') {
      return quantifier.length
    } else if (quantifier + '' === '[object HTMLCollection]') {
      return Array.prototype.slice.call(quantifier, 0).length
    } else if (quantifier instanceof HTMLElement) {
      return 1
    } else if (typeof quantifier === 'string') {
      return 1
    }
  }

  /*
    Method to make stagger form options
    @param {object} Options.
    @param {object} Child class.
  */
  _init(options, Module) {
    const count = this._getChildQuantity(options.quantifier || 'el', options)
    this._createTimeline(options)
    this._modules = []
    for (let i = 0; i < count; i++) {
      // get child module's option
      const option = this._getOptionByIndex(i, options)
      option.isRunLess = true

      // set index of the module
      option.index = i

      // create child module
      const module = new Module(option)
      this._modules.push(module)

      // add child module's timeline to the self timeline
      ;(this.timeline as Timeline).add(module)
    }
    return this
  }

  /*
    Method to create timeline.
    @param {object} Timeline options.
  */
  _createTimeline(options: { timeline?: Timeline } = {}) {
    this.timeline = new Timeline(options.timeline)
  }

  /* @overrides @ Tweenable */
  _makeTween() {}

  _makeTimeline() {}
}

export default function stagger(Module) {
  return (options) => new Stagger(options, Module)
}

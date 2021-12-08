export type PossiblyUndefined<T> = T | undefined
export type PossiblyNullOrUndefined<T> = T | undefined | null
export type Nullable<T> = T | null

export interface Unit {
  unit: string
  isStrict: boolean
  value: string | number | undefined
  string: string
}

export type Point = SVGPoint

export type PossibleUnit = PossiblyUndefined<Unit | Partial<Color> | string | number>

export interface Color {
  r: number
  g: number
  b: number
  a: number
}

export interface Prefix {
  dom?: string
  lowercase: 'webkit' | 'moz' | 'o' | 'ms'
  css: '-webkit-' | '-moz-' | '-o-' | '-ms-'
  js: string
}

export interface CurveValue {
  (arg0: any): any
  _parent: any
}

export type EasingValue = string | number[] | (() => string) | CurveValue

export interface BaseDelta {
  type: 'color' | 'array' | 'unit' | 'number'
  name: string
  easing?: Nullable<EasingValue>
  curve: CurveValue
}

export interface ColorDelta extends BaseDelta {
  start: Partial<Color>
  end: Partial<Color>
  delta: Color
}

export interface ArrayDelta extends BaseDelta {
  start: PossibleUnit[]
  end: PossibleUnit[]
  delta: PossibleUnit[]
}

export interface UnitDelta extends BaseDelta {
  start: PossibleUnit
  end: PossibleUnit
  delta: number
}

export interface NumberDelta extends BaseDelta {
  start: number
  end: number
  delta: number
}

export type DeltaType = ColorDelta | ArrayDelta | UnitDelta | NumberDelta

export type DeltaWithoutTweenOpts<T extends DeltaType = DeltaType> = Omit<T, keyof TweenOptions>

export type DeltaTypeStart = PossibleUnit[] | PossibleUnit | number
export type DeltaTypeEnd = PossibleUnit[] | PossibleUnit | number


export interface ModuleBaseObj extends PropertyMap {
  index?: number
  ctx?: any
}

export interface PropertyMap {
  strokeDashoffset: number
  strokeDasharray: number
  origin: number
}

export interface SkipPropsDelta {
  timeline: number
  prevChainModule: number
  callbacksContext: number
}

export interface UnitOptions {
  left: number
  top: number
  x: number
  y: number
  rx: number
  ry: number
}

export interface TweenOptions {
  duration: number
  delay: number
  speed: number
  repeat: number
  easing: number
  backwardEasing: number
  isYoyo: number
  shiftTime: number
  isReversed: number
  callbacksContext: number
}

export interface TweenDefaults {
  duration: number
  delay: number
  repeat: number
  speed: number
  isYoyo: boolean
  easing: string
  backwardEasing: any | null
  name: null | string
  nameBase: string
  isChained: boolean
  onProgress: (() => void) | null
  onStart: (() => void) | null
  onRefresh: (() => void) | null
  onComplete: (() => void) | null
  onRepeatStart: (() => void) | null
  onRepeatComplete: (() => void) | null
  onFirstUpdate: (() => void) | null
  onUpdate: (() => void) | null
  onPlaybackStart: (() => void) | null
  onPlaybackPause: (() => void) | null
  onPlaybackStop: (() => void) | null
  onPlaybackComplete: (() => void) | null
  callbacksContext: any | null
}

export type TweenState = 'pause' | 'play' | 'reverse' | 'stop'

export interface Callbacks {
  onRefresh: number
  onStart: number
  onComplete: number
  onFirstUpdate: number
  onUpdate: number
  onProgress: number
  onRepeatStart: number
  onRepeatComplete: number
  onPlaybackStart: number
  onPlaybackPause: number
  onPlaybackStop: number
  onPlaybackComplete: number
}

export interface MergeFlags<T = any> {
  isTimelineLess: boolean
  isShowStart: boolean
  isRefreshState: boolean
  callbacksContext: any | T
  prevChainModule: T | any
  masterModule: T
}

export interface IgnoreDeltasMap {
  prevChainModule: number
  masterModule: number
}

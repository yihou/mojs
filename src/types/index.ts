import { Easing } from '../easing/easing'
import Curve from '../shapes/curve'

export interface Unit {
  unit: string
  isStrict: boolean
  value: string | number | undefined
  string: string
}

export type PossibleUnit = Unit | string | number | undefined

export interface Color {
  r: number
  g: number
  b: number
  a: number
}

export interface ColorObject {
  r: number
  g: number
  b: number
  a: number
}

export interface Prefix {
  dom?: string
  lowercase: string
  css: string
  js: string
}

export interface BaseDelta {
  type: string
  name: string
  easing?: Easing
  curve: Curve
}

export interface ColorDelta extends BaseDelta {
  start: ColorObject
  end: ColorObject
  delta: ColorObject
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

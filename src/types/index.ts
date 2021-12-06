import {Easing} from '../easing/easing'
import Curve from '../shapes/curve'

export interface Unit {
  unit: string,
  isStrict: boolean,
  value: string | number | undefined,
  string: string,
}

export type PossibleUnit = Unit | string | number | undefined

export interface Color {
  r: number
  g: number
  b: number
  a: number
}

export interface ColorObject {
  r: number,
  g: number,
  b: number,
  a: number,
}

export interface BaseDelta {
  name: string
  easing: Easing
  curve: Curve
}

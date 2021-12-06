class Approximate extends Function {
  getSamples?: () => any
}

interface Samples {
  base?: any
}

/*
  Method to bootstrap approximation function.
  @private
  @param   {object} Samples Object.
  @returns {Function} Approximate function.
*/
const approximate: Approximate = (samples: Samples) => {
  const n = samples.base
  const samplesAmount = Math.pow(10, n)
  const samplesStep = 1 / samplesAmount

  function RoundNumber(input, numberDecimals) {
    numberDecimals = +numberDecimals || 0 // +var magic!

    const multiplier = Math.pow(10.0, numberDecimals)

    return Math.round(input * multiplier) / multiplier
  }

  const cached: Approximate = function cached(p) {
    let nextIndex
    let nextValue
    const newKey = RoundNumber(p, n)
    const sample = samples[newKey.toString()]

    if (Math.abs(p - newKey) < samplesStep) {
      return sample
    }

    if (p > newKey) {
      nextIndex = newKey + samplesStep
      nextValue = samples[nextIndex]
    } else {
      nextIndex = newKey - samplesStep
      nextValue = samples[nextIndex]
    }

    const dLength = nextIndex - newKey
    const dValue = nextValue - sample
    if (dValue < samplesStep) {
      return sample
    }

    const progressScale = (p - newKey) / dLength
    const coef = nextValue > sample ? -1 : 1
    const scaledDifference = coef * progressScale * dValue

    return sample + scaledDifference
  }

  cached.getSamples = () => {
    return samples
  }

  return cached
}

/*
    Method to take samples of the function and call the approximate
    method with the function and samples. Or if samples passed - pipe
    them to the _proximate method without sampling.
    @private
    @param {Function} Function to sample.
    @param {Number, Object, String} Precision or precomputed samples.
  */
export const approximateSample = (fn, n: number | object | string = 4) => {
  const nType = typeof n

  let samples: Samples = {}
  if (nType === 'number') {
    let p = 0
    const samplesCount = Math.pow(10, n as number)
    const step = 1 / samplesCount

    samples[0] = fn(0)
    for (let i = 0; i < samplesCount - 1; i++) {
      p += step

      const index = parseFloat(p.toFixed(n as number))
      samples[index] = fn(p)
    }
    samples[1] = fn(1)

    samples.base = n
  } else if (nType === 'object') {
    samples = n as Samples
  } else if (nType === 'string') {
    samples = JSON.parse(n as string)
  }

  return approximate(samples)
}

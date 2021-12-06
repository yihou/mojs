/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {Easing} from './easing'

let easing: Easing;

// Method to check if need to parse easing expression.
//
// @param  {object} Mix array item
// @return {Function, Number} Parsed easing or static easing number.
const parseIfEasing = function(item){
  if (typeof item.value === 'number') {
    return item.value;
  } else {
    return easing?.parseEasing(item.value);
  }
};
// ---

// Method to sort an array form smallest to largest.
//
// @param  {Any} Array item.
// @param  {Any} Array item.
// @return {number} Comparation indicator.
// @side-effect  Check if value on **array item** should be
//               parsed, and parses it if so.
const sort = function(a, b){
  a.value = parseIfEasing(a); b.value = parseIfEasing(b);

  let returnValue = 0;
  (a.to < b.to) && (returnValue = -1);
  (a.to > b.to) && (returnValue =  1);
  return returnValue;
};

// ---

// Method to get the nearest to item to the progress.
//
// @param  {Array} Array to search in.
// @param  {number} Progress to search for.
// @return {number} Nearest item index.
const getNearest = function(array, progress){
  let index = 0;
  for (let i = 0; i < array.length; i++) { const value = array[i]; index = i; if (value.to > progress) { break; } }
  return index;
};
// ---

// Method to get the nearest to item to the progress.
//
// @param  {Array} Array to search in.
// @param  {number} Progress to search for.
// @return {number} Nearest item index.
const mix = function(...args){
  // if there are more than 1 mix values - sort the array
  if (args.length > 1) { args = args.sort(sort);
  // if there is just one value - parse it's easing expression
  } else { args[0].value = parseIfEasing(args[0]); }

  return function(progress){
    const index = getNearest(args, progress);
    if (index !== -1) {
      const {
        value
      } = args[index];
      // return 1 if not defined
      if ((index === (args.length-1)) && (progress > args[index].to)) { return 1; }
      // evaluate the function if it was passed or return the value itself
      if (typeof value === 'function') { return value(progress); } else { return value; }
    }
  };
};
// ---

// Method initialize the mix function.
// It was made since requiring "easing" module causes
// cycle dependencies issue but we need the module.
// So we pass it to the create method and it assigns it to
// already declared easing variable.
//
// @param  {object} Easing module.
// @return {Function} Mix function.
const create = function(e){ easing = e; return mix; };

export default create;

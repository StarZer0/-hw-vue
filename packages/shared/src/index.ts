export const isObject = (value) => typeof value === 'object' && value !== null;
export const extend = Object.assign;
export const isArray = Array.isArray;
export const isFunction = (val) => typeof val === 'function';
export const isNumber = (val) => typeof val === 'number';
export const isString = (val) => typeof val === 'string';
export const isIntegerKey = (val) => parseInt(val) + '' === val;
export const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);
export const isEqual = (left, right) => left === right;

export * from './shapeFlags';

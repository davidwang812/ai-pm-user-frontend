// utils/validators.js - 表单验证工具函数

/**
 * 验证邮箱格式
 * @param {*} rule - 验证规则
 * @param {string} value - 验证值
 * @param {Function} callback - 回调函数
 */
export const validateEmail = (rule, value, callback) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  
  if (!value) {
    callback(new Error('请输入邮箱地址'))
  } else if (!emailRegex.test(value)) {
    callback(new Error('请输入有效的邮箱地址'))
  } else {
    callback()
  }
}

/**
 * 验证手机号码
 * @param {*} rule - 验证规则
 * @param {string} value - 验证值
 * @param {Function} callback - 回调函数
 */
export const validatePhone = (rule, value, callback) => {
  const phoneRegex = /^1[3-9]\d{9}$/
  
  if (!value) {
    callback(new Error('请输入手机号码'))
  } else if (!phoneRegex.test(value)) {
    callback(new Error('请输入有效的手机号码'))
  } else {
    callback()
  }
}

/**
 * 验证密码强度
 * @param {*} rule - 验证规则
 * @param {string} value - 验证值
 * @param {Function} callback - 回调函数
 */
export const validatePassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入密码'))
    return
  }
  
  if (value.length < 8) {
    callback(new Error('密码长度不能少于8位'))
    return
  }
  
  if (value.length > 20) {
    callback(new Error('密码长度不能超过20位'))
    return
  }
  
  // 检查密码强度
  const hasLowerCase = /[a-z]/.test(value)
  const hasUpperCase = /[A-Z]/.test(value)
  const hasNumber = /\d/.test(value)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value)
  
  const strength = [hasLowerCase, hasUpperCase, hasNumber, hasSpecialChar].filter(Boolean).length
  
  if (strength < 2) {
    callback(new Error('密码强度太弱，请包含大小写字母、数字或特殊字符中的至少两种'))
  } else {
    callback()
  }
}

/**
 * 验证确认密码
 * @param {string} password - 原密码
 * @returns {Function} 验证函数
 */
export const validateConfirmPassword = (password) => {
  return (rule, value, callback) => {
    if (!value) {
      callback(new Error('请再次输入密码'))
    } else if (value !== password) {
      callback(new Error('两次输入的密码不一致'))
    } else {
      callback()
    }
  }
}

/**
 * 验证用户名
 * @param {*} rule - 验证规则
 * @param {string} value - 验证值
 * @param {Function} callback - 回调函数
 */
export const validateUsername = (rule, value, callback) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  
  if (!value) {
    callback(new Error('请输入用户名'))
  } else if (!usernameRegex.test(value)) {
    callback(new Error('用户名只能包含字母、数字和下划线，长度3-20位'))
  } else {
    callback()
  }
}

/**
 * 验证URL格式
 * @param {*} rule - 验证规则
 * @param {string} value - 验证值
 * @param {Function} callback - 回调函数
 */
export const validateURL = (rule, value, callback) => {
  const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
  
  if (!value) {
    callback()
  } else if (!urlRegex.test(value)) {
    callback(new Error('请输入有效的URL地址'))
  } else {
    callback()
  }
}

/**
 * 验证产品名称
 * @param {*} rule - 验证规则
 * @param {string} value - 验证值
 * @param {Function} callback - 回调函数
 */
export const validateProductName = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入产品名称'))
  } else if (value.length < 2) {
    callback(new Error('产品名称至少2个字符'))
  } else if (value.length > 50) {
    callback(new Error('产品名称不能超过50个字符'))
  } else {
    callback()
  }
}

/**
 * 验证数字范围
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {Function} 验证函数
 */
export const validateNumberRange = (min, max) => {
  return (rule, value, callback) => {
    if (value === undefined || value === null || value === '') {
      callback()
      return
    }
    
    const num = Number(value)
    if (isNaN(num)) {
      callback(new Error('请输入有效的数字'))
    } else if (num < min) {
      callback(new Error(`数值不能小于${min}`))
    } else if (num > max) {
      callback(new Error(`数值不能大于${max}`))
    } else {
      callback()
    }
  }
}

/**
 * 验证整数
 * @param {*} rule - 验证规则
 * @param {*} value - 验证值
 * @param {Function} callback - 回调函数
 */
export const validateInteger = (rule, value, callback) => {
  if (value === undefined || value === null || value === '') {
    callback()
    return
  }
  
  if (!Number.isInteger(Number(value))) {
    callback(new Error('请输入整数'))
  } else {
    callback()
  }
}

/**
 * 验证必填项
 * @param {string} message - 错误消息
 * @returns {Object} 验证规则
 */
export const requiredRule = (message = '此项为必填项') => ({
  required: true,
  message,
  trigger: 'blur'
})

/**
 * 创建长度验证规则
 * @param {number} min - 最小长度
 * @param {number} max - 最大长度
 * @returns {Object} 验证规则
 */
export const lengthRule = (min, max) => ({
  min,
  max,
  message: `长度应在 ${min} 到 ${max} 个字符之间`,
  trigger: 'blur'
})

/**
 * 组合验证规则
 * @param  {...Object} rules - 验证规则数组
 * @returns {Array} 组合后的验证规则
 */
export const combineRules = (...rules) => {
  return rules.filter(Boolean)
}
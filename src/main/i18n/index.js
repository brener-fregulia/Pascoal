const path    = require('path')
const strings = require('./strings.json')

const SUPPORTED = ['pt-BR', 'en-US']
const DEFAULT   = 'pt-BR'

function getLocale() {
  try {
    const { app } = require('electron')
    const locale  = app.getLocale()
    return SUPPORTED.includes(locale) ? locale : DEFAULT
  } catch {
    return DEFAULT
  }
}

function t(key) {
  const locale = getLocale()
  return strings[locale]?.[key] ?? strings[DEFAULT]?.[key] ?? key
}

module.exports = { t }
